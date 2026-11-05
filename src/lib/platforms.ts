import type { Platform } from './types'

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case 'shopify':
      return 'Shopify'
    case 'amazon':
      return 'Amazon'
    case 'etsy':
      return 'Etsy'
    case 'tiktok':
      return 'TikTok Shop UK — Beta'
    case 'manual':
      return 'Manual'
  }
}
