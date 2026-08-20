import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The parts of Node's request and response this adapter uses.
 *
 * Vite types these as `IncomingMessage` and `ServerResponse`, which come from
 * @types/node. Declaring the handful of members used here keeps a types-only
 * dependency out of the project for as long as this stays small.
 */
type NodeRequest = {
  url?: string
  method?: string
  headers: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array>
}

type NodeResponse = {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: Uint8Array | string): void
}

/**
 * Serves `netlify/functions/*.ts` during `npm run dev`.
 *
 * Netlify runs these in production; nothing runs them locally. The alternative
 * was netlify-cli, which is a dependency and a Docker-adjacent toolchain for
 * what turns out to be about forty lines of adapter: Node request in, Web
 * Request out, Web Response back.
 *
 * Modules are loaded through Vite, so an edit to a function is picked up without
 * restarting the server.
 */
function netlifyFunctionsDev(env: Record<string, string>): Plugin {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      // The functions read configuration from the environment, exactly as they
      // will on Netlify. This is where .env.local reaches them.
      Object.assign(process.env, env)

      server.middlewares.use((rawRequest, rawResponse, next) => {
        const request = rawRequest as unknown as NodeRequest
        const response = rawResponse as unknown as NodeResponse

        const path = (request.url ?? '/').split('?')[0] ?? '/'
        const name = /^\/\.netlify\/functions\/([\w-]+)$/.exec(path)?.[1]
        if (!name) return next()

        void (async () => {
          const chunks: Uint8Array[] = []
          for await (const chunk of request) chunks.push(chunk)

          const headers = new Headers()
          for (const [key, value] of Object.entries(request.headers)) {
            if (typeof value === 'string') headers.set(key, value)
          }

          const method = request.method ?? 'GET'
          const webRequest = new Request(
            new URL(request.url ?? '/', 'http://localhost:5173'),
            {
              method,
              headers,
              body:
                method === 'GET' || method === 'HEAD'
                  ? null
                  : (concat(chunks) as BodyInit),
            },
          )

          try {
            const module = (await server.ssrLoadModule(
              `/netlify/functions/${name}.ts`,
            )) as { default: (r: Request) => Promise<Response> }

            const result = await module.default(webRequest)
            response.statusCode = result.status
            result.headers.forEach((value, key) => response.setHeader(key, value))
            response.end(new Uint8Array(await result.arrayBuffer()))
          } catch (cause) {
            // A crash inside a function is this server's fault, not the
            // caller's, and it should read like one.
            server.config.logger.error(`[functions] ${name}: ${String(cause)}`)
            response.statusCode = 500
            response.setHeader('content-type', 'application/json; charset=utf-8')
            response.end(
              JSON.stringify({
                reason: cause instanceof Error ? cause.message : String(cause),
              }),
            )
          }
        })()
      })
    },
  }
}

const concat = (chunks: Uint8Array[]): Uint8Array => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}

export default defineConfig(({ mode }) => {
  // The empty prefix loads every variable, not only the VITE_ ones. Only the
  // VITE_ ones reach the browser bundle; the rest exist for the functions.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), netlifyFunctionsDev(env)],
    server: { port: 5173 },
  }
})
