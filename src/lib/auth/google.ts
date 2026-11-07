/**
 * Google Identity Services (OIDC) — K6 / §20.3.
 * Client ID is public (browser OAuth); never put a client secret here.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
            error_callback?: (err: { type?: string; message?: string }) => void
          }) => { requestAccessToken: (override?: { prompt?: string }) => void }
        }
      }
    }
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'

/** Public OAuth web client ID (Akthar / K6). Overridable via VITE_GOOGLE_CLIENT_ID. */
const FALLBACK_CLIENT_ID =
  '869885026269-24b2bi94acusblu3tr01l3d0nuio7c4p.apps.googleusercontent.com'

export function getGoogleClientId(): string {
  const fromEnv = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
  return fromEnv || FALLBACK_CLIENT_ID
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getGoogleClientId())
}

let gisLoading: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisLoading) return gisLoading
  gisLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google script failed to load')))
      if (window.google?.accounts?.oauth2) resolve()
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google script failed to load'))
    document.head.appendChild(script)
  })
  return gisLoading
}

export type GoogleIdClaims = {
  sub: string
  email: string
  email_verified: boolean
  /** Access token so the server can re-verify with Google userinfo. */
  accessToken: string
}

/**
 * Opens Google account picker and returns verified profile claims via userinfo.
 */
export async function requestGoogleSignIn(): Promise<GoogleIdClaims> {
  const clientId = getGoogleClientId()
  if (!clientId) throw new Error('Google sign-in is not configured.')
  await loadGisScript()
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google sign-in failed to initialise.')
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Google sign-in was cancelled.'))
          return
        }
        resolve(response.access_token)
      },
      error_callback: (err) => {
        reject(new Error(err.message || err.type || 'Google sign-in failed.'))
      },
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })

  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Could not read Google profile.')
  const profile = (await res.json()) as {
    sub?: string
    email?: string
    email_verified?: boolean | string
  }
  if (!profile.sub || !profile.email) {
    throw new Error('Google did not return an email address.')
  }
  return {
    sub: profile.sub,
    email: profile.email,
    email_verified: profile.email_verified === true || profile.email_verified === 'true',
    accessToken,
  }
}
