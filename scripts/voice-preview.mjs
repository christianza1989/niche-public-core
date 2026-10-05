// Dedicated source preview. Existing Vite config, packages, dist and production services stay intact.
import { createServer } from "vite";
process.env.CLOUDFLARE_WORKER_BUILD = "1";
const server = await createServer({ server: { host: "127.0.0.1", port: 5187, strictPort: true,
  allowedHosts: ["traktoriupadangos.lt", "unknown-domain.example"] } });
await server.listen();
server.printUrls();
