'use client';
import {useState} from 'react';
import {summarizeQuoteCheck} from '@/lib/laiptucentras-quote-check.mjs';
import styles from './laiptucentras-site.module.css';
type Choice='unknown'|'included'|'excluded';
export function LaiptucentrasQuoteCheck({items}:{items:string[]}) {
  const labels=items.map(text=>text.split(':')[0]);
  const [choices,setChoices]=useState<[Choice,Choice][]>(()=>items.map(()=>['unknown','unknown']));
  const result=summarizeQuoteCheck(labels,choices);
  function change(row:number,offer:0|1,value:Choice){setChoices(old=>old.map((pair,i)=>i===row?[offer===0?value:pair[0],offer===1?value:pair[1]]:pair));}
  return <div className={styles.quoteCheck}>
    <p className={styles.quoteInstruction}>Turite du pasiūlymus? Pažymėkite, ką kiekvienas aiškiai apima. Nežinomą eilutę palikite „Neaišku“. Kainų ar kontaktų čia įvesti nereikia.</p>
    <div className={styles.quoteLegend} aria-hidden="true"><span>Darbų apimtis</span><span>Pasiūlymas A</span><span>Pasiūlymas B</span></div>
    {items.map((text,i)=><div className={styles.quoteRow} key={text}><details className={styles.quoteDetail}><summary>{labels[i]}</summary><p>{text.slice(text.indexOf(':')+1).trim()}</p></details>{([0,1] as const).map(offer=><label className={styles.quoteChoice} key={offer}><span className={styles.srOnly}>Pasiūlymas {offer===0?'A':'B'}</span><select aria-label={`${labels[i]} – pasiūlymas ${offer===0?'A':'B'}`} value={choices[i][offer]} onChange={e=>change(i,offer,e.target.value as Choice)}><option value="unknown">Neaišku</option><option value="included">Įtraukta</option><option value="excluded">Neįtraukta</option></select></label>)}</div>)}
    <div className={styles.quoteResult} role="status" aria-live="polite" aria-atomic="true">
      <p>Neaiškių eilučių: A – {result.unknownA.length}, B – {result.unknownB.length}.</p>
      {result.different.length>0&&<p>Skirtingai pažymėta apimtis: {result.different.join(', ')}. Prieš lygindami sumas paprašykite patikslinimo.</p>}
      {result.unknownA.length===0&&result.unknownB.length===0&&<p>Visoms pateiktoms eilutėms pažymėjote būseną. Tai dar nepatvirtina vienodų medžiagų, kiekių ar galutinės kainos.</p>}
    </div>
    <p className={styles.formHelp}>Tai jūsų pasiūlymų klausimų ruošinys. Pasirinkimai nesiunčiami ir neišsaugomi; perkrovus puslapį išnyks. <a href="/laiptu-kaina">Visas sąmatos palyginimo gidas</a>.</p>
    <noscript><p>Interaktyvus palyginimas veikia su JavaScript. Aukščiau esantis darbų sąrašas ir išsamus gidas prieinami ir be jo.</p></noscript>
  </div>;
}
