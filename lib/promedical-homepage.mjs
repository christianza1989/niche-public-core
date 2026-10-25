import { uniqueImageFamilies } from './niche-media.mjs';

/** @typedef {import('./niche-sites').NicheMedia} Media */
/** @typedef {{title:string, paragraphs:string[], images:Media[], items:string[], href?:string}} Row */
/** @typedef {Row & {rows:Row[]}} Section */

// Opt in only when the approved page carries the complete selected composition.
// Old packages keep their existing renderer. Text and image identities stay in
// the editorial page, while destinations are resolved from eligible identities.
export function promedicalHomepageModel(page, pages) {
  if (page.type !== 'home') return null;
  /** @type {Section[]} */
  const sections = [];
  let section, row;
  for (const block of page.body) {
    if (block.type === 'heading' && block.level === 2) {
      section = { title: block.text, paragraphs: [], images: [], items: [], rows: [] };
      sections.push(section); row = null;
    } else if (section && block.type === 'heading' && block.level === 3) {
      row = { title: block.text, paragraphs: [], images: [], items: [] };
      section.rows.push(row);
    } else if (section) {
      const target = row || section;
      if (block.type === 'paragraph') target.paragraphs.push(block.text);
      if (block.type === 'list') target.items.push(...block.items);
      if (block.type === 'image') {
        const asset = page.media.find(a => a.id === block.assetId);
        if (!asset) return null;
        target.images.push(asset);
      }
    }
  }
  if (sections.length !== 4 || sections.map(s => s.rows.length).join(',') !== '3,6,0,3') return null;
  const [institutions, groups, configuration, process] = sections;
  if (institutions.rows.some(r => r.images.length !== 1 || r.paragraphs.length !== 1)
    || groups.rows.some(r => !r.images.length) || configuration.images.length !== 1
    || !configuration.paragraphs.length || configuration.items.length !== 3
    || process.rows.some(r => r.paragraphs.length !== 1)) return null;
  const eligible = new Map(pages.map(p => [p.id, p]));
  for (const card of [...institutions.rows, ...groups.rows]) {
    const link = page.links.find(l => l.label === card.title);
    const target = link && eligible.get(link.targetPageId);
    if (!target) return null;
    card.href = target.slug ? `/${target.slug}` : '/';
  }
  // These are existing catalogue filters, not new indexable landing pages.
  groups.rows[0].href += '?q=Mayo';
  groups.rows[1].href += '?q=' + encodeURIComponent('nerūdijančiojo plieno');
  const families = uniqueImageFamilies(page.media);
  if (families.length !== 13) return null;
  return { institutions, groups, configuration, process, hero: families[0], room: families[1] };
}
