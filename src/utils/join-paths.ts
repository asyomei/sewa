export function joinPaths(path1: string, path2: string): string {
  return (path1 + path2).replace(/\/{2,}/g, '/')
}
