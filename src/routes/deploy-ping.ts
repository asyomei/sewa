import { app } from '#/app'

app.post('/deploy/ping', c => c.text('Pong!'))
