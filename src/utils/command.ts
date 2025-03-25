export function onLocal(cmdList: string[]) {
  const cmd = cmdList.join(' ')
  return ['sh', ['-c', cmd]] as const
}
