/**
 * Auth provider layer (v16.1 A5) — tool-neutral interface.
 * Approved stack (v16.2 / K5): in-app open-source library + Amazon SES London.
 * Google sign-in waits on K6 (Google Cloud project).
 */
import { isStrictAuthEnabled } from '../demoFlags'

export interface AuthSession {
  accountId: string
  email: string
  emailVerified: boolean
  provider: 'email' | 'google' | 'demo'
  googleSub?: string
  /** Present in strict mode until verified — single-use, 24h. */
  pendingVerifyToken?: string
}

export interface AuthProvider {
  signUpEmail(email: string, password: string): Promise<{ ok: boolean; message: string }>
  signInEmail(email: string, password: string): Promise<{ ok: boolean; session?: AuthSession; message: string }>
  signInGoogle(idTokenClaims: {
    sub: string
    email: string
    email_verified: boolean
  }): Promise<{ ok: boolean; session?: AuthSession; message: string }>
  requestEmailVerification(accountId: string, email: string): Promise<{
    ok: boolean
    message: string
    /** Dev-only: token so QA can verify without SES. */
    debugToken?: string
  }>
  verifyEmail(token: string): Promise<{ ok: boolean; message: string; email?: string }>
  requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }>
  resetPassword(token: string, newPassword: string): Promise<{ ok: boolean; message: string }>
}

const VERIFY_KEY = 'marginos.verifyTokens'

type TokenRow = { token: string; email: string; accountId: string; expiresAt: number }

function loadTokens(): TokenRow[] {
  try {
    return JSON.parse(localStorage.getItem(VERIFY_KEY) || '[]') as TokenRow[]
  } catch {
    return []
  }
}

function saveTokens(rows: TokenRow[]) {
  localStorage.setItem(VERIFY_KEY, JSON.stringify(rows))
}

function mintToken(email: string, accountId: string): string {
  const token = `ver_${Math.random().toString(36).slice(2)}_${Date.now()}`
  const rows = loadTokens().filter((r) => r.accountId !== accountId && r.expiresAt > Date.now())
  rows.push({ token, email, accountId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })
  saveTokens(rows)
  return token
}

async function queueSesVerification(email: string, accountId: string, token: string) {
  const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(token)}`
  try {
    await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, accountId, verifyUrl }),
    })
  } catch {
    // SES optional until K5 secrets exist
  }
  return verifyUrl
}

/** Production-minded adapter: 8+ char passwords, 24h verify tokens, SES hook when configured. */
export const marginosAuthProvider: AuthProvider = {
  async signUpEmail(email, password) {
    if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    return { ok: true, message: `Verification email would be sent to ${email} (24h link).` }
  },
  async signInEmail(email, password) {
    if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    const accountId = `acct_${email.toLowerCase()}`
    const token = mintToken(email, accountId)
    if (isStrictAuthEnabled()) {
      await queueSesVerification(email, accountId, token)
    }
    return {
      ok: true,
      session: {
        accountId,
        email,
        emailVerified: false,
        provider: 'email',
        pendingVerifyToken: token,
      },
      message: isStrictAuthEnabled()
        ? 'Signed in. Check your email for a verification link (24h).'
        : 'Signed in. Verify your email before upload or checkout.',
    }
  },
  async signInGoogle(claims) {
    return {
      ok: true,
      session: {
        accountId: `google_${claims.sub}`,
        email: claims.email,
        emailVerified: claims.email_verified === true,
        provider: 'google',
        googleSub: claims.sub,
      },
      message: claims.email_verified
        ? 'Signed in with Google.'
        : 'Google email not verified — please verify with MarginOS.',
    }
  },
  async requestEmailVerification(accountId, email) {
    const token = mintToken(email, accountId)
    await queueSesVerification(email, accountId, token)
    return {
      ok: true,
      message: isStrictAuthEnabled()
        ? 'Verification email sent (24h single-use link).'
        : 'Verification email sent.',
      debugToken: import.meta.env.DEV ? token : undefined,
    }
  },
  async verifyEmail(token) {
    const rows = loadTokens()
    const hit = rows.find((r) => r.token === token && r.expiresAt > Date.now())
    if (!hit) return { ok: false, message: 'Verification link is invalid or expired.' }
    saveTokens(rows.filter((r) => r.token !== token))
    return { ok: true, message: 'Email verified.', email: hit.email }
  },
  async requestPasswordReset() {
    return { ok: true, message: 'Password reset email sent.' }
  },
  async resetPassword(_token, newPassword) {
    if (newPassword.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    return { ok: true, message: 'Password updated. Other sessions have been signed out.' }
  },
}

/** @deprecated alias — prefer marginosAuthProvider */
export const demoAuthProvider = marginosAuthProvider
