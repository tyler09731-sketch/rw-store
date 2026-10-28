const map: Record<string, string> = {
  'united states': '🇺🇸', 'usa': '🇺🇸', 'us': '🇺🇸',
  'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'gb': '🇬🇧',
  'canada': '🇨🇦', 'ca': '🇨🇦',
  'germany': '🇩🇪', 'de': '🇩🇪',
  'mexico': '🇲🇽', 'mx': '🇲🇽',
  'switzerland': '🇨🇭', 'ch': '🇨🇭',
  'sweden': '🇸🇪', 'se': '🇸🇪',
  'spain': '🇪🇸', 'es': '🇪🇸',
  'thailand': '🇹🇭', 'th': '🇹🇭',
  'uae': '🇦🇪', 'ae': '🇦🇪',
  'india': '🇮🇳', 'in': '🇮🇳',
  'finland': '🇫🇮', 'fi': '🇫🇮',
  'singapore': '🇸🇬', 'sg': '🇸🇬',
  'france': '🇫🇷', 'fr': '🇫🇷',
  'norway': '🇳🇴', 'no': '🇳🇴',
  'ireland': '🇮🇪', 'ie': '🇮🇪',
  'belgium': '🇧🇪', 'be': '🇧🇪',
  'netherlands': '🇳🇱', 'nl': '🇳🇱',
  'portugal': '🇵🇹', 'pt': '🇵🇹',
  'czech republic': '🇨🇿', 'cz': '🇨🇿',
  'australia': '🇦🇺', 'au': '🇦🇺',
  'brazil': '🇧🇷', 'br': '🇧🇷',
  'austria': '🇦🇹', 'at': '🇦🇹',
  'poland': '🇵🇱', 'pl': '🇵🇱',
}

export function getFlagEmoji(country: string) {
  if (!country) return '🏳️'
  return map[country.trim().toLowerCase()] || '🏳️'
}