/**
 * DigitalOcean App Platform runtime: static SPA + /api/auth/send-verification.
 * Listens on 0.0.0.0:$PORT (default 8080).
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT || 8080)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

function sesConfig() {
  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-north-1'
  const from = process.env.SES_FROM_ADDRESS || process.env.SES_FROM_EMAIL || ''
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  if (!from || !accessKeyId || !secretAccessKey) {
    return {
      error:
        'SES is not configured. Set SES_FROM_ADDRESS (or SES_FROM_EMAIL) and AWS credentials (K5).',
    }
  }
  return { region, from, accessKeyId, secretAccessKey }
}

async function sendVerification(email, verifyUrl) {
  const config = sesConfig()
  if (config.error) return { status: 503, body: { ok: false, message: config.error } }

  const client = new SESv2Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  const subject = 'Verify your MarginOS email'
  const text = [
    'Verify your MarginOS email address.',
    '',
    'Open this link within 24 hours:',
    verifyUrl,
    '',
    'If you did not create a MarginOS account, you can ignore this email.',
  ].join('\n')
  const html = `<p>Verify your MarginOS email address.</p>
<p><a href="${verifyUrl}">Confirm email</a></p>
<p style="color:#555;font-size:14px">Or paste this link into your browser (valid 24 hours):<br/>${verifyUrl}</p>
<p style="color:#777;font-size:12px">If you did not create a MarginOS account, you can ignore this email.</p>`

  try {
    const out = await client.send(
      new SendEmailCommand({
        FromEmailAddress: config.from,
        Destination: { ToAddresses: [email] },
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
    return {
      status: 200,
      body: { ok: true, message: 'Verification email sent.', messageId: out.MessageId },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SES send failed'
    return { status: 502, body: { ok: false, message } }
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function safeJoin(base, reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0])
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const full = path.join(base, cleaned)
  if (!full.startsWith(base)) return null
  return full
}

async function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  let filePath = safeJoin(dist, urlPath)
  if (!filePath) {
    res.writeHead(400)
    res.end('Bad request')
    return
  }

  const trySend = (p) => {
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return false
    const ext = path.extname(p).toLowerCase()
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    fs.createReadStream(p).pipe(res)
    return true
  }

  if (trySend(filePath)) return
  // SPA fallback
  const index = path.join(dist, 'index.html')
  if (trySend(index)) return
  res.writeHead(404)
  res.end('Not found')
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url?.startsWith('/api/auth/send-verification')) {
      const raw = await readBody(req)
      let body = {}
      try {
        body = raw ? JSON.parse(raw) : {}
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, message: 'Invalid JSON' }))
        return
      }
      const email = String(body.email || '')
      const verifyUrl = String(body.verifyUrl || '')
      if (!email || !verifyUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, message: 'email and verifyUrl required' }))
        return
      }
      const result = await sendVerification(email, verifyUrl)
      res.writeHead(result.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.body))
      return
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/health')) {
      const cfg = sesConfig()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          ok: true,
          sesConfigured: !('error' in cfg),
          region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-north-1',
        }),
      )
      return
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      await serveStatic(req, res)
      return
    }

    res.writeHead(405)
    res.end()
  } catch (err) {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, message: 'Internal error' }))
  }
})

server.listen(port, '0.0.0.0', () => {
  console.info(`[marginos] listening on 0.0.0.0:${port}`)
})
