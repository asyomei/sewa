import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http'
import { isUint8Array } from 'node:util/types'
import { type RouterContext, addRoute, createRouter, findRoute } from 'rou3'
import { joinPaths } from './utils/join-paths'
import { splitOnce } from './utils/take-to'

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

type ExtractParams<Path> = Simplify<
  Path extends `${infer Segment}/${infer Rest}`
    ? ExtractParam<Segment, ExtractParams<Rest>>
    : ExtractParam<Path, {}>
>

export interface RouteIncomingMessage<T extends string> extends IncomingMessage {
  pathname: string
  search: string
  searchParams: URLSearchParams
  params: ExtractParams<T>
}

export type RouteHandler<T extends string = string> = (
  req: RouteIncomingMessage<T>,
  res: ServerResponse,
) => unknown

type Path = `/${string}`

type AddPrefix<A extends Path, B extends Path> = A extends '/'
  ? B
  : A extends `${infer C}/`
    ? `${C}${B}`
    : `${A}${B}`

type MethodFunctions<T extends Path> = {
  [K in Lowercase<Method>]: <P extends Path>(
    path: P,
    handler: RouteHandler<AddPrefix<T, P>>,
  ) => void
}

export type SewaRouter<T extends Path = '/'> = {
  add<P extends Path>(method: string, path: P, handler: RouteHandler<AddPrefix<T, P>>): void
  group<P extends Path>(prefix: P): SewaRouter<AddPrefix<T, P>>
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
  }
}

function makeHandler(rctx: RouterContext<RouteHandler>) {
  return function handle(req: IncomingMessage, res: ServerResponse) {
    const [url, search] = splitOnce(req.url ?? '/', '?')

    const route = findRoute(rctx, req.method ?? 'GET', url)
    if (!route) {
      res.setHeader('Content-Type', 'text/html')
      res.end('<h1>404 Not Found</h1>')
      return
    }

    const rreq = Object.assign(req, {
      pathname: url,
      search,
      searchParams: new URLSearchParams(search),
      params: route.params ?? {},
    })

    const message = route.data(rreq, res)

    if (message instanceof Promise) {
      message.then(x => send(res, x))
    } else {
      send(res, message)
    }
  }
}

function createSewaRouter<T extends Path>(
  rctx: RouterContext<RouteHandler>,
  group: T,
): SewaRouter<T> {
  function add(method: string, path: string, handler: RouteHandler) {
    addRoute(rctx, method, joinPaths(group, path), handler)
  }

  const funcs = {} as unknown as MethodFunctions<T>
  for (const method of METHODS) {
    const id = method.toLowerCase() as Lowercase<Method>
    funcs[id] = (path: string, handler: RouteHandler) => add(method, path, handler)
  }

  return Object.assign(funcs, {
    add,
    group(path: string) {
      return createSewaRouter(rctx, joinPaths(group, path) as any)
    },
  })
}

export function createSewa(): Sewa {
  const rctx = createRouter<RouteHandler>()
  const router = createSewaRouter(rctx, '/')
  const server = createServer(makeHandler(rctx))
  return Object.assign(server, router)
}
