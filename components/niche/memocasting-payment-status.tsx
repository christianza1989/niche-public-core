'use client';
import {useEffect,useState} from 'react';
import {memoCommerceClient} from './memocasting-native-checkout';
import {memoPaymentAvailability} from '@/lib/memocasting-payment-status.mjs';
export function MemoPaymentStatus(){
 const [state,setState]=useState('unknown');
 useEffect(()=>{let cancelled=false;memoCommerceClient().request('/api/storefront-context').then((context:unknown)=>{if(!cancelled)setState(memoPaymentAvailability(context));}).catch(()=>{if(!cancelled)setState('unknown');});return()=>{cancelled=true;};},[]);
 const text=state==='test'?'Įjungtas tik testinis Stripe atsiskaitymas. Tikri pinigai nenuskaitomi.':state==='unavailable'?'Mokėjimai šiuo metu neįjungti.':'Galimi mokėjimo būdai pateikiami atsiskaitymo metu.';
 return <div className="footer-payment"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8h18a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3h16"/><path d="M28 14h-8a3 3 0 0 0 0 6h8"/><circle cx="21" cy="17" r=".8" fill="currentColor" stroke="none"/></svg><div><strong>Atsiskaitymas</strong><p role="status">{text}</p></div></div>;
}
