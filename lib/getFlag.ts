import { Country } from 'country-state-city'

export function getFlagEmoji(countryName: string) {
  if (!countryName) return '🏳️'
  
  const cleanName = countryName.trim().toLowerCase()
  
  // 1. Hardcoded fallback for weird cases
  const dictionary: Record<string, string> = {
    'us': 'US', 'usa': 'US', 'united states': 'US', 'united states of america': 'US',
    'uk': 'GB', 'gb': 'GB', 'united kingdom': 'GB', 'great britain': 'GB',
    'uae': 'AE', 'united arab emirates': 'AE',
    'canada': 'CA', 'germany': 'DE', 'mexico': 'MX', 'switzerland': 'CH', 'sweden': 'SE',
    'spain': 'ES', 'thailand': 'TH', 'india': 'IN', 'finland': 'FI', 'singapore': 'SG',
    'france': 'FR', 'norway': 'NO', 'ireland': 'IE', 'belgium': 'BE', 'netherlands': 'NL',
    'portugal': 'PT', 'czech republic': 'CZ', 'australia': 'AU', 'brazil': 'BR',
    'austria': 'AT', 'poland': 'PL'
  }

  let isoCode: string | undefined = dictionary[cleanName]

  // 2. If dictionary fails, try the library
  if (!isoCode) {
    const found = Country.getAllCountries().find(c => c.name.toLowerCase() === cleanName)
    isoCode = found?.isoCode
  }

  // 3. Convert to emoji
  if (isoCode && isoCode.length === 2) {
    try {
      return String.fromCodePoint(...isoCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
    } catch {
      return '🏳️'
    }
  }
  
  return '🏳️'
}