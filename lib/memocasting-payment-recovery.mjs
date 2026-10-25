// The email link's purpose-bound capability stays in a URL fragment until
// hydration. Never send it to analytics, HTTP query strings or third parties.
export function takeMemoPaymentRecovery(location, history) {
  if (typeof location?.hash !== 'string' || !location.hash.startsWith('#resume=')) return undefined;
  const value = location.hash.slice(8);
  history.replaceState(null, '', location.pathname + location.search);
  if (!/^r1_[a-f0-9-]{36}_[a-z0-9]{8,11}_[a-f0-9]{64}$/.test(value)) throw Error('payment_recovery_forbidden');
  return value;
}
