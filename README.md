# sewa

http.Server with routing

uses [http.Server](https://nodejs.org/api/http.html#class-httpserver) and [rou3](https://github.com/unjs/rou3)

## overview

```ts
import { createSewa } from '@pyonpyon/sewa'

const sewa = createSewa()

// GET /hi
sewa.get('/hi', () => {
  // Content-Type: application/json
  return { hi: 'world > <' }
})

// GET /book/:id
sewa.get('/book/:id', (req, res) => {
  // typed
  const { id } = req.params

  res.setHeader('Content-Type', 'text/plain')
  return `book with id ${id}`
})

// GET /user/**:path
sewa.get('/user/**:path', req => {
  // GET /user/some/path -> { path: 'some/path' }
  const { path } = req.params
})

import type { SewaRouter } from '@pyonpyon/sewa'

function addRoutes(sewa: SewaRouter) {
  // GET /api/time
  sewa.get('/time', () => {
    return { ms: Date.now() }
  })

  const userSewa = sewa.group('/user/:action')
  // GET /api/user/:action
  userSewa.get('/', req => {
    // typed
    const { action } = req.params
  })
}

addRoutes(sewa.group('/api'))

const host = process.env.HOST ?? 'localhost'
const port = process.env.PORT ?? 8000
sewa.listen({ host, port }, () => {
  console.log(`listening on http://${host}:${port}`)
})
```
