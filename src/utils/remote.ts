export function onRemote(sshDest: string, cmdList: string[]) {
  const cmd = cmdList.join(' ').replaceAll('"', '\\"')
  return ['ssh', [sshDest, `sh -c "${cmd}"`]] as const
}
