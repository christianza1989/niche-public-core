// Only adapters that render the approved native homepage body expose that body.
// Legacy custom homepages render a separate composition: don't export hidden copy.
const nativeHomepageBodies = new Set(['traktoriupadangos', 'parasoplansetes']);
export function nicheReadingBody(siteId, page) {
  if (page.type === 'home' && !nativeHomepageBodies.has(siteId)) return [];
  return page.body.map(block => {
    if (block.type === 'paragraph') return block.text;
    if (block.type === 'heading') return `${'#'.repeat(block.level)} ${block.text}`;
    if (block.type === 'list') return block.items.map(item => `- ${item}`).join('\n');
    return '';
  }).filter(Boolean);
}
