'use client';
import {useEffect,useState} from 'react';
import {memoCommerceClient} from '@/lib/memocasting-browser-commerce.mjs';
import {memoPaymentAvailability} from '@/lib/memocasting-payment-status.mjs';
import {memoFooterCopy} from '@/lib/memocasting-footer.mjs';
export function MemoPaymentStatus({language='lt'}:{language?:string}){
 const [state,setState]=useState('unknown');
 useEffect(()=>{let cancelled=false;memoCommerceClient().request('/api/storefront-context').then((context:unknown)=>{if(!cancelled)setState(memoPaymentAvailability(context));}).catch(()=>{if(!cancelled)setState('unknown');});return()=>{cancelled=true;};},[]);
 const copy=memoFooterCopy(language),text=state==='test'?copy.test:state==='unavailable'?copy.unavailable:copy.available;
 return <div className="footer-payment"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8h18a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3h16"/><path d="M28 14h-8a3 3 0 0 0 0 6h8"/><circle cx="21" cy="17" r=".8" fill="currentColor" stroke="none"/></svg><div><strong>{copy.payment}</strong><p role="status">{text}</p></div></div>;
}
