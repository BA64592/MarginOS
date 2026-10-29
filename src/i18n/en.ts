/** All interface text (UK spelling). Language selector stays hidden until a second language exists. */
export const en = {
  brand: 'MarginOS',
  tagline: 'Find where your margin leaks and what each leak costs you.',
  positioning: 'One price, yours for life.',
  showTheMaths: 'Show the maths',
  hideTheMaths: 'Hide the maths',
  trueProfit: 'True profit',
  healthScore: 'Health score',
  netMargin: 'Net margin',
  upgradePro: 'Upgrade to Pro',
  proPrice: '£59 lifetime',
  earlyBirdPrice: '£39 early-bird',
  free: 'Free',
  pro: 'Pro',
  estimated: 'estimated',
  allocated: 'allocated',
  confidence: 'Confidence',
  uploadsLeft: (n: number) => `${n} of 3 uploads left today`,
  verifyEmail: 'Verify your email before your first upload.',
  countryBlocked: "MarginOS isn't available in your country yet.",
  alreadyPro: 'You already have Pro',
  paymentProcessing: 'Your payment is processing',
} as const

export type MessageKey = keyof typeof en
export const messages = { en }
export type Locale = keyof typeof messages
