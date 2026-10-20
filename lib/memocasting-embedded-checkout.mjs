// Stripe.js is fetched directly from Stripe only when the buyer opens payment.
const stripeScript='https://js.stripe.com/endive/stripe.js';
let stripeReady;
export function loadMemoStripe(){
  if(typeof window.Stripe==='function')return Promise.resolve(window.Stripe);
  if(stripeReady)return stripeReady;
  stripeReady=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=stripeScript;script.async=true;
    const fail=()=>{clearTimeout(timer);script.remove();stripeReady=undefined;reject(Error('payment_unavailable'));};
    const timer=setTimeout(fail,20000);
    script.addEventListener('error',fail,{once:true});
    script.addEventListener('load',()=>{clearTimeout(timer);if(typeof window.Stripe==='function')resolve(window.Stripe);else fail();},{once:true});
    document.head.append(script);
  });
  return stripeReady;
}
const messages={lt:{title:'Apmokėjimas',loading:'Kraunama saugi mokėjimo forma…',hosted:'Tęsti saugų apmokėjimą',pending:'Mokėjimo rezultatas tikrinamas. Atnaujinkite užsakymo būseną.'},pl:{title:'Płatność',loading:'Ładowanie bezpiecznego formularza płatności…',hosted:'Przejdź do bezpiecznej płatności',pending:'Weryfikujemy wynik płatności. Odśwież status zamówienia.'},lv:{title:'Apmaksa',loading:'Tiek ielādēta droša maksājuma veidlapa…',hosted:'Turpināt drošu apmaksu',pending:'Maksājuma rezultāts tiek pārbaudīts. Atjauniniet pasūtījuma statusu.'},et:{title:'Maksmine',loading:'Turvalise maksevormi laadimine…',hosted:'Jätka turvalise maksega',pending:'Makse tulemust kontrollitakse. Värskendage tellimuse olekut.'}};
/** @param {{target:HTMLElement,client:any,onComplete:()=>Promise<void>,signal?:AbortSignal,language?:string,loadStripe?:()=>Promise<any>}} options */
export async function renderMemoPayment({target,client,onComplete,signal,language='lt',loadStripe=loadMemoStripe}){
  const t=messages[language]||messages.lt;
  target.replaceChildren();
  const heading=document.createElement('h2');heading.textContent=t.title;
  const status=document.createElement('p');status.setAttribute('role','status');status.textContent=t.loading;
  target.append(heading,status);
  const details=await client.checkoutDetails({uiMode:'embedded'});
  if(signal?.aborted)return;
  // Orders opened on the former hosted checkout retain their original Session.
  if(details.uiMode==='hosted'){
    const link=document.createElement('a');link.href=details.url;link.className='checkout-catalogue';link.textContent=t.hosted;
    status.remove();target.append(link);return;
  }
  const Stripe=await loadStripe();if(signal?.aborted)return;
  const stripe=Stripe(details.publishableKey,{locale:language==='et'?'et':language});
  if(typeof stripe?.createEmbeddedCheckoutPage!=='function')throw Error('payment_unavailable');
  let completed=false;
  const checkout=await stripe.createEmbeddedCheckoutPage({fetchClientSecret:async()=>details.clientSecret,onComplete:()=>{
    if(completed||signal?.aborted)return;completed=true;status.textContent=t.pending;
    Promise.resolve(onComplete()).catch(()=>{if(!signal?.aborted){status.setAttribute('role','alert');status.textContent=t.pending;}});
  }});
  if(signal?.aborted){checkout.destroy();return;}
  const mount=document.createElement('div');mount.className='checkout-stripe-frame';
  target.append(mount);checkout.mount(mount);status.remove();
  return()=>checkout.destroy();
}
