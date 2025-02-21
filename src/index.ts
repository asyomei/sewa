import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http'
import { isUint8Array } from 'node:util/types'
import { type RouterContext, addRoute, createRouter, findAllRoutes } from 'rou3'
import { splitOnce } from './utils/take-to'
import { fullTrimSlash, trimSlash } from './utils/trim-slash'

export type Method =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH'

type Simplify<T> = { [K in keyof T]: T[K] } & {}

type ExtractParam<Path, NextPart> = Path extends `**:${infer Param}`
  ? { [K in Param]: string } & NextPart
  : Path extends `:${infer Param}?`
    ? { [K in Param]?: string } & NextPart
    : Path extends `:${infer Param}`
      ? { [K in Param]: string } & NextPart
      : NextPart

type ExtractParams<Path extends string> = Simplify<
  string extends Path
    ? Record<string, string | undefined>
    : Path extends `${infer Segment}/${infer Rest}`
      ? ExtractParam<Segment, ExtractParams<Rest>>
      : ExtractParam<Path, {}>
>

export interface RouteIncomingMessage<T extends string> extends IncomingMessage {
  search: string
  pathname: string
  params: ExtractParams<T>
}

export type RouteHandler<T extends string = any> = (
  req: RouteIncomingMessage<T>,
  res: ServerResponse,
) => unknown

type AddPrefix<A extends string, B extends string> = A extends '/'
  ? B
  : A extends `${infer C}/`
    ? `${C}${B}`
    : `${A}${B}`

type MethodFunctions<T extends string> = {
  [K in Lowercase<Method>]: <P extends string>(
    path: P,
    ...handler: RouteHandler<AddPrefix<T, P>>[]
  ) => void
}

export type SewaRouter<T extends string = '/'> = {
  add<P extends string>(method: string, path: P, ...handler: RouteHandler<AddPrefix<T, P>>[]): void
  group<P extends string>(prefix: P): SewaRouter<AddPrefix<T, P>>
} & MethodFunctions<T>

export interface Sewa extends Server, SewaRouter {}

const METHODS: Method[] = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'CONNECT',
  'OPTIONS',
  'TRACE',
  'PATCH',
]

function send(res: ServerResponse, message: unknown) {
  if (typeof message === 'string' || Buffer.isBuffer(message) || isUint8Array(message)) {
    res.end(message)
  } else if (message !== undefined) {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(message))
  } else if (!res.writableEnded) {
    res.end()
  }
}

export const sewaNext = Symbol('next')

function makeHandler(rctx: RouterContext<RouteHandler>) {
  return function handle(req: IncomingMessage, res: ServerResponse) {
    const [url, search] = splitOnce(req.url ?? '/', '?')

    const routes = findAllRoutes(rctx, req.method ?? 'GET', url)

    const hreq = Object.assign(req, {
      search,
      pathname: url,
    })

    for (const route of routes) {
      const rreq = Object.assign(hreq, {
        params: route.params ?? {},
      })

      const message = route.data(rreq, res)
      if (message === sewaNext) continue

      if (message instanceof Promise) {
        message.then(x => send(res, x))
      } else {
        send(res, message)
      }
      return
    }

    if (!res.writableEnded) {
      res.setHeader('Content-Type', 'text/html')
      res.end('<h1>404 Not Found</h1>')
      return
    }
  }
}

function createSewaRouter<T extends string>(
  rctx: RouterContext<RouteHandler>,
  group: T,
): SewaRouter<T> {
  const groupTrimmed = trimSlash(group)

  function add(method: string, path: string, ...handler: RouteHandler[]) {
    if (!path.startsWith('/')) {
      throw new Error(`Route should starts with / (got: '${path}')`)
    }
    path = groupTrimmed + fullTrimSlash(path)
    for (const h of handler) {
      addRoute(rctx, method, path, h)
    }
  }

  const funcs = {} as unknown as MethodFunctions<T>
  for (const method of METHODS) {
    const id = method.toLowerCase() as Lowercase<Method>
    funcs[id] = (path: string, ...handler: RouteHandler[]) => add(method, path, ...handler)
  }

  return Object.assign(funcs, {
    add,
    group(path: string) {
      if (path === '/') return this as any
      if (!path.startsWith('/')) {
        throw new Error(`Route should starts with / (got: '${path}')`)
      }
      return createSewaRouter(rctx, groupTrimmed + fullTrimSlash(path))
    },
  })
}

export function createSewa(): Sewa {
  const rctx = createRouter<RouteHandler>()
  const router = createSewaRouter(rctx, '/')
  const server = createServer(makeHandler(rctx))
  return Object.assign(server, router)
}
