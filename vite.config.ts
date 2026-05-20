import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import url from 'url'

// A Vite plugin to emulate Vercel serverless functions locally
function vercelDevPlugin() {
  return {
    name: 'vercel-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next()
        }

        try {
          const parsedUrl = url.parse(req.url, true)
          const apiPath = parsedUrl.pathname || ''
          const baseName = apiPath.substring(5) // Remove '/api/'

          // Resolve backend API files (supporting .ts, .js, or index files)
          let filePath = ''
          const possiblePaths = [
            path.resolve(server.config.root, 'api', `${baseName}.ts`),
            path.resolve(server.config.root, 'api', `${baseName}.js`),
            path.resolve(server.config.root, 'api', baseName, 'index.ts'),
            path.resolve(server.config.root, 'api', baseName, 'index.js'),
          ]

          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              filePath = p
              break
            }
          }

          if (!filePath) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Not Found', message: `API route ${apiPath} not found` }))
            return
          }

          // Parse Request Body
          let body: any = {}
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
            const buffers = []
            for await (const chunk of req) {
              buffers.push(chunk)
            }
            const rawBody = Buffer.concat(buffers).toString()
            if (rawBody.trim()) {
              const contentType = req.headers['content-type'] || ''
              if (contentType.includes('application/json')) {
                try {
                  body = JSON.parse(rawBody)
                } catch (e) {
                  body = rawBody
                }
              } else if (contentType.includes('application/x-www-form-urlencoded')) {
                const params = new URLSearchParams(rawBody)
                const parsedBody: any = {}
                for (const [key, val] of params.entries()) {
                  parsedBody[key] = val
                }
                body = parsedBody
              } else {
                body = rawBody
              }
            }
          }

          // Use Vite's SSR loader to dynamically load and transpile TypeScript functions!
          const module = await server.ssrLoadModule(filePath)
          const handler = module.default

          if (typeof handler !== 'function') {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Internal Server Error', message: `API route ${apiPath} does not export a default handler function` }))
            return
          }

          // Build VercelRequest and VercelResponse mocks
          const originalEnd = res.end.bind(res)
          const vercelReq = Object.assign(req, {
            query: parsedUrl.query || {},
            body: body,
            cookies: {},
          })

          const vercelRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code
              return vercelRes
            },
            json(data: any) {
              res.setHeader('Content-Type', 'application/json')
              originalEnd(JSON.stringify(data))
              return vercelRes
            },
            send(data: any) {
              if (typeof data === 'object') {
                res.setHeader('Content-Type', 'application/json')
                originalEnd(JSON.stringify(data))
              } else {
                originalEnd(data)
              }
              return vercelRes
            },
            end(data?: any) {
              originalEnd(data)
              return vercelRes
            }
          })

          // Execute handler
          await handler(vercelReq, vercelRes)
        } catch (error: any) {
          console.error(`Error executing API route ${req.url}:`, error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: false,
            error: 'Internal Server Error',
            message: error.message || String(error)
          }))
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables (even non-VITE ones) into process.env so Vercel functions have credentials
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value
  }

  return {
    plugins: [react(), vercelDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  }
})
