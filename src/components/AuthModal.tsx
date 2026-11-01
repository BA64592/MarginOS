import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Button, Input, Modal } from './ui'

type AuthMode = 'signIn' | 'create'

export function AuthModal() {
  const {
    authOpen,
    setAuthOpen,
    signInEmail,
    verifyEmail,
    requestVerificationEmail,
    applyVerifyToken,
    user,
    signOut,
  } = useApp()
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [manualToken, setManualToken] = useState('')

  const resetFeedback = () => {
    setError(null)
    setStatus(null)
  }

  const submit = async () => {
    resetFeedback()
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
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

  return (
    <Modal
      open={authOpen}
      onClose={() => {
        setAuthOpen(false)
        resetFeedback()
      }}
      title={user ? 'Account' : mode === 'create' ? 'Create account' : 'Sign in'}
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
              placeholder="At least 8 characters"
            />
          </label>
          {error ? (
            <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          {status ? <p className="text-sm text-subtle">{status}</p> : null}
          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'create' ? 'Create account' : 'Sign in'}
          </Button>
          {/* keep verifyEmail referenced for backwards compatibility */}
          <button type="button" className="hidden" onClick={() => verifyEmail()} aria-hidden>
            verify
          </button>
        </form>
      )}
    </Modal>
  )
}
