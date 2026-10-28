export const haptic = {
  // Light tap (for tab switching, minor buttons)
  light: () => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light')
    }
  },
  // Medium tap (for buy buttons, add to cart)
  medium: () => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium')
    }
  },
  // Success (for successful checkout or login)
  success: () => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success')
    }
  }
}