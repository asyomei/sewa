import { app } from '#/app'
import { pretty } from '#/utils/pretty'

app.post('/deploy/ping', c => c.text(pretty('Pong!')))
