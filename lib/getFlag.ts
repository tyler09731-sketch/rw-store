const countryToIso: Record<string, string> = {
  'United States': 'US',
  'Canada': 'CA',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'Mexico': 'MX',
  'Switzerland': 'CH',
  'Sweden': 'SE',
  'Spain': 'ES',
  'Thailand': 'TH',
  'UAE': 'AE',
  'India': 'IN',
  'Finland': 'FI',
  'Singapore': 'SG',
  'France': 'FR',
  'Norway': 'NO',
  'Ireland': 'IE',
  'Belgium': 'BE',
  'Netherlands': 'NL',
  'Portugal': 'PT',
  'Czech Republic': 'CZ',
  'Australia': 'AU',
  'Brazil': 'BR',
  'Austria': 'AT',
  'Poland': 'PL',
  'Japan': 'JP',
  'Italy': 'IT',
  'South Africa': 'ZA'
}

export function getFlagEmoji(countryName: string) {
  if (!countryName) return '🏳️'
  const isoCode = countryToIso[countryName.trim()] || countryName.trim()
  
  // If it's already a 2-letter code, use it
  if (isoCode.length === 2) {
    const codePoints = isoCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }
  
  return '🏳️'
}