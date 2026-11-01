/**
 * Server-side email/password auth + verification (spec A5 / K5).
 * Sessions: httpOnly cookie `marginos_session`.
 */
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { dbConfigured, query } from './db.mjs'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

const SESSION_DAYS = 30
const VERIFY_HOURS = 24
const COOKIE = 'marginos_session'

const loginHits = new Map()

function rateLimit(key, limit, windowMs) {
  const now = Date.now()
  const row = loginHits.get(key) || { n: 0, start: now }
  if (now - row.start > windowMs) {
    row.n = 0
    row.start = now
  }
  row.n += 1
  loginHits.set(key, row)
  return row.n <= limit
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    out[k] = decodeURIComponent(v)
  }
  return out
}

function sessionCookie(sessionId, maxAgeSec) {
  // App Platform terminates TLS; always Secure in hosted envs unless explicitly disabled.
  const secure =
    process.env.FORCE_SECURE_COOKIES !== '0' &&
    (process.env.NODE_ENV === 'production' ||
      process.env.FORCE_SECURE_COOKIES === '1' ||
      Boolean(process.env.DATABASE_URL))
  const parts = [
    `${COOKIE}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.email_verified,
    plan: row.plan === 'pro' ? 'pro' : 'free',
    licenceState: row.licence_state,
    timeZone: row.time_zone || 'Europe/London',
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    lastSignInAt: row.last_sign_in_at?.toISOString?.() || row.last_sign_in_at,
    authProvider: 'email',
  }
}

async function createSession(userId) {
  const id = newId('sess')
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await query(`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`, [
    id,
    userId,
    expires.toISOString(),
  ])
  return { id, expires }
}

export async function userFromRequest(req) {
  if (!dbConfigured()) return null
  const cookies = parseCookies(req.headers.cookie)
  const sid = cookies[COOKIE]
  if (!sid) return null
  const { rows } = await query(
    `SELECT u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sid],
  )
  return rows[0] || null
}

function sesMailer() {
  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-north-1'
  const from = process.env.SES_FROM_ADDRESS || process.env.SES_FROM_EMAIL || ''
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  if (!from || !accessKeyId || !secretAccessKey) return { error: 'SES is not configured' }
  return { region, from, accessKeyId, secretAccessKey }
}

async function sendVerifyEmail(to, verifyUrl) {
  const cfg = sesMailer()
  if (cfg.error) return { ok: false, message: cfg.error }
  const client = new SESv2Client({
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: cfg.from,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: 'Verify your MarginOS email', Charset: 'UTF-8' },
          Body: {
            Text: {
              Data: `Verify your MarginOS email.\n\nOpen within 24 hours:\n${verifyUrl}\n`,
              Charset: 'UTF-8',
            },
            Html: {
              Data: `<p>Verify your MarginOS email address.</p><p><a href="${verifyUrl}">Confirm email</a></p><p style="color:#555;font-size:14px">${verifyUrl}</p>`,
              Charset: 'UTF-8',
            },
          },
        },
      },
    }),
  )
  return { ok: true }
}

