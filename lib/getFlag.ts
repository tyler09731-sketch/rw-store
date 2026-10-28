const countryToIso: Record<string, string> = {
  'united states': 'US',
  'canada': 'CA',
  'united kingdom': 'GB',
  'germany': 'DE',
  'mexico': 'MX',
  'switzerland': 'CH',
  'sweden': 'SE',
  'spain': 'ES',
  'thailand': 'TH',
  'uae': 'AE',
  'india': 'IN',
  'finland': 'FI',
  'singapore': 'SG',
  'france': 'FR',
  'norway': 'NO',
  'ireland': 'IE',
  'belgium': 'BE',
  'netherlands': 'NL',
  'portugal': 'PT',
  'czech republic': 'CZ',
  'australia': 'AU',
  'brazil': 'BR',
  'austria': 'AT',
  'poland': 'PL'
}

export function getFlagEmoji(countryName: string) {
  if (!countryName) return '🏳️'
  
  const normalized = countryName.trim().toLowerCase()
  const isoCode = countryToIso[normalized] || normalized.toUpperCase()
  
  // If it's a valid 2-letter ISO code
  if (isoCode.length === 2) {
    const codePoints = isoCode
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }
  
  return '🏳️'
}