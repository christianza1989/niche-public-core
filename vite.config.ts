import vinext from "vinext";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./vendor/sites-vite-plugin";
import { hostedContentPreviewConfig } from './scripts/hosted-content-preview.mjs';
import { contentProductionConfig } from './scripts/content-production-config.mjs';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

// Optional checkout-local bindings are excluded from Git. A missing file means
// no bindings; malformed configuration still fails instead of hiding a mistake.
let hostingConfig: { d1?: string; r2?: string } = {};
try {
  hostingConfig = JSON.parse(readFileSync(new URL("./.openai/hosting.json", import.meta.url), "utf8"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
const { d1, r2 } = hostingConfig;
const memoProduction = process.env.MEMO_DEPLOYMENT === "production";
if (memoProduction && (process.env.NICHE_DEV_SITE_ID || process.env.MEMO_COMMERCE_ORIGIN)) {
  throw new Error("Memocasting production must not use local preview overrides");
}
const memoProductionConfig = memoProduction
  ? JSON.parse(readFileSync(new URL("./config/memocasting-worker.json", import.meta.url), "utf8"))
  : {};
const hostedPreview=process.env.CONTENT_HOSTED_PREVIEW==='1';
const contentProduction=process.env.CONTENT_PRODUCTION==='1';
if(contentProduction&&(hostedPreview||memoProduction||process.env.NICHE_DEV_SITE_ID||process.env.MEMO_COMMERCE_ORIGIN))throw Error('Content production cannot inherit preview or another deployment profile');
const productionTarget=contentProduction?JSON.parse(readFileSync(new URL('./.openai/content-production.json',import.meta.url),'utf8')):null;
if(contentProduction&&!/^[a-z0-9][a-z0-9-]{0,62}$/.test(productionTarget.siteId||''))throw Error('Invalid production site identity');
const productionContentConfig=contentProduction?contentProductionConfig(productionTarget,
 JSON.parse(readFileSync(new URL('./lib/generated/content-admissions.json',import.meta.url),'utf8')),
 JSON.parse(readFileSync(new URL(`./content-packages/${productionTarget.siteId}/content-package.json`,import.meta.url),'utf8')),
):{};
if(hostedPreview&&memoProduction)throw Error('Hosted preview cannot be combined with production deployment');
const hostedPreviewConfig=hostedPreview?hostedContentPreviewConfig(
  JSON.parse(readFileSync(new URL('./.openai/hosted-preview.json',import.meta.url),'utf8')),
  JSON.parse(readFileSync(new URL('./lib/generated/content-admissions.json',import.meta.url),'utf8')),
):{};

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

const localBindingConfig = {
  main: "./worker-entry.ts",
  compatibility_flags: ["nodejs_compat"],
  // Niche media and favicons require proxy.ts before static asset serving;
  // otherwise Workers bypass publication checks or show a shared brand icon.
  assets: { binding: "ASSETS", run_worker_first: ["/content-assets/*", "/images/*", "/memocasting-homepage/*", "/signaturepads/*", "/wp-content/uploads/*", "/favicon.svg", "/favicon.ico"] },
  ...(process.env.NICHE_DEV_SITE_ID ? { vars: { NICHE_DEV_SITE_ID: process.env.NICHE_DEV_SITE_ID } } : {}),
  ...(process.env.LEAD_EMAIL_ENABLED === "1" ? {
    send_email: [{
      name: "LEAD_EMAIL",
      allowed_destination_addresses: (process.env.LEAD_EMAIL_RECIPIENTS || "info@pinet.lt")
        .split(",").map((email) => email.trim()).filter(Boolean),
    }],
  } : {}),
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: process.env.CLOUDFLARE_D1_DATABASE_ID || SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
  ...memoProductionConfig,
  ...hostedPreviewConfig,
  ...productionContentConfig,
};

export default defineConfig(async () => {
  // Use Miniflare's local Request.cf placeholder unless fetching is requested.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      ...(managedLinux ? { host: "0.0.0.0" } : {}),
      allowedHosts: ["localhost", "127.0.0.1", "dovanos123.lt", "www.dovanos123.lt", "dovaneles.lt", "www.dovaneles.lt", "dovanadladov.pl", "www.dovanadladov.pl", ...(managedLinux ? ["terminal.local"] : [])],
      ...(isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : {}),
    },
    plugins: [
      vinext(),
      sites({ mockAuth: !managedLinux }),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
