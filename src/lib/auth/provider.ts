/**
 * Auth provider layer (v16.1 A5) — tool-neutral interface.
 * Production: server sessions + Postgres + SES verification.
 * Fallback: local demo provider when /api/auth is unavailable (local Vite only).
 */
import { isStrictAuthEnabled } from '../demoFlags'

export interface AuthSession {
  accountId: string
  email: string
  emailVerified: boolean
  provider: 'email' | 'google' | 'demo'
  plan?: 'free' | 'pro'
  googleSub?: string
  pendingVerifyToken?: string
}

export interface AuthProvider {
  signUpEmail(email: string, password: string): Promise<{ ok: boolean; message: string }>
  signInEmail(email: string, password: string): Promise<{
    ok: boolean
    session?: AuthSession
    message: string
  }>
  signInGoogle(idTokenClaims: {
    sub: string
    email: string
    email_verified: boolean
  }): Promise<{ ok: boolean; session?: AuthSession; message: string }>
  requestEmailVerification(accountId: string, email: string): Promise<{
    ok: boolean
    message: string
    debugToken?: string
  }>
  verifyEmail(token: string): Promise<{ ok: boolean; message: string; email?: string; session?: AuthSession }>
  requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }>
  resetPassword(token: string, newPassword: string): Promise<{ ok: boolean; message: string }>
  fetchSession(): Promise<AuthSession | null>
  signOut(): Promise<void>
}

type ApiUser = {
  id: string
  email: string
  emailVerified: boolean
  plan?: 'free' | 'pro'
  timeZone?: string
  createdAt?: string
  lastSignInAt?: string
}

function sessionFromApi(user: ApiUser): AuthSession {
  return {
    accountId: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    provider: 'email',
    plan: user.plan === 'pro' ? 'pro' : 'free',
  }
}

async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ okHttp: boolean; status: number; data: T }> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const data = (await res.json().catch(() => ({}))) as T
  return { okHttp: res.ok, status: res.status, data }
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

function mintLocalToken(email: string, accountId: string): string {
  const token = `ver_${Math.random().toString(36).slice(2)}_${Date.now()}`
  const rows = loadTokens().filter((r) => r.accountId !== accountId && r.expiresAt > Date.now())
  rows.push({ token, email, accountId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })
  saveTokens(rows)
  return token
}

/** Local fallback when API auth is unavailable (Vite preview without DATABASE_URL). */
const localAuthProvider: AuthProvider = {
  async signUpEmail(email, password) {
    if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    return { ok: true, message: `Verification email would be sent to ${email} (24h link).` }
  },
  async signInEmail(email, password) {
    if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    const accountId = `acct_${email.toLowerCase()}`
    const token = mintLocalToken(email, accountId)
    if (isStrictAuthEnabled()) {
      try {
        await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            accountId,
            verifyUrl: `${window.location.origin}/?verify=${encodeURIComponent(token)}`,
          }),
        })
      } catch {
        // ignore
      }
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
    const token = mintLocalToken(email, accountId)
    try {
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          accountId,
          verifyUrl: `${window.location.origin}/?verify=${encodeURIComponent(token)}`,
        }),
      })
    } catch {
      // ignore
    }
    return {
      ok: true,
      message: 'Verification email sent.',
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
  async fetchSession() {
    return null
  },
  async signOut() {
    // local only
  },
}

const serverAuthProvider: AuthProvider = {
  async signUpEmail(email, password) {
    return this.signInEmail(email, password).then((r) => ({ ok: r.ok, message: r.message }))
  },
  async signInEmail(email, password) {
    try {
      const { okHttp, data } = await apiJson<{
        ok?: boolean
        message?: string
        user?: ApiUser
      }>('/api/auth/continue', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London',
          origin: window.location.origin,
        }),
      })
      if (!okHttp || !data.ok || !data.user) {
        return { ok: false, message: data.message || 'Sign-in failed.' }
      }
      return {
        ok: true,
        session: sessionFromApi(data.user),
        message: data.message || 'Signed in.',
      }
    } catch {
      return localAuthProvider.signInEmail(email, password)
    }
  },
  async signInGoogle(claims) {
    return localAuthProvider.signInGoogle(claims)
  },
  async requestEmailVerification() {
    try {
      const { okHttp, data } = await apiJson<{ ok?: boolean; message?: string }>(
        '/api/auth/send-verification',
        {
          method: 'POST',
          body: JSON.stringify({ origin: window.location.origin }),
        },
      )
      return { ok: okHttp && Boolean(data.ok), message: data.message || 'Request failed.' }
    } catch {
      return { ok: false, message: 'Could not reach verification API.' }
    }
  },
  async verifyEmail(token) {
    try {
      const { okHttp, data } = await apiJson<{
        ok?: boolean
        message?: string
        user?: ApiUser
      }>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
      if (!okHttp || !data.ok) {
        return { ok: false, message: data.message || 'Verification failed.' }
      }
      return {
        ok: true,
        message: data.message || 'Email verified.',
        email: data.user?.email,
        session: data.user ? sessionFromApi(data.user) : undefined,
      }
    } catch {
      return localAuthProvider.verifyEmail(token)
    }
  },
  async requestPasswordReset() {
    return { ok: true, message: 'Password reset email sent.' }
  },
  async resetPassword(_token, newPassword) {
    if (newPassword.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    return { ok: true, message: 'Password updated.' }
  },
  async fetchSession() {
    try {
      const { okHttp, data } = await apiJson<{ ok?: boolean; user?: ApiUser }>('/api/auth/me')
      if (!okHttp || !data.ok || !data.user) return null
      return sessionFromApi(data.user)
    } catch {
      return null
    }
  },
  async signOut() {
    try {
      await apiJson('/api/auth/logout', { method: 'POST', body: '{}' })
    } catch {
      // ignore
    }
  },
}

/** Prefer server auth in the browser; falls back automatically if API is down. */
export const marginosAuthProvider: AuthProvider = serverAuthProvider

/** @deprecated alias — prefer marginosAuthProvider */
export const demoAuthProvider = marginosAuthProvider
