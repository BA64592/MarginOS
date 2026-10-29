/**
 * Auth provider layer (v16.1 A5) — tool-neutral interface.
 * Approved stack (v16.2 / K5): in-app open-source library + Amazon SES London.
 * This file still runs the demo adapter until SES credentials and the library are wired on a host.
 * Google sign-in waits on K6 (Google Cloud project).
 */
export interface AuthSession {
  accountId: string
  email: string
  emailVerified: boolean
  provider: 'email' | 'google' | 'demo'
  googleSub?: string
}

export interface AuthProvider {
  signUpEmail(email: string, password: string): Promise<{ ok: boolean; message: string }>
  signInEmail(email: string, password: string): Promise<{ ok: boolean; session?: AuthSession; message: string }>
  signInGoogle(idTokenClaims: {
    sub: string
    email: string
    email_verified: boolean
  }): Promise<{ ok: boolean; session?: AuthSession; message: string }>
  requestEmailVerification(accountId: string): Promise<{ ok: boolean; message: string }>
  verifyEmail(token: string): Promise<{ ok: boolean; message: string }>
  requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }>
  resetPassword(token: string, newPassword: string): Promise<{ ok: boolean; message: string }>
}

/** Demo adapter — mirrors A5 gates without real hashing/email. */
export const demoAuthProvider: AuthProvider = {
  async signUpEmail(email, password) {
    if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    return { ok: true, message: `Verification email would be sent to ${email} (24h link).` }
  },
  async signInEmail(email, password) {
    if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    return {
      ok: true,
      session: {
        accountId: `demo_${email}`,
        email,
        emailVerified: false,
        provider: 'demo',
      },
      message: 'Signed in. Verify your email before upload or checkout.',
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
  async requestEmailVerification() {
    return { ok: true, message: 'Verification email sent.' }
  },
  async verifyEmail() {
    return { ok: true, message: 'Email verified.' }
  },
  async requestPasswordReset() {
    return { ok: true, message: 'Password reset email sent.' }
  },
  async resetPassword(_token, newPassword) {
    if (newPassword.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
    return { ok: true, message: 'Password updated. Other sessions have been signed out.' }
  },
}