async function mintVerification(userId, origin) {
  const token = `ver_${crypto.randomBytes(16).toString('hex')}`
  const expires = new Date(Date.now() + VERIFY_HOURS * 60 * 60 * 1000)
  await query(
    `INSERT INTO verification_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expires.toISOString()],
  )
  const base = origin || process.env.APP_ORIGIN || 'https://marginos.online'
  const verifyUrl = `${base.replace(/\/$/, '')}/?verify=${encodeURIComponent(token)}`
  return { token, verifyUrl }
}

export async function handleAuthContinue(body, req) {
  if (!dbConfigured()) {
    return { status: 503, body: { ok: false, message: 'Auth database is not configured.' } }
  }
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const password = String(body.password || '')
  const timeZone = String(body.timeZone || 'Europe/London')
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'local'
  if (!rateLimit(`auth:${ip}`, 30, 15 * 60 * 1000)) {
    return { status: 429, body: { ok: false, message: 'Too many attempts. Try again later.' } }
  }
  if (!email || !email.includes('@') || password.length < 8) {
    return {
      status: 400,
      body: { ok: false, message: 'Valid email and password (8+ characters) required.' },
    }
  }

  const existing = await query(`SELECT * FROM users WHERE email = $1`, [email])
  let user = existing.rows[0]
  if (!user) {
    const id = `acct_${crypto.randomBytes(10).toString('hex')}`
    const hash = await bcrypt.hash(password, 12)
    const inserted = await query(
      `INSERT INTO users (id, email, password_hash, email_verified, plan, time_zone, last_sign_in_at)
       VALUES ($1, $2, $3, FALSE, 'free', $4, NOW())
       RETURNING *`,
      [id, email, hash, timeZone],
    )
    user = inserted.rows[0]
  } else {
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return { status: 401, body: { ok: false, message: 'Email or password is incorrect.' } }
    }
    await query(`UPDATE users SET last_sign_in_at = NOW(), time_zone = COALESCE($2, time_zone), updated_at = NOW() WHERE id = $1`, [
      user.id,
      timeZone,
    ])
    const refreshed = await query(`SELECT * FROM users WHERE id = $1`, [user.id])
    user = refreshed.rows[0]
  }

  const session = await createSession(user.id)
  const headers = { 'Set-Cookie': sessionCookie(session.id, SESSION_DAYS * 24 * 60 * 60) }

  let verifyQueued = false
  if (!user.email_verified) {
    const origin = body.origin || req.headers.origin || 'https://marginos.online'
    if (rateLimit(`verify:${user.id}`, 5, 60 * 60 * 1000)) {
      const { verifyUrl } = await mintVerification(user.id, origin)
      const sent = await sendVerifyEmail(user.email, verifyUrl)
      verifyQueued = sent.ok
    }
  }

  return {
    status: 200,
    headers,
    body: {
      ok: true,
      user: publicUser(user),
      message: user.email_verified
        ? 'Signed in.'
        : verifyQueued
          ? 'Signed in. Check your email for a verification link (24h).'
          : 'Signed in. Verify your email before upload or checkout.',
    },
  }
}

export async function handleAuthMe(req) {
  if (!dbConfigured()) {
    return { status: 503, body: { ok: false, message: 'Auth database is not configured.' } }
  }
  const user = await userFromRequest(req)
  if (!user) return { status: 401, body: { ok: false, message: 'Not signed in.' } }
  return { status: 200, body: { ok: true, user: publicUser(user) } }
}

export async function handleAuthLogout() {
  return {
    status: 200,
    headers: { 'Set-Cookie': clearSessionCookie() },
    body: { ok: true },
  }
}

export async function handleAuthLogoutDestroy(req) {
  if (dbConfigured()) {
    const cookies = parseCookies(req.headers.cookie)
    const sid = cookies[COOKIE]
    if (sid) await query(`DELETE FROM sessions WHERE id = $1`, [sid])
  }
  return handleAuthLogout()
}

export async function handleSendVerification(req, body) {
  if (!dbConfigured()) {
    return { status: 503, body: { ok: false, message: 'Auth database is not configured.' } }
  }
  const user = await userFromRequest(req)
  if (!user) return { status: 401, body: { ok: false, message: 'Sign in first.' } }
  if (user.email_verified) {
    return { status: 200, body: { ok: true, message: 'Email already verified.' } }
  }
  if (!rateLimit(`verify:${user.id}`, 5, 60 * 60 * 1000)) {
    return { status: 429, body: { ok: false, message: 'Too many verification emails. Try later.' } }
  }
  const origin = body?.origin || req.headers.origin || 'https://marginos.online'
  const { verifyUrl } = await mintVerification(user.id, origin)
  const sent = await sendVerifyEmail(user.email, verifyUrl)
  if (!sent.ok) return { status: 502, body: { ok: false, message: sent.message } }
  return { status: 200, body: { ok: true, message: 'Verification email sent (24h single-use link).' } }
}

export async function handleVerifyToken(token) {
  if (!dbConfigured()) {
    return { status: 503, body: { ok: false, message: 'Auth database is not configured.' } }
  }
  const t = String(token || '')
  if (!t) return { status: 400, body: { ok: false, message: 'Token required.' } }
  const { rows } = await query(
    `SELECT * FROM verification_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [t],
  )
  const row = rows[0]
  if (!row) {
    return { status: 400, body: { ok: false, message: 'Verification link is invalid or expired.' } }
  }
  await query(`UPDATE verification_tokens SET used_at = NOW() WHERE token = $1`, [t])
  await query(
    `UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1`,
    [row.user_id],
  )
  const userRes = await query(`SELECT * FROM users WHERE id = $1`, [row.user_id])
  return {
    status: 200,
    body: { ok: true, message: 'Email verified.', user: publicUser(userRes.rows[0]) },
  }
}

export async function setUserPlan(userId, plan, licenceState = 'active') {
  if (!dbConfigured() || !userId) return
  await query(
    `UPDATE users SET plan = $2, licence_state = $3, updated_at = NOW() WHERE id = $1`,
    [userId, plan, licenceState],
  )
}

export async function setUserPlanByEmail(email, plan, licenceState = 'active') {
  if (!dbConfigured() || !email) return
  await query(
    `UPDATE users SET plan = $2, licence_state = $3, updated_at = NOW() WHERE email = $1`,
    [email.trim().toLowerCase(), plan, licenceState],
  )
}

/** Reconcile Pro from completed Stripe Checkout sessions for this account email. */
export async function handleSyncLicence(req) {
  if (!dbConfigured()) {
    return { status: 503, body: { ok: false, message: 'Auth database is not configured.' } }
  }
  const user = await userFromRequest(req)
  if (!user) return { status: 401, body: { ok: false, message: 'Sign in first.' } }
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return { status: 503, body: { ok: false, message: 'Stripe is not configured.' } }
  }
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(secret, {
    apiVersion: process.env.STRIPE_API_VERSION || '2025-03-31.basil',
  })
  const sessions = await stripe.checkout.sessions.list({ limit: 40, status: 'complete' })
  const email = user.email.toLowerCase()
  const hit = sessions.data.find((s) => {
    const e = (s.customer_details?.email || s.customer_email || '').toLowerCase()
    const ref = s.client_reference_id || s.metadata?.marginos_account_id || ''
    return e === email || ref === user.id
  })
  if (!hit) {
    const refreshed = await query(`SELECT * FROM users WHERE id = $1`, [user.id])
    return {
      status: 200,
      body: { ok: true, user: publicUser(refreshed.rows[0]), message: 'No completed Checkout found.' },
    }
  }
  await setUserPlan(user.id, 'pro', 'active')
  const refreshed = await query(`SELECT * FROM users WHERE id = $1`, [user.id])
  return {
    status: 200,
    body: { ok: true, user: publicUser(refreshed.rows[0]), message: 'Pro licence restored from Stripe.' },
  }
}

export { COOKIE, sessionCookie }
