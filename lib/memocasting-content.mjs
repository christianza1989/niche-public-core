import {memoRoute} from './memocasting-locales.mjs';
// Route roles only. Eligibility remains owned by projectPublicPages/dueRevision.
export function memoFunctionalPage(pkg,page){return pkg.siteId==='memocasting'&&['cart','checkout','uzsakymas'].includes(memoRoute(page).baseSlug);}
export function memoIndexablePages(pkg,pages){return pkg.siteId==='memocasting'?pages.filter(p=>!memoFunctionalPage(pkg,p)):pages;}
