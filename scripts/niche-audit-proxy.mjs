// Read-only localhost audit transport. The renderer receives its real canonical
// Host, so robots/canonical are production responses; no HTML is modified.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
const siteId = process.argv[2] || 'traktoriupadangos';
if (!/^[a-z0-9-]+$/.test(siteId)) throw new Error('Invalid site ID');
const pkg = JSON.parse(await readFile(`content-packages/${siteId}/content-package.json`, 'utf8'));
const server = http.createServer((req, res) => {
  // Exclude the audit from interest telemetry; the normal handler also excludes
  // Lighthouse/HeadlessChrome. No body, inquiry or counter reaches storage here.
  if (req.method === 'POST' && req.url === '/ivykius' && ['127.0.0.1:8790','localhost:8790'].includes(req.headers.host)) { res.writeHead(204); return res.end(); }
  if (!['GET', 'HEAD'].includes(req.method) || !['127.0.0.1:8790','localhost:8790'].includes(req.headers.host)) { res.writeHead(403); return res.end(); }
  const upstream = http.request({ hostname:'127.0.0.1',port:8787,path:req.url,method:req.method,
    headers:{ ...req.headers,host:pkg.canonicalHost } }, response => { res.writeHead(response.statusCode,response.headers); response.pipe(res); });
  upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end();}); upstream.end();
});
server.listen(8790,'127.0.0.1',()=>console.log(`Read-only canonical Host audit: ${pkg.canonicalHost} via http://127.0.0.1:8790`));
