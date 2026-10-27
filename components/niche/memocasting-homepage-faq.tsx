type Faq={items:{question:string;answers:string[]}[];links:{href:string;label:string;icon:string}[]};
function Icon({kind}:{kind:string}){
 const paths:Record<string,string>={book:'M12 5v15M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Z',help:'M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1',delivery:'M3 6h11v12H3ZM14 10h4l3 4v4h-7M8 18a2 2 0 1 1-4 0m16 0a2 2 0 1 1-4 0',return:'M4 8h10a6 6 0 0 1 0 12h-3M8 4 4 8l4 4',contact:'M3 5h18v14H3ZM3 5l9 8 9-8'};
 return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind]||paths.help}/></svg>;
}
export function MemoHomepageFaq({faq}:{faq:Faq|null}){
 if(!faq?.items.length)return null;
 return <section className="memo-faq" id="klausimai" aria-labelledby="memo-faq-title">
  <div className="memo-faq-intro"><h2 id="memo-faq-title">Ką verta žinoti<br/>prieš liejant?</h2><p>Nuo rinkinio pasirinkimo iki liejinio apdailos – atsakymai vienoje vietoje.</p>
   <nav aria-label="Instrukcijos ir pagalba">{faq.links.map(link=><a href={link.href} key={link.href}><Icon kind={link.icon}/><span>{link.label}</span><svg className="memo-faq-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>)}</nav>
  </div>
  <div className="memo-faq-list">{faq.items.map((item,index)=><details key={item.question} open={index===0}><summary>{item.question}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path className="memo-faq-plus" d="M12 5v14"/></svg></summary><div className="memo-faq-answer">{item.answers.map((answer,i)=><p key={i}>{answer}</p>)}</div></details>)}</div>
 </section>;
}
