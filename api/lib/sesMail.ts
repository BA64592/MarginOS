/**
 * Shared Amazon SES send helper (K5).
 * Accepts Margins 365 / legacy env names and common AWS aliases.
 */
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

export type SesConfig = {
  region: string
  from: string
  accessKeyId: string
  secretAccessKey: string
}

export function readSesConfig(
  env: NodeJS.ProcessEnv = process.env,
): SesConfig | { error: string } {
  const region = env.AWS_SES_REGION || env.AWS_REGION || 'eu-north-1'
  const from = env.SES_FROM_ADDRESS || env.SES_FROM_EMAIL || ''
  const accessKeyId = env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || ''
  if (!from || !accessKeyId || !secretAccessKey) {
    return {
      error:
        'SES is not configured. Set SES_FROM_ADDRESS (or SES_FROM_EMAIL) and AWS credentials (K5).',
    }
  }
  return { region, from, accessKeyId, secretAccessKey }
}

export async function sendVerificationEmail(opts: {
  to: string
  verifyUrl: string
  config?: SesConfig
}): Promise<{ ok: true; messageId?: string } | { ok: false; message: string }> {
  const config = opts.config ?? readSesConfig()
  if ('error' in config) return { ok: false, message: config.error }

  const client = new SESv2Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  const subject = 'Verify your Margins 365 email'
  const text = [
    'Verify your Margins 365 email address.',
    '',
    `Open this link within 24 hours:`,
    opts.verifyUrl,
    '',
    'If you did not create a Margins 365 account, you can ignore this email.',
  ].join('\n')
  const html = `<p>Verify your Margins 365 email address.</p>
<p><a href="${opts.verifyUrl}">Confirm email</a></p>
<p style="color:#555;font-size:14px">Or paste this link into your browser (valid 24 hours):<br/>${opts.verifyUrl}</p>
<p style="color:#777;font-size:12px">If you did not create a Margins 365 account, you can ignore this email.</p>`

  try {
    const out = await client.send(
      new SendEmailCommand({
        FromEmailAddress: config.from,
        Destination: { ToAddresses: [opts.to] },
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
    return { ok: true, messageId: out.MessageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SES send failed'
    return { ok: false, message }
  }
}
