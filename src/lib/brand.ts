/**
 * K58 / OD3 / K37 — single product name + domain config.
 * Canonical public host: margins365.com (marginos.online kept as alias/redirect).
 */
export const PRODUCT_NAME =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRODUCT_NAME) || 'Margins 365'

/** Live public host. */
export const PRODUCT_DOMAIN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRODUCT_DOMAIN) || 'margins365.com'

/** Same as PRODUCT_DOMAIN after cutover; kept for env compatibility. */
export const TARGET_PRODUCT_DOMAIN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TARGET_PRODUCT_DOMAIN) ||
  'margins365.com'

export const SUPPORT_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL) ||
  `support@${PRODUCT_DOMAIN}`

export const NOREPLY_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NOREPLY_EMAIL) ||
  `noreply@${PRODUCT_DOMAIN}`

/**
 * Statement descriptor — keep the live Stripe value until cutover confirms a replacement.
 * Do not invent a new descriptor here (spec 20.5).
 */
export const STATEMENT_DESCRIPTOR =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STATEMENT_DESCRIPTOR) ||
  'LINK.COM* MARGINOS'
