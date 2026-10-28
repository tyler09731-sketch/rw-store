import { Country } from 'country-state-city'

export function getFlagEmoji(countryName: string) {
  if (!countryName) return '🏳️'
  
  const cleanName = countryName.trim()
  
  // If it's already a 2-letter code (e.g. "US"), just convert to emoji
  if (cleanName.length === 2) {
    return String.fromCodePoint(...cleanName.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
  }
  
  // Find the country in the library by name
  const country = Country.getAllCountries().find(
    c => c.name.toLowerCase() === cleanName.toLowerCase()
  )
  
  // If found, use its isoCode. If not, try a partial match.
  let isoCode = country?.isoCode
  if (!isoCode) {
    const partialMatch = Country.getAllCountries().find(
      c => cleanName.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(cleanName.toLowerCase())
    )
    isoCode = partialMatch?.isoCode
  }
  
  // Convert ISO code to emoji
  if (isoCode && isoCode.length === 2) {
    return String.fromCodePoint(...isoCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
  }
  
  return '🏳️'
}