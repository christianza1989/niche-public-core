'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {createMemoAnalytics} from '@/lib/memocasting-analytics.mjs';
import s from './memocasting-analytics-consent.module.css';

const copy={settings:'Slapukų pasirinkimas',title:'Ar galime matuoti lankomumą?',body:'Su jūsų sutikimu naudosime „Google Analytics“ statistikai apie lankomus puslapius. Analitikos slapukai ir jūsų pasirinkimas saugomi iki 180 dienų. Reklamos funkcijų nejungiame. Atsiskaitymo puslapių nematuojame.',privacy:'Privatumo informacija',accept:'Leisti analitiką',reject:'Nenaudoti analitikos',close:'Uždaryti',granted:'Analitika leidžiama. Pasirinkimą galite bet kada atšaukti.',denied:'Analitika išjungta.',unavailable:'Nepavyko išsaugoti pasirinkimo naršyklėje. Analitika lieka išjungta.'};
type Config={id:string;path:string;title:string;language:string;track:boolean};
type State={choice:string;available:boolean;active:boolean};
type Controller={choose:(choice:string)=>boolean;checkLocation:()=>void;dispose:()=>void};
export function MemoAnalyticsConsent({config,privacyPath}:{config:Config;privacyPath?:string}){
 const t=copy;
 const [state,setState]=useState<State|null>(null),[open,setOpen]=useState(false),[manual,setManual]=useState(false);
 const controller=useRef<Controller|null>(null),trigger=useRef<HTMLButtonElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const pathname=usePathname();
 useEffect(()=>{
  const instance=createMemoAnalytics({browser:window,document,config,onChange:(next:State)=>setState(next)});
  controller.current=instance;
  return ()=>{instance.dispose();controller.current=null;};
 },[config]);
 useEffect(()=>{controller.current?.checkLocation();},[pathname]);
 const shown=!!state&&(open||(config.track&&state.choice==='unknown'));
 function close(){setOpen(false);setManual(false);trigger.current?.focus();}
 function choose(choice:string){const saved=controller.current?.choose(choice);if(saved||choice==='denied')close();}
 return <>
  <button ref={trigger} className={s.trigger} type="button" onClick={()=>{setManual(true);setOpen(true);requestAnimationFrame(()=>heading.current?.focus());}} aria-expanded={shown} aria-controls={shown?'memo-analytics-choice':undefined}>{t.settings}</button>
  {shown&&createPortal(<section id="memo-analytics-choice" className={s.panel} role="region" aria-labelledby="memo-analytics-title" onKeyDown={event=>{if(event.key==='Escape'&&(!config.track||state.choice!=='unknown')){event.preventDefault();close();}}}>
   <div className={s.content}><h2 id="memo-analytics-title" ref={heading} tabIndex={-1}>{t.title}</h2><p>{t.body} {privacyPath&&<a href={privacyPath}>{t.privacy}</a>}</p>
    {state.choice!=='unknown'&&<p className={s.status} role="status">{state.choice==='granted'?t.granted:t.denied}</p>}
    {!state.available&&<p className={s.error} role="status">{t.unavailable}</p>}
   </div><div className={s.actions}><button type="button" onClick={()=>choose('granted')}>{t.accept}</button><button type="button" onClick={()=>choose('denied')}>{t.reject}</button>{manual&&(!config.track||state.choice!=='unknown')&&<button type="button" className={s.close} onClick={close}>{t.close}</button>}</div>
  </section>,document.body)}
 </>;
}
