// Exact owned routes: the legacy mother/child product is distinct from the family kit.
export const memoProducts=Object.freeze([
 {sku:'couple',slug:'rinkinys-porai',logicalSlug:'products/liejimo-rinkinys-porai',kind:'kit',state:'active'},
 {sku:'family',slug:'seimos-rinkinys',logicalSlug:'products/seimos-rinkinys-1',kind:'kit',state:'active'},
 {sku:'mother_child',slug:'products/seimos-rinkinys',logicalSlug:'products/seimos-rinkinys',kind:'kit',state:'inquiry'},
 {sku:'baby_feet',slug:'products/kudikio-pedutes',logicalSlug:'products/kudikio-pedutes',kind:'kit',state:'soldout'},
 {sku:'baby_frame',slug:'products/kudiko-ispaudu-rinkinys-su-remeliu',logicalSlug:'products/kudiko-ispaudu-rinkinys-su-remeliu',kind:'frame',state:'soldout'},
 {sku:'alginate_couple',slug:'products/alginato-papildymas-650g-dvieju-ranku-rinkiniui',logicalSlug:'products/alginato-papildymas-650g-dvieju-ranku-rinkiniui',kind:'refill',state:'inquiry'},
 {sku:'alginate_family',slug:'products/alginato-papildymas-1100g-keturiu-ranku-rinkiniui',logicalSlug:'products/alginato-papildymas-1100g-keturiu-ranku-rinkiniui',kind:'refill',state:'inquiry'},
 {sku:'wooden_base',slug:'products/isdziovintas-uosinis-padeklas',logicalSlug:'products/isdziovintas-uosinis-padeklas',kind:'base',state:'soldout'},
]);
export function memoProductForSlug(slug){return memoProducts.find(p=>p.slug===slug||p.logicalSlug===slug);}
export function memoProductForSku(sku){return memoProducts.find(p=>p.sku===sku);}
