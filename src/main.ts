import './routes'
import { serve } from '@hono/node-server'
import { showRoutes } from 'hono/dev'
import { app } from './app'

const hostname = process.env.HOST ?? 'localhost'
const port = Number(process.env.PORT ?? 3000)

showRoutes(app)

serve({ fetch: app.fetch, hostname, port }, ({ port }) => {
  console.log(`Listening on http://${hostname}:${port}`)
})
