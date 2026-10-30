/**
 * Demo / QA harness controls (Switch to Free, K11 payment simulators).
 * Off in production builds unless VITE_DEMO_HARNESS=true.
 */
export function isDemoHarnessEnabled(): boolean {
  try {
    if (import.meta.env.VITE_DEMO_HARNESS === 'true') return true
    if (import.meta.env.VITE_DEMO_HARNESS === 'false') return false
    return Boolean(import.meta.env.DEV)
  } catch {
    return false
  }
}

/** Prefer live Stripe adapter when publishable key + mode are set. */
export function isLiveStripeEnabled(): boolean {
  try {
    return (
      import.meta.env.VITE_PAYMENTS_MODE === 'stripe' &&
      Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    )
  } catch {
    return false
  }
}

/** Prefer stricter auth (verification token, no instant verify) when enabled. */
export function isStrictAuthEnabled(): boolean {
  try {
    return import.meta.env.VITE_AUTH_MODE === 'strict' || import.meta.env.PROD
  } catch {
    return false
  }
}
