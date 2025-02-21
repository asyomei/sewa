export function splitOnce(s: string, m: string): [string, string] {
  const i = s.indexOf(m)
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + m.length)]
}
