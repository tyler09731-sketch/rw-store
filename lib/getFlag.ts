import { Country } from 'country-state-city'

export function getFlagEmoji(countryName: string) {
  if (!countryName) return '🏳️'
  
  const cleanName = countryName.trim()
  
  // 1. If it's already a 2-letter code (e.g. "US"), just convert to emoji
  if (cleanName.length === 2) {
    try {
      return String.fromCodePoint(...cleanName.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
    } catch { return '🏳️' }
  }
  
  // 2. Look up by name in the library (case insensitive)
  const allCountries = Country.getAllCountries()
  const found = allCountries.find(
    c => c.name.toLowerCase() === cleanName.toLowerCase()
  )
  
  // 3. If exact match fails, try a partial match (e.g. "USA" -> "United States")
  let isoCode = found?.isoCode
  if (!isoCode) {
    const partialMatch = allCountries.find(c => 
      cleanName.toLowerCase().includes(c.name.toLowerCase()) || 
      c.name.toLowerCase().includes(cleanName.toLowerCase()) ||
      c.isoCode.toLowerCase() === cleanName.toLowerCase()
    )
    isoCode = partialMatch?.isoCode
  }
  
  // 4. Convert the ISO code to emoji
  if (isoCode && isoCode.length === 2) {
    try {
      return String.fromCodePoint(...isoCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
    } catch { return '🏳️' }
  }
  
  return '🏳️'
}