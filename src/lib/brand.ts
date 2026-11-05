/**
 * K37 / OD3 — single product name + swappable domain/email/assets.
 * Swap PRODUCT_NAME (and related) after trademark clearance + Akthar approval.
 */
export const PRODUCT_NAME =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRODUCT_NAME) || 'MarginOS'

export const PRODUCT_DOMAIN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRODUCT_DOMAIN) || 'marginos.online'

export const SUPPORT_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL) ||
  `support@${PRODUCT_DOMAIN}`

export const NOREPLY_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NOREPLY_EMAIL) ||
  `noreply@${PRODUCT_DOMAIN}`

/** Statement descriptor working default (Stripe / Link). */
export const STATEMENT_DESCRIPTOR =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STATEMENT_DESCRIPTOR) ||
  `LINK.COM* ${PRODUCT_NAME.toUpperCase()}`
