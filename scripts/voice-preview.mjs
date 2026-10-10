// Dedicated source preview. Existing Vite config, packages, dist and production services stay intact.
import { createServer } from "vite";
process.env.CLOUDFLARE_WORKER_BUILD = "1";
const port = Number(process.env.VOICE_PREVIEW_PORT || "5187");
const site = process.env.NICHE_DEV_SITE_ID || "traktoriupadangos";
if (!Number.isInteger(port) || port < 1024 || port > 65535 || !/^[a-z0-9-]{1,80}$/.test(site))
  throw new Error("invalid_owned_preview_configuration");
const server = await createServer({ server: { host: "127.0.0.1", port, strictPort: true,
  allowedHosts: [`${site}.lt`, "unknown-domain.example"] } });
await server.listen();
server.printUrls();
