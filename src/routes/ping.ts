import { app } from '#/app'

app.get('/ping', c => c.text('Pong!'))
