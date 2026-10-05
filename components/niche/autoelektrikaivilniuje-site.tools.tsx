'use client';
import {useState,useSyncExternalStore} from 'react';
import styles from './autoelektrikaivilniuje-site.module.css';

const subscribe=()=>()=>{};
export function DiagnosticInquiry(){
 const ready=useSyncExternalStore(subscribe,()=>true,()=>false),[message,setMessage]=useState(''),[notice,setNotice]=useState('');
 function prepare(){
  const value=(id:string)=>{const el=document.getElementById(id) as HTMLInputElement|HTMLSelectElement|null;return el?.value.trim()||'Nežinau / reikia aptarti'};
  setMessage(`Planinės elektros diagnostikos poreikis Vilniuje.\nAutomobilis: ${value('car')}.\nPastebėtas simptomas: ${value('symptom')}.\nKada pasireiškia / kartojasi: ${value('when')}.\nAnkstesni tikri bandymai: ${value('attempts')}.\nPristatymas ir laikotarpis: ${value('delivery')}.\nSuprantu, kad tai išankstinis poreikio tyrimas, be serviso rezervacijos.`);
  setNotice('Žinutė paruošta. Perskaitykite ir pataisykite; ji dar neišsiųsta.');
  document.getElementById('message')?.focus();
 }
 return <section className={styles.inquiry} id="poreikis" aria-labelledby="inquiry-heading">
  <div className={styles.worksheet}>
   <h2 id="inquiry-heading">Surinkite aplinkybes</h2>
   <p>Ruošinys neprivalomas. Duomenys lieka naršyklėje iki formos pateikimo; galima rašyti iš karto.</p><a href="#zinute" className={styles.textLink}>Rašyti žinutę be ruošinio →</a>
   <label htmlFor="car">Automobilis <span>Modelis ir apytikriai metai; be VIN ar numerio</span></label><input id="car" maxLength={180} placeholder="Pvz., modelis, 2014 m., benzinas"/>
   <label htmlFor="symptom">Pastebėtas simptomas</label><select id="symptom" defaultValue=""><option value="">Pasirinkite arba palikite nežinomą</option><option>Akumuliatorius išsikrauna po stovėjimo</option><option>Bandant užvesti nėra reakcijos</option><option>Girdėti spragtelėjimas</option><option>Variklis sukamas, bet nepasileidžia</option><option>Įkrovimo įspėjimas / reikia aptarti</option></select>
   <label htmlFor="when">Kada tai pasireiškia? <span>Stovėjimo trukmė ir pasikartojimas</span></label><input id="when" maxLength={200} placeholder="Pvz., po dviejų parų; antras kartas"/>
   <label htmlFor="attempts">Kas jau iš tikrųjų bandyta?</label><input id="attempts" maxLength={200} placeholder="Galima parašyti „nieko“ arba „nežinau“"/>
   <label htmlFor="delivery">Pristatymas ir pageidaujamas laikotarpis</label><input id="delivery" maxLength={200} placeholder="Ar galite pristatyti ir palikti automobilį?"/>
   <button type="button" onClick={prepare} disabled={!ready} className={styles.secondaryButton}>Paruošti žinutę →</button>
   <p role="status" className={styles.status}>{notice}</p>
  </div>
  <form id="zinute" tabIndex={-1} action="/uzklausa" method="post" className={styles.form}>
   <h2>Pateikite poreikį</h2><p>Išankstinis tyrimas. Tai nėra vizitas, pasiūlymas ar mokama paslauga.</p><p>Vietinis bandymas: naudokite tik sintetinius duomenis. Laiškų siuntimas išjungtas.</p>
   <label htmlFor="name">Vardas</label><input id="name" name="name" autoComplete="given-name" minLength={2} maxLength={100} required/>
   <label htmlFor="email">El. paštas</label><input id="email" name="email" type="email" autoComplete="email" maxLength={250} required/>
   <label htmlFor="message">Jūsų žinutė <span>Mažiausiai 20 simbolių. Peržiūrėkite prieš pateikdami.</span></label><textarea id="message" name="message" value={message} onChange={e=>setMessage(e.target.value)} minLength={20} maxLength={3000} rows={11} required/>
   <div className={styles.trap} aria-hidden="true"><label htmlFor="website">Interneto svetainė</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
   <label className={styles.consent}><input name="consent" type="checkbox" value="yes" required/><span>Sutinku pateikti šią žinutę MB Pinet mano poreikiui nagrinėti. Susipažinau su <a href="/privatumas">privatumo tekstu</a>. Tai nėra rinkodaros prenumerata.</span></label>
   <button type="submit" className={styles.button}>Pateikti išankstinį poreikį →</button>
   <p className={styles.caption}>Vietinis bandymas: naudokite sintetinius duomenis. Laiškų siuntimas išjungtas.</p>
  </form>
 </section>;
}
