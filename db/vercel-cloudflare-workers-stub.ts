// Vercel build/runtime shim. The production D1 binding is available only in
// the Cloudflare Worker deployment; Vercel pages intentionally fall back to
// curated read-only content until a Vercel-compatible database is configured.
export const env: { DB?: never } = {};

// Vinext also inspects the Cloudflare worker export surface during its build.
// These no-op classes keep that inspection compatible outside a Worker runtime.
export class WorkerEntrypoint {}
export class DurableObject {}
export class WorkflowEntrypoint {}
