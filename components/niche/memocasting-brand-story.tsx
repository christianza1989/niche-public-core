type BrandStory={heading:string;paragraphs:string[];links:{href:string;label:string}[]};

export function MemoBrandStory({story}:{story:BrandStory|null}){
 if(!story)return null;
 return <section className="memo-brand-story" id="apie-memory-casting" aria-labelledby="memo-brand-title">
  <div className="memo-brand-heading"><p>APIE MEMORY CASTING</p><h2 id="memo-brand-title">{story.heading}</h2></div>
  <div className="memo-brand-copy">{story.paragraphs.map((text,i)=><p key={i}>{text}</p>)}</div>
  {story.links.length>0&&<nav className="memo-brand-links" aria-label="Apie mus ir mūsų pagalbą">{story.links.map(link=><a key={link.href} href={link.href}><span>{link.label}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>)}</nav>}
 </section>;
}
