const maxAge = 60 * 60 * 24 * 180

function readCookie(key: string, limit: number): string {
  try {
    const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${key}=`))
    return value ? decodeURIComponent(value.slice(key.length + 1)).slice(0, limit) : ''
  } catch {
    return ''
  }
}

export function readContributor() {
  return {
    name: readCookie('pley_contributor_name', 80),
    relation: readCookie('pley_contributor_relation', 40),
  }
}

export function rememberContributor(name: string, relation?: string) {
  // Remember only after submission; blocked cookies must not fail a contribution.
  try {
    const attributes = `Path=/; Max-Age=${maxAge}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    document.cookie = `pley_contributor_name=${encodeURIComponent(name.trim().slice(0, 80))}; ${attributes}`
    if (relation !== undefined) {
      document.cookie = `pley_contributor_relation=${encodeURIComponent(relation.trim().slice(0, 40))}; ${attributes}`
    }
  } catch {
    // Contributions still work when browser storage is unavailable.
  }
}
