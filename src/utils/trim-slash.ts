export function trimSlash(s: string) {
  return s !== '/' && s.endsWith('/') ? s.slice(0, -1) : s
}

export function fullTrimSlash(s: string) {
  return s.endsWith('/') ? s.slice(0, -1) : s
}
