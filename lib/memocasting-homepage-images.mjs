const media='/memocasting-homepage/v1/media';
// Owner-selected preparation-card illustration, admitted through native media.
export const memoPreparationImageId='e29780ea-9a47-4516-9e8d-35062a7d27ab';
export const memoHeroImage={
 src:media+'/hero-layers/hero-objects-alpha-v4-1536.webp',
 srcSet:[360,640,800,1200,1536].map(w=>media+'/hero-layers/hero-objects-alpha-v4-'+w+'.webp '+w+'w').join(', '),
 sizes:'(max-width: 700px) 92vw, min(61vw, calc((100svh - 130px) * 1.38))'
};
export const memoLogoImage={
 src:media+'/performance-v1/logo-360.webp',
 srcSet:media+'/performance-v1/logo-360.webp 360w, '+media+'/performance-v1/logo-640.webp 640w, '+media+'/logo.webp 1000w'
};
