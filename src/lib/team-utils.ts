export function deriveShortName(teamName: string): string {
  if (!teamName.trim()) {
    return ''
  }

  const words = teamName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase()
  }

  const abbreviation = words
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4)

  return abbreviation || teamName.slice(0, 3).toUpperCase()
}
