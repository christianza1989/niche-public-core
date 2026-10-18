// Public-package search policy. Publication eligibility remains the caller's
// authoritative projection; this helper never admits a page or a draft.
export function nicheIndexingAllowed(pkg,host,loopbackReview=false){
  const canonical=pkg?.canonicalHost;
  if(!canonical||canonical.endsWith('.example')||['localhost','127.0.0.1'].includes(canonical))return false;
  if(host===canonical)return true;
  return loopbackReview===true&&['localhost','127.0.0.1'].includes(host);
}
