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
/** K57 / Q34 defaults */
const RESET_MINUTES = Number(process.env.PASSWORD_RESET_MINUTES || 60)
const RESET_PER_EMAIL = Number(process.env.PASSWORD_RESET_PER_EMAIL || 3)
const RESET_PER_IP = Number(process.env.PASSWORD_RESET_PER_IP || 10)
const RESET_WINDOW_MS = 60 * 60 * 1000
const MIN_PASSWORD = 15
const COOKIE = 'marginos_session'
const GENERIC_RESET_MSG = "If an account exists, we've sent a reset link."

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
  const plan = String(row.plan || 'free').toLowerCase()
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.email_verified,
    plan: ['starter', 'growth', 'pro', 'scale', 'free'].includes(plan) ? plan : 'free',
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
          Subject: { Data: 'Verify your Margins 365 email', Charset: 'UTF-8' },
          Body: {
            Text: {
              Data: `Verify your Margins 365 email.\n\nOpen within 24 hours:\n${verifyUrl}\n`,
              Charset: 'UTF-8',
            },
            Html: {
              Data: `<p>Verify your Margins 365 email address.</p><p><a href="${verifyUrl}">Confirm email</a></p><p style="color:#555;font-size:14px">${verifyUrl}</p>`,
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
  if (!email || !email.includes('@') || password.length < MIN_PASSWORD) {
    return {
      status: 400,
      body: {
        ok: false,
        message: `Valid email and password (${MIN_PASSWORD}+ characters) required.`,
      },
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

async function sendSesSimple(to, subject, text, html) {
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
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      },
    }),
  )
  return { ok: true }
}

async function sendPasswordResetEmail(to, resetUrl) {
  const subject = 'Reset your Margins 365 password'
  const text = `Reset your Margins 365 password.\n\nSet a new password within ${RESET_MINUTES} minutes:\n${resetUrl}\n\nIf you did not ask for this, you can ignore this email.\n`
  const html = `<p>Reset your Margins 365 password.</p><p><a href="${resetUrl}">Set a new password</a></p><p style="color:#555;font-size:14px">This link expires in ${RESET_MINUTES} minutes.</p><p style="color:#555;font-size:14px">${resetUrl}</p><p style="color:#555;font-size:14px">If you did not ask for this, you can ignore this email.</p>`
  return sendSesSimple(to, subject, text, html)
}

async function sendGoogleOnlyResetEmail(to) {
  const subject = 'Sign in to Margins 365 with Google'
  const text = `This Margins 365 account uses Google sign-in.\n\nThere is no password to reset. Open Margins 365 and choose Continue with Google.\n\nIf you did not ask for this, you can ignore this email.\n`
  const html = `<p>This Margins 365 account uses <strong>Google sign-in</strong>.</p><p>There is no password to reset. Open Margins 365 and choose <strong>Continue with Google</strong>.</p><p style="color:#555;font-size:14px">If you did not ask for this, you can ignore this email.</p>`
  return sendSesSimple(to, subject, text, html)
}

async function sendPasswordChangedEmail(to) {
  const subject = 'Your password was changed'
  const text = `Your Margins 365 password was changed.\n\nAll other signed-in sessions were signed out. If you did not make this change, reply to this email or contact support from the privacy policy contact address.\n`
  const html = `<p>Your Margins 365 password was changed.</p><p>All other signed-in sessions were signed out.</p><p style="color:#555;font-size:14px">If you did not make this change, reply to this email or use the privacy policy contact address.</p>`
  return sendSesSimple(to, subject, text, html)
}

/** K57 — request password reset (no account enumeration). */
export async function handleRequestPasswordReset(body, req) {
  if (!dbConfigured()) {
    return { status: 503, body: { ok: false, message: 'Auth database is not configured.' } }
  }
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'local'
  if (!rateLimit(`reset-ip:${ip}`, RESET_PER_IP, RESET_WINDOW_MS)) {
    return { status: 429, body: { ok: false, message: 'Too many reset requests. Try again later.' } }
  }
  // Always the same message when input looks valid
  if (!email || !email.includes('@')) {
    return { status: 400, body: { ok: false, message: 'Enter a valid email address.' } }
  }
  if (!rateLimit(`reset-email:${email}`, RESET_PER_EMAIL, RESET_WINDOW_MS)) {
    // Still no enumeration — same success copy
    return { status: 200, body: { ok: true, message: GENERIC_RESET_MSG } }
  }

  const existing = await query(`SELECT * FROM users WHERE email = $1`, [email])
  const user = existing.rows[0]
  if (!user) {
    return { status: 200, body: { ok: true, message: GENERIC_RESET_MSG } }
  }

  const provider = String(user.auth_provider || 'email')
  if (provider === 'google') {
    await sendGoogleOnlyResetEmail(user.email)
    return { status: 200, body: { ok: true, message: GENERIC_RESET_MSG } }
  }

  // Invalidate older unused reset links for this user
  await query(
    `UPDATE password_reset_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id],
  )
  const token = `rst_${crypto.randomBytes(16).toString('hex')}`
  const expires = new Date(Date.now() + RESET_MINUTES * 60 * 1000)
  await query(
    `INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, user.id, expires.toISOString()],
  )
  const origin = body.origin || req.headers.origin || process.env.APP_ORIGIN || 'https://marginos.online'
  const resetUrl = `${String(origin).replace(/\/$/, '')}/?reset=${encodeURIComponent(token)}`
  const sent = await sendPasswordResetEmail(user.email, resetUrl)
  if (!sent.ok) {
    return { status: 502, body: { ok: false, message: sent.message || 'Could not send reset email.' } }
  }
  return { status: 200, body: { ok: true, message: GENERIC_RESET_MSG } }
}

/** K57 — consume reset token and set new password; wipe other sessions. */
export async function handleResetPassword(body) {
  if (!dbConfigured()) {
    return { status: 503, body: { ok: false, message: 'Auth database is not configured.' } }
  }
  const token = String(body.token || '')
  const newPassword = String(body.password || body.newPassword || '')
  if (!token) {
    return {
      status: 400,
      body: { ok: false, message: 'This reset link is invalid or expired.', canResend: true },
    }
  }
  if (newPassword.length < MIN_PASSWORD) {
    return {
      status: 400,
      body: {
        ok: false,
        message: `Password must be at least ${MIN_PASSWORD} characters.`,
      },
    }
  }
  const { rows } = await query(
    `SELECT * FROM password_reset_tokens
     WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [token],
  )
  const row = rows[0]
  if (!row) {
    return {
      status: 400,
      body: {
        ok: false,
        message: 'This reset link is invalid or expired.',
        canResend: true,
      },
    }
  }
  const hash = await bcrypt.hash(newPassword, 12)
  await query(
    `UPDATE users SET password_hash = $2, auth_provider = 'email', updated_at = NOW() WHERE id = $1`,
    [row.user_id, hash],
  )
  await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`, [token])
  // Invalidate every other unused reset token for this user
  await query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
    [row.user_id],
  )
  // Sign out all sessions
  await query(`DELETE FROM sessions WHERE user_id = $1`, [row.user_id])
  const userRes = await query(`SELECT * FROM users WHERE id = $1`, [row.user_id])
  const user = userRes.rows[0]
  if (user?.email) {
    await sendPasswordChangedEmail(user.email)
  }
  return {
    status: 200,
    headers: { 'Set-Cookie': clearSessionCookie() },
    body: {
      ok: true,
      message: 'Password updated. Sign in with your new password. Other sessions were signed out.',
    },
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
