import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../.output/public')
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.wasm':'application/wasm', '.xml':'application/xml', '.md':'text/plain; charset=utf-8' }
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = path.resolve(root, `.${pathname}`)
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return }
    let code = 200
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html')
      await stat(file)
    } catch { file = path.join(root, '404.html'); code = 404 }
    const data = await readFile(file)
    res.writeHead(code, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' })
    res.end(req.method === 'HEAD' ? undefined : data)
  } catch { res.writeHead(404); res.end('Not found') }
}).listen(Number(process.env.PORT || 5240), '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${process.env.PORT || 5240}`))
