// Admission and runtime dispatch share this allowlist. Schema support alone
// does not admit an unwired renderer to the public registry.
import signaturepadsLayout from '../sites/signaturepads/migration/core-layout.json' with { type: 'json' };
export function contentRenderer(pkg) {
  if (pkg?.site?.renderer === 'gift') return 'gift';
  if (pkg?.site?.renderer === 'niche' && pkg.siteId === 'signaturepads') return 'signaturepads';
  return null;
}

export function contentPageSupported(pkg, page) {
  if (contentRenderer(pkg) !== 'signaturepads') return true;
  return signaturepadsLayout.routes[page.id]?.path === contentPagePath(pkg, page);
}

export function contentPagePath(pkg, page) {
  const path = page.slug ? `/${page.slug}` : '/';
  return contentRenderer(pkg) === 'signaturepads' && path !== '/' ? `${path}/` : path;
}
