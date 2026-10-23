/* eslint-disable @next/next/no-img-element -- Host-bound pages reuse the optimized immutable logo. */
import {MemoPaymentStatus} from './memocasting-payment-status';
import {memoPath,memoLabels,memoMarkets} from '@/lib/memocasting-locales.mjs';
import './memocasting-footer.css';
type Link={label:string;href:string};
type Language={language:string;label:string;path:string;current:boolean};
export function MemoAutomation({text}:{text:string}){const [before,after='']=text.split('verslomatika.lt');return <>{before}<a href="https://verslomatika.lt/">verslomatika.lt</a>{after}</>;}
export function MemoHomepageFooter({company,groups,languages,languageLabel,automation,language='lt'}:{company:{code?:string;email:string;phone?:string};groups:Array<{title:string;links:Link[]}>;languages:Language[];languageLabel:string;automation:string;language?:string}){
 const labels=memoLabels[language as keyof typeof memoLabels],market=memoMarkets.find(m=>m.language===language)??memoMarkets[0];
 return <footer className="home-footer">
  <div className="footer-main"><div className="footer-brand"><a className="brand" href={memoPath(market)} aria-label={labels.home}><img src="/memocasting-homepage/v1/media/logo.webp" width="1000" height="300" alt="Memory Casting" loading="lazy"/></a><p className="footer-tagline">{labels.tagline}</p><address><a href={'mailto:'+company.email}>{company.email}</a>{company.phone&&<a href={'tel:'+company.phone}>{company.phone}</a>}</address><a className="footer-instagram" href="https://www.instagram.com/memocasting.lt/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg><span>@memocasting.lt</span></a></div>
   {groups.map(group=><nav aria-label={group.title} key={group.title}><h3>{group.title}</h3>{group.links.map(link=><a href={link.href} key={link.href}>{link.label}</a>)}</nav>)}
  </div>
  <div className="footer-service"><MemoPaymentStatus language={language}/>{languages.length>1&&<nav className="home-languages" aria-label={languageLabel} data-memo-language-switch>{languages.map(l=><a href={l.path} hrefLang={l.language} lang={l.language} aria-current={l.current?'page':undefined} key={l.language}>{l.label}</a>)}</nav>}</div>
  <div className="footer-bottom"><p>MB Memocasting{company.code&&<> · {labels.companyCode} {company.code}</>}</p><p className="home-attribution"><MemoAutomation text={automation}/></p></div>
 </footer>;
}
