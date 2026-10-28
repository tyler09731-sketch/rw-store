const countryToIso: Record<string, string> = {
  'united states': 'US', 'usa': 'US', 'canada': 'CA', 'united kingdom': 'GB', 'uk': 'GB',
  'germany': 'DE', 'mexico': 'MX', 'switzerland': 'CH', 'sweden': 'SE', 'spain': 'ES',
  'thailand': 'TH', 'uae': 'AE', 'india': 'IN', 'finland': 'FI', 'singapore': 'SG',
  'france': 'FR', 'norway': 'NO', 'ireland': 'IE', 'belgium': 'BE', 'netherlands': 'NL',
  'portugal': 'PT', 'czech republic': 'CZ', 'australia': 'AU', 'brazil': 'BR',
  'austria': 'AT', 'poland': 'PL', 'japan': 'JP', 'italy': 'IT', 'south africa': 'ZA'
}

export function getFlagEmoji(countryName: string) {
  if (!countryName) return '🏳️'
  
  // Clean the string, lowercase it, and remove weird characters
  const normalized = countryName.trim().toLowerCase().replace(/[^a-z ]/g, '')
  
  // Find the ISO code, or fallback to whatever they typed if it's already 2 letters
  let isoCode = countryToIso[normalized] || normalized.toUpperCase()

  if (isoCode.length === 2) {
    try {
      const codePoints = isoCode
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    } catch {
      return '🏳️'
    }
  }
  
  return '🏳️'
}