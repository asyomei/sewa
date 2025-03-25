import { app } from '#/app'
import { env } from '#/env'
import { pretty } from '#/utils/pretty'

app.post('/deploy/*', async (c, next) => {
  const body = await c.req.parseBody()
  if (body.password !== env.DEPLOY_PASSWORD) {
    return c.text(pretty('Invalid deploy password'))
  }

  await next()
})
