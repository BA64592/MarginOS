import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { Button, Input, Modal } from './ui'

/** Google OIDC stays disabled until Akthar completes K6 (v16.2 / A5). */
const GOOGLE_SIGN_IN_ENABLED = false

export function AuthModal() {
  const { authOpen, setAuthOpen, signInEmail, signInGoogle, verifyEmail, user, signOut } = useApp()
  const [email, setEmail] = useState('seller@example.com')
  const [password, setPassword] = useState('password123')

  return (
    <Modal open={authOpen} onClose={() => setAuthOpen(false)} title={user ? 'Account' : 'Sign in'}>
      {user ? (
        <div className="space-y-3 text-sm">
          <p className="text-ink">
            Signed in as <span className="font-semibold">{user.email}</span>
          </p>
          <p className="text-subtle">
            Email verified: {user.emailVerified ? 'Yes' : 'No'} · Time zone: {user.timeZone}
          </p>
          {!user.emailVerified ? (
            <Button onClick={() => verifyEmail()}>Resend verification email</Button>
          ) : null}
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
              Email
            </span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
              Password
            </span>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </label>
          <Button className="w-full" onClick={() => signInEmail(email, password)}>
            Continue with email
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            disabled={!GOOGLE_SIGN_IN_ENABLED}
            onClick={() => {
              if (!GOOGLE_SIGN_IN_ENABLED) return
              signInGoogle(true)
            }}
          >
            Continue with Google
          </Button>
          {!GOOGLE_SIGN_IN_ENABLED ? (
            <p className="text-xs text-subtle">{en.googleSignInPendingK6}</p>
          ) : null}
        </div>
      )}
    </Modal>
  )
}
