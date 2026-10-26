import {memoRoute} from './memocasting-locales.mjs';

// The caller supplies the common, currently eligible public projection.
export function memoCheckoutPolicies(pages) {
  return pages.filter(page=>memoRoute(page).baseSlug==='naudojimo-salygos')
    .map(page=>({country:memoRoute(page).country,language:memoRoute(page).language,
      policyVersion:page.revisionHash,url:'/'+page.slug}));
}

export function memoResolveTerms(policies,{country,policyVersion}) {
  const policy=policies.find(p=>p.country===country&&p.policyVersion===policyVersion);
  return policy?.url??null;
}
