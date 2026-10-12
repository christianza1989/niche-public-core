// Route roles only. Eligibility remains owned by projectPublicPages/dueRevision.
export function memoFunctionalPage(pkg,page){return pkg.siteId==='memocasting'&&['cart','checkout','uzsakymas'].includes(page.slug);}
export function memoIndexablePages(pkg,pages){return pkg.siteId==='memocasting'?pages.filter(p=>!memoFunctionalPage(pkg,p)):pages;}
