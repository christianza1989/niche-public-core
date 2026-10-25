# Generated shared browser SDK

These two `.mjs` files are exact Git blobs from the reviewed canonical shared commerce-core source. Do not edit them here. They are browser distribution assets, not a fork or a second maintained implementation. The manifest binds their bytes to a40hex source revision; the build verifies both files before compilation.

Update only with `node scripts/sync-commerce-sdk.mjs --source <canonical-core-checkout> --revision <reviewed40hexSHA>`, then review the manifest/file diff and run the actual buyer integration. Sync exports only the fixed public-file allowlist; private service/backend/config/credentials are never copied. The source commit must be an ancestor of the canonical checkout's HEAD.

This export lets a standalone public clone build without private sibling-directory imports. It does not admit production offers, enable provider accounts or deploy anything.
