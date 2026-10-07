// Canonical approved blocks only. Callers supply the same public projection as HTML.
export function nicheReadingBody(page) {
  // Legacy bespoke homes may render selected/adapted blocks. Export their
  // approved summary until an audited, signed canonical-body contract exists.
  if(page.type==='home'&&page.bodyProjection!=='canonical')return [];
  return page.body.flatMap(block => block.type === 'paragraph' ? [block.text]
    : block.type === 'heading' ? [`${'#'.repeat(block.level)} ${block.text}`]
    : block.type === 'list' ? [block.items.map(item => `- ${item}`).join('\n')]
    : []);
}
