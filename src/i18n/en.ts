import { PRODUCT_NAME } from '../lib/brand'
import { PLANS, TRIAL_DAYS, formatGbp } from '../lib/plans'

/** All interface text (UK spelling). Language selector stays hidden until a second language exists. */
export const en = {
  brand: PRODUCT_NAME,
  tagline: 'Find where your margin leaks and what each leak costs you.',
  positioning: `Plans from ${formatGbp(PLANS.starter.monthlyGbp)} a month, including VAT. Cancel any time.`,
  trialLine: `Try any plan free for ${TRIAL_DAYS} days. Cancel before day ${TRIAL_DAYS} and pay nothing. Cancel in Plan & billing — one click.`,
  proDataBenefit: 'Keep your data, saved datasets and history while subscribed',
  showTheMaths: 'Show the maths',
  hideTheMaths: 'Hide the maths',
  trueProfit: 'True profit',
  healthScore: 'Health score',
  netMargin: 'Net margin',
  upgradePro: 'View plans',
  free: 'Sample',
  pro: 'Pro',
  starter: 'Starter',
  growth: 'Growth',
  scale: 'Scale',
  estimated: 'estimated',
  allocated: 'allocated',
  confidence: 'Confidence',
  orderUsage: (used: number, limit: number) =>
    `${used.toLocaleString('en-GB')} of ${limit.toLocaleString('en-GB')} unique orders this billing month`,
  orderLimitWarn: (nextPlan: string) =>
    `You're at 80% of this month's order allowance. Upgrade to ${nextPlan} to analyse more.`,
  orderLimitBlocked: (newUnique: number, projected: number, overage: number, nextPlan: string) =>
    `This file adds ${newUnique.toLocaleString('en-GB')} new orders (${projected.toLocaleString('en-GB')} projected, ${overage.toLocaleString('en-GB')} over your limit). Nothing was imported. Upgrade to ${nextPlan} and re-upload.`,
  verifyEmail: 'Verify your email before your first upload.',
  googleSignInPendingK6:
    'Google sign-in arrives after Google Cloud project setup (20.3). Use email for now.',
  /** v18 — TikTok Shop UK Beta on every tier. */
  tiktokBeta: 'TikTok Shop UK — Beta',
  tiktokBetaBlurb:
    "Built from TikTok's public UK statement documentation. We haven't verified every seller's file yet. If yours fails, send us the error and, if you're comfortable, the file so we can fix it.",
  platformsLaunchLine: 'Shopify, Amazon, Etsy and TikTok Shop UK — Beta.',
  etsyMultiFileHint:
    'On a phone you can add the Orders, Order Items and Statement files one at a time — it still counts as one upload.',
  inAppBrowserGoogleHint: `If this link opened inside Instagram, Facebook, TikTok or Gmail, use email sign-in here, or open ${PRODUCT_NAME} in Safari or Chrome for Google sign-in.`,
  countryBlocked: `${PRODUCT_NAME} isn't available in your country yet.`,
  alreadySubscribed: 'You already have an active plan',
  paymentProcessing: 'Your payment is processing',
  deletionWarning: (date: string) =>
    `Your data will be deleted on ${date}. Download my data before then.`,
  /** Retired Free 24h messages kept as empty fallbacks for old call sites. */
  freeTryLine: '',
  privacyRetentionLine: 'Original upload files are deleted as soon as they are imported.',
  freeUploadPolicy: '',
  uploadsLeft: (_n: number) => '',
  uploadsExhausted: '',
  tiktokComingSoon: 'TikTok Shop UK — Beta',
  alreadyPro: 'You already have an active plan',
  paymentFailedPastDueDeleted: 'Payment failed — access ended and product data was deleted.',
  paymentFailedClocksResumed: 'Payment failed — access continues until the disclosed end date.',
} as const

export type MessageKey = keyof typeof en
export const messages = { en }
export type Locale = keyof typeof messages
