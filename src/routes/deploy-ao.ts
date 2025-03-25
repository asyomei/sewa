import { execa } from 'execa'
import { safeParse } from 'valibot'
import { app } from '#/app'
import { DeployGeneralSchema } from '#/schemas'
import { onLocal } from '#/utils/command'
import { pretty } from '#/utils/pretty'

app.post('/deploy/ao', async c => {
  const { output: body, issues } = safeParse(DeployGeneralSchema, await c.req.parseBody())

  if (issues) {
    const message = issues.map(x => x.message).join('\n')
    return c.text(pretty('Success: false', `Issues (${issues.length}):`, message))
  }

  const cmdList = []
  cmdList.push('mkdir', '-p', body.outpath)
  cmdList.push('&&', 'tar', '-xz', '-C', body.outpath)
  cmdList.push('&&', 'pm2', 'restart', body.name)

  const withDist = execa({ stdin: body.dist.stream(), reject: false })
  const result = await withDist(...onLocal(cmdList))

  if (result.failed) {
    const { stdout, stderr } = result
    console.error(result.message)
    return c.text(pretty('Success: false', 'stdout:', stdout, 'stderr:', stderr))
  }

  return c.text(pretty('Success: true'))
})
