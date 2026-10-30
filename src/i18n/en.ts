/** All interface text (UK spelling). Language selector stays hidden until a second language exists. */
export const en = {
  brand: 'MarginOS',
  tagline: 'Find where your margin leaks and what each leak costs you.',
  positioning: 'One price, yours for life.',
  /** K10 sales wording (v16.4) — privacy line pending legal review. */
  freeTryLine: 'Try it on one file, results in minutes. Your data is deleted after 24 hours.',
  proDataBenefit: 'Keep your data, saved datasets and history',
  privacyRetentionLine:
    'Free uploads are deleted after 24 hours, and original files are deleted as soon as they\'re imported.',
  showTheMaths: 'Show the maths',
  hideTheMaths: 'Hide the maths',
  trueProfit: 'True profit',
  healthScore: 'Health score',
  netMargin: 'Net margin',
  upgradePro: 'Upgrade to Pro',
  free: 'Free',
  pro: 'Pro',
  estimated: 'estimated',
  allocated: 'allocated',
  confidence: 'Confidence',
  uploadsLeft: (n: number) => `${n} of 3 uploads left today`,
  /** Free daily limit exhausted — §10.1.10 / K9 (include midnight reset). */
  uploadsExhausted:
    '0 uploads left today. Resets at midnight in your time zone, or upgrade to Pro.',
  verifyEmail: 'Verify your email before your first upload.',
  googleSignInPendingK6:
    'Google sign-in arrives after K6 (Google Cloud project). Use email for now.',
  countryBlocked: "MarginOS isn't available in your country yet.",
  alreadyPro: 'You already have Pro',
  paymentProcessing: 'Your payment is processing',
  paymentFailedPastDueDeleted:
    'Payment failed — Free data past its 24-hour window was deleted.',
  paymentFailedClocksResumed:
    'Payment failed — Free retention clocks resumed with time remaining.',
} as const

export type MessageKey = keyof typeof en
export const messages = { en }
export type Locale = keyof typeof messages
