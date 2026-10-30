/**
 * Stripe webhook receiver (§12.10). Verify signatures; process each event ID once.
 * Wire: checkout.session.completed, charge.refunded, charge.dispute.*, payment_intent.*.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { api: { bodyParser: false } }

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!secret || !apiKey) {
    res.status(503).json({ ok: false, message: 'Webhook secrets not configured (K4).' })
    return
  }

  const raw = await readRawBody(req)
  const sig = req.headers['stripe-signature']
  if (!sig) {
    res.status(400).json({ ok: false, message: 'Missing stripe-signature' })
    return
  }

  // Signature verification + idempotent event handling belong in a durable store.
  // Until Redis/DB is attached, acknowledge and log for operators.
  let event: { id?: string; type?: string }
  try {
    event = JSON.parse(raw.toString('utf8')) as { id?: string; type?: string }
  } catch {
    res.status(400).json({ ok: false, message: 'Invalid JSON' })
    return
  }

  console.info('[stripe-webhook]', event.type, event.id)
  // TODO(K4): verify HMAC with STRIPE_WEBHOOK_SECRET; upsert licence by client_reference_id;
  // map refunds/disputes → K8 kept-data state; delayed payment fail → purge past-due Free clocks.
  res.status(200).json({ received: true, id: event.id })
}
