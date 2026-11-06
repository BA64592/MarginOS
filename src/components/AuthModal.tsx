import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { isGoogleSignInConfigured, requestGoogleSignIn } from '../lib/auth/google'
import { isInAppBrowser } from '../lib/browserEnv'
import { Button, Input, Modal } from './ui'

/** K6 / K57 — enabled when VITE_GOOGLE_CLIENT_ID (or built-in client id) is present. */
const GOOGLE_SIGN_IN_ENABLED = isGoogleSignInConfigured()

type AuthMode = 'signIn' | 'create' | 'forgot' | 'reset'

export function AuthModal() {
  const {
    authOpen,
    setAuthOpen,
    signInEmail,
    signInGoogle,
    verifyEmail,
    requestVerificationEmail,
    applyVerifyToken,
    requestPasswordReset,
    resetPassword,
    passwordResetToken,
    clearPasswordResetToken,
    user,
    signOut,
  } = useApp()
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [canResendReset, setCanResendReset] = useState(false)
  const [inApp] = useState(() =>
    typeof navigator !== 'undefined' ? isInAppBrowser() : false,
  )

  useEffect(() => {
    if (passwordResetToken && authOpen) {
      setMode('reset')
      setError(null)
      setStatus(null)
      setPassword('')
      setConfirmPassword('')
      setCanResendReset(false)
    }
  }, [passwordResetToken, authOpen])

  const resetFeedback = () => {
    setError(null)
    setStatus(null)
  }

  const submit = async () => {
    resetFeedback()
    const trimmed = email.trim()
    if (mode === 'forgot') {
      if (!trimmed || !trimmed.includes('@')) {
        setError('Enter a valid email address.')
        return
      }
      setBusy(true)
      try {
        const res = await requestPasswordReset(trimmed)
        if (!res.ok) setError(res.message)
        else setStatus(res.message)
      } finally {
        setBusy(false)
      }
      return
    }
    if (mode === 'reset') {
      if (!passwordResetToken) {
        setError('This reset link is invalid or expired.')
        setCanResendReset(true)
        return
      }
      if (password.length < 15) {
        setError('Password must be at least 15 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      setBusy(true)
      try {
        const res = await resetPassword(passwordResetToken, password)
        if (!res.ok) {
          setError(res.message)
          if (/invalid or expired/i.test(res.message)) setCanResendReset(true)
          return
        }
        setStatus(res.message)
        setPassword('')
        setConfirmPassword('')
        setMode('signIn')
      } finally {
        setBusy(false)
      }
      return
    }
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 15) {
      setError('Password must be at least 15 characters.')
      return
    }
    setBusy(true)
    try {
      const res = await signInEmail(trimmed, password)
      if (!res.ok) {
        const msg = (res.message || '').trim()
        if (mode === 'create' && (!msg || /sign-?in failed/i.test(msg))) {
          setError('Could not create account. Try again, or sign in if you already have one.')
        } else {
          setError(msg || (mode === 'create' ? 'Could not create account.' : 'Sign-in failed.'))
        }
        return
      }
      setStatus(res.message)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  const title = user
    ? 'Account'
    : mode === 'create'
      ? 'Create account'
      : mode === 'forgot'
        ? 'Forgot password'
        : mode === 'reset'
          ? 'Set a new password'
          : 'Sign in'

  return (
    <Modal
      open={authOpen}
      onClose={() => {
        setAuthOpen(false)
        resetFeedback()
        clearPasswordResetToken()
        setMode('signIn')
      }}
      title={title}
    >
      {user ? (
        <div className="space-y-3 text-sm">
          <p className="text-ink">
            Signed in as <span className="font-semibold">{user.email}</span>
          </p>
          <p className="text-subtle">
            Email verified: {user.emailVerified ? 'Yes' : 'No'} · Time zone: {user.timeZone}
          </p>
          {!user.emailVerified ? (
            <>
              <Button
                onClick={() => {
                  resetFeedback()
                  void requestVerificationEmail().then((res) => {
                    if (!res.ok) setError(res.message)
                    else setStatus(res.message)
                    if (res.debugToken) {
                      void applyVerifyToken(res.debugToken).then((v) => {
                        if (!v.ok) setError(v.message)
                        else setStatus(v.message)
                      })
                    }
                  })
                }}
              >
                Resend verification email
              </Button>
              <p className="text-xs text-subtle">
                Open the 24-hour link from your email on any device — verification is saved to your
                account. You can also paste the token below.
              </p>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold uppercase tracking-wide text-subtle">
                  Paste verify token
                </span>
                <Input value={manualToken} onChange={(e) => setManualToken(e.target.value)} />
              </label>
              <Button
                variant="secondary"
                onClick={() => {
                  resetFeedback()
                  void applyVerifyToken(manualToken).then((v) => {
                    if (!v.ok) setError(v.message)
                    else setStatus(v.message)
                  })
                }}
              >
                Verify with token
              </Button>
            </>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {status ? <p className="text-xs text-subtle">{status}</p> : null}
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {mode === 'forgot' ? (
            <>
              <p className="text-sm text-subtle">
                Enter your email and we’ll send a reset link if an account exists. This is not a
                cancellation route.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Email
                </span>
                <Input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    resetFeedback()
                  }}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                />
              </label>
              {error ? (
                <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              {status ? <p className="text-sm text-subtle">{status}</p> : null}
              <Button className="w-full" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : 'Send reset link'}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-accent underline-offset-2 hover:underline"
                onClick={() => {
                  setMode('signIn')
                  resetFeedback()
                }}
              >
                Back to sign in
              </button>
            </>
          ) : mode === 'reset' ? (
            <>
              <p className="text-sm text-subtle">
                Choose a new password (at least 15 characters). Other devices will be signed out.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  New password
                </span>
                <Input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    resetFeedback()
                  }}
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 15 characters"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Confirm password
                </span>
                <Input
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    resetFeedback()
                  }}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                />
              </label>
              {error ? (
                <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              {status ? <p className="text-sm text-subtle">{status}</p> : null}
              <Button className="w-full" type="submit" disabled={busy || canResendReset}>
                {busy ? 'Please wait…' : 'Update password'}
              </Button>
              {canResendReset ? (
                <Button
                  className="w-full"
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    clearPasswordResetToken()
                    setMode('forgot')
                    setCanResendReset(false)
                    resetFeedback()
                  }}
                >
                  Send a new link
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {inApp ? (
                <p className="rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn">
                  {en.inAppBrowserGoogleHint}
                </p>
              ) : null}
              <Button
                className="w-full"
                type="button"
                disabled={!GOOGLE_SIGN_IN_ENABLED || inApp || googleBusy}
                onClick={() => {
                  if (!GOOGLE_SIGN_IN_ENABLED || inApp || googleBusy) return
                  resetFeedback()
                  setGoogleBusy(true)
                  void requestGoogleSignIn()
                    .then((claims) => signInGoogle(claims))
                    .then((res) => {
                      if (!res.ok) setError(res.message)
                      else setStatus(res.message)
                    })
                    .catch((err: unknown) => {
                      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
                    })
                    .finally(() => setGoogleBusy(false))
                }}
              >
                {googleBusy ? 'Connecting to Google…' : 'Continue with Google'}
              </Button>
              {!GOOGLE_SIGN_IN_ENABLED ? (
                <p className="text-xs text-subtle">{en.googleSignInPendingK6}</p>
              ) : inApp ? null : (
                <p className="text-xs text-subtle">
                  Google sign-in uses your Google account. We never see your Google password.
                </p>
              )}
              <div className="relative py-1 text-center text-xs text-subtle">
                <span className="bg-elevated px-2">or continue with email</span>
              </div>
              <div className="flex gap-2 rounded-[10px] bg-muted p-1">
                <button
                  type="button"
                  className={`min-h-10 flex-1 rounded-[8px] text-sm font-medium transition ${
                    mode === 'signIn' ? 'bg-elevated text-ink shadow-sm' : 'text-subtle hover:text-ink'
                  }`}
                  onClick={() => {
                    setMode('signIn')
                    resetFeedback()
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`min-h-10 flex-1 rounded-[8px] text-sm font-medium transition ${
                    mode === 'create' ? 'bg-elevated text-ink shadow-sm' : 'text-subtle hover:text-ink'
                  }`}
                  onClick={() => {
                    setMode('create')
                    resetFeedback()
                  }}
                >
                  Create account
                </button>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Email
                </span>
                <Input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    resetFeedback()
                  }}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
                  Password
                </span>
                <Input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    resetFeedback()
                  }}
                  type="password"
                  autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                  placeholder="At least 15 characters"
                />
              </label>
              {mode === 'signIn' ? (
                <button
                  type="button"
                  className="text-left text-sm text-accent underline-offset-2 hover:underline"
                  onClick={() => {
                    setMode('forgot')
                    setPassword('')
                    resetFeedback()
                  }}
                >
                  Forgot password?
                </button>
              ) : null}
              {error ? (
                <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              {status ? <p className="text-sm text-subtle">{status}</p> : null}
              <Button className="w-full" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'create' ? 'Create account' : 'Continue with email'}
              </Button>
              <button type="button" className="hidden" onClick={() => verifyEmail()} aria-hidden>
                verify
              </button>
            </>
          )}
        </form>
      )}
    </Modal>
  )
}
