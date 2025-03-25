import { app } from '#/app'
import { pretty } from '#/utils/pretty'

app.get('/ping', c => c.text(pretty('Pong!')))
