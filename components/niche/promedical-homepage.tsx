/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages -- Native SSR navigation and canonical responsive media. */
import type { NichePackage, NichePage, NicheMedia } from '@/lib/niche-sites';
import { imageSrcSet } from '@/lib/niche-media.mjs';
import { promedicalHomepageModel } from '@/lib/promedical-homepage.mjs';
import { nicheJsonLd } from '@/lib/niche-seo';
import styles from './promedical-homepage.module.css';

type Model = NonNullable<ReturnType<typeof promedicalHomepageModel>>;
const brand = '/brand/promedical/homepage/';
export function promedicalHomepageJsonLd(pkg: NichePackage, page: NichePage, pages: NichePage[]) {
  const graph = JSON.parse(nicheJsonLd(pkg, page, pages));
  const organization = graph['@graph'].find((item: { '@type': string }) => item['@type'] === 'Organization');
  if (organization) organization.logo = { '@type': 'ImageObject', url: `https://${pkg.canonicalHost}${brand}logo-sharp-640.webp`, width: 640, height: 213 };
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}
function Icon({ name, size = 20 }: { name: string; size?: number }) { return <img src={`${brand}${name}.svg`} width={size} height={size} alt="" aria-hidden="true"/>; }
function Brand() { return <a className="brand" href="/" aria-label="Promedical – pradinis puslapis"><img src={`${brand}logo-sharp-640.webp`} srcSet={`${brand}logo-sharp-640.webp 640w, ${brand}logo-sharp-1280.webp 1280w`} sizes="(max-width: 360px) 145px, (max-width: 640px) 165px, 192px" width={640} height={213} alt="Promedical"/></a>; }
function Lines({ text, after }: { text: string; after: number }) { const words = text.split(' '); return after > 0 && words.length > after ? <>{words.slice(0, after).join(' ')}<br/>{words.slice(after).join(' ')}</> : <>{text}</>; }
function Photo({ page, asset, className, sizes, decorative = false, eager = false }: { page: NichePage; asset: NicheMedia; className?: string; sizes: string; decorative?: boolean; eager?: boolean }) {
  return <img className={className} src={asset.src} srcSet={imageSrcSet(page.media, asset)} sizes={sizes} width={asset.width} height={asset.height} alt={decorative ? '' : asset.alt} aria-hidden={decorative || undefined} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async"/>;
}
function RoomPhoto({ page, asset }: { page: NichePage; asset: NicheMedia }) {
  return <picture><source media="(min-width: 641px)" srcSet={imageSrcSet(page.media, asset)} sizes="(max-width: 1520px) 145vw, 2100px"/><img className="hero-room-background" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" width={asset.width} height={asset.height} alt="" aria-hidden="true" fetchPriority="low" decoding="async"/></picture>;
}

function HeaderContent({ q, standalone = false }: { q?: string; standalone?: boolean }) { return <header className={`header${standalone ? ' header-standalone' : ''}`} aria-label="Svetainės antraštė">
          <Brand/>
          <nav className="navigation" aria-label="Pagrindinė navigacija">
            <a className="nav-item products" href="/produktai">Produktai</a>
            <a className="nav-item" href="/apie-projekta">Apie mus</a>
            <a className="nav-item" href="/kontaktai">Kontaktai</a>
          </nav>
          <form className="search" role="search" action="/produktai" method="get">
            <label className="sr-only" htmlFor="equipment-search">Ieškoti įrangos</label>
            <input type="search" id="equipment-search" name="q" defaultValue={q || ''} placeholder="Ieškoti įrangos…" autoComplete="off" maxLength={100}/>
            <button className="search-button" type="submit" aria-label="Ieškoti"><Icon name="search" size={21}/></button>
          </form>
          <a className="button button-primary header-request" href="/kontaktai">Pateikti užklausą</a>
        </header>; }
function FooterContent({ pkg }: { pkg: NichePackage }) { const contact = pkg.site.contact; return <footer className="preview-footer" aria-label="Svetainės poraštė"><div className="footer-main"><Brand/><nav className="footer-navigation" aria-label="Poraštės navigacija"><a href="/produktai">Produktai</a><a href="/gidai">Gidai</a><a href="/apie-projekta">Apie mus</a><a href="/kontaktai">Kontaktai</a></nav><address className="footer-contacts"><a href={`mailto:${contact.email}`} data-interest="email_click">{contact.email}</a>{contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, '')}`} data-interest="phone_click">{contact.phone.replace(/^(\+370)(\d{3})(\d+)$/, '$1 $2 $3')}</a>}</address></div>
        <div className="footer-bottom"><small>© 2026 Promedical.</small><div className="footer-legal"><a href="/privatumas">Privatumas</a><a href="/naudojimo-salygos">Naudojimo sąlygos</a></div></div>
      </footer>; }
function ChromeFrame({ children }: { children: React.ReactNode }) { return <div className={styles.root}><div className="pm-home"><div className="page-width-frame" data-width-variant="1440" style={{ '--preview-max-width': '1440px', '--preview-side-gap': '40px' } as React.CSSProperties}>{children}</div></div></div>; }
export function PromedicalHeader({ q }: { q?: string }) { return <ChromeFrame><a className="skip-link" href="#turinys">Pereiti prie turinio</a><HeaderContent q={q} standalone/></ChromeFrame>; }
export function PromedicalFooter({ pkg }: { pkg: NichePackage }) { return <ChromeFrame><FooterContent pkg={pkg}/></ChromeFrame>; }

export function PromedicalHomepage({ pkg, page, model: m }: { pkg: NichePackage; page: NichePage; model: Model }) {
  return <div className={styles.root}><div className="pm-home">
    <a className="skip-link" href="#turinys">Pereiti prie turinio</a>
    <div className="page-width-frame" data-width-variant="1440" style={{ '--preview-max-width': '1440px', '--preview-side-gap': '40px' } as React.CSSProperties}>
      <div className="masthead">
        <RoomPhoto page={page} asset={m.room}/>
        <Photo page={page} asset={m.hero} className="hero-image" sizes="(max-width: 640px) 230vw, (max-width: 1520px) calc(100vw - 140px), 1370px" decorative eager/>
        <HeaderContent/>
        <div className="hero-stage"><section className="hero" aria-labelledby="hero-heading"><div className="hero-copy">
          <h1 id="hero-heading">{page.title.split(' ir ')[0]}<br/> ir {page.title.split(' ir ').slice(1).join(' ir ')}</h1>
          <p className="hero-description">{page.description}</p>
          <div className="hero-actions"><a className="button button-primary catalog-button" href="/produktai">Peržiūrėti katalogą <Icon name="arrow-right-white"/></a><a className="button button-secondary" href="/kontaktai">Pateikti užklausą</a></div>
        </div></section></div>
      </div>
      <main id="turinys" tabIndex={-1} className="home-sections">
        <section className="institutions-section content-container" aria-labelledby="institutions-heading">
          <div className="section-heading"><div><h2 id="institutions-heading">{m.institutions.title}</h2><p className="section-intro">{m.institutions.paragraphs[0]}</p></div><a className="section-link" href="/produktai">Peržiūrėti visus sprendimus <Icon name="arrow-right-red" size={17}/></a></div>
          <div className="institution-grid">{m.institutions.rows.map((card) => <article className="institution-card" key={card.title}>
            <a href={card.href} tabIndex={-1} aria-hidden="true"><Photo page={page} asset={card.images[0]} className="institution-photo" sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1520px) 30vw, 440px" decorative/></a>
            <div className="institution-heading"><h3><a href={card.href}>{card.title}</a></h3><a className="institution-arrow" href={card.href} tabIndex={-1} aria-hidden="true"><Icon name="arrow-right-dark" size={21}/></a></div><p>{card.paragraphs[0]}</p>
          </article>)}</div>
        </section>
        <section className="product-groups-section content-container" aria-labelledby="product-groups-heading">
          <div className="section-heading"><h2 id="product-groups-heading">{m.groups.title}</h2><a className="section-link" href="/produktai">Peržiūrėti visus produktus <Icon name="arrow-right-red" size={17}/></a></div>
          <div className="product-group-grid">{m.groups.rows.map((card, i) => <a className="product-group" href={card.href} key={card.title}>
            <span className={`product-group-image${i === 2 ? ' product-group-iso' : i === 5 ? ' product-group-accessories' : ''}`}>{card.images.map(asset => i === 5 ? <span className="accessory-item" key={asset.id}><Photo page={page} asset={asset} decorative sizes="(max-width: 700px) 38vw, 165px"/></span> : <Photo page={page} asset={asset} key={asset.id} decorative sizes="(max-width: 700px) 43vw, (max-width: 1000px) 26vw, 220px"/>)}</span>
            <span className="product-group-label"><Lines text={card.title} after={[0,2,2,1,1,2][i]}/></span>
          </a>)}</div>
        </section>
        <section className="configuration-section content-container" aria-labelledby="configuration-heading">
          <figure className="configuration-visual"><Photo page={page} asset={m.configuration.images[0]} className="configuration-photo" decorative sizes="(max-width: 740px) calc(100vw - 40px), (max-width: 1520px) 50vw, 740px"/></figure>
          <div className="configuration-copy"><h2 id="configuration-heading"><Lines text={m.configuration.title} after={2}/></h2><p>{m.configuration.paragraphs[0]}</p>
            <a className="button button-primary configuration-request" href="/kontaktai"><span>Pateikti užklausą</span><span className="configuration-request-arrow"><Icon name="arrow-right-white" size={22}/></span></a>
            <ul className="configuration-benefits">{m.configuration.items.map((text, i) => <li key={text}><span className="configuration-benefit-icon"><Icon name={['configuration-selection', 'configuration-modules', 'configuration-consultation'][i]} size={24}/></span><span>{text}</span></li>)}</ul>
          </div>
        </section>
        <section className="inquiry-process-section content-container" aria-labelledby="inquiry-process-heading"><div className="inquiry-process"><h2 id="inquiry-process-heading">{m.process.title}</h2><ol className="process-steps" role="list">{m.process.rows.map((card, i) => <li className="process-step" key={card.title}>
          <span className="process-number" aria-hidden="true">{i + 1}</span><div className="process-content"><img className="process-icon" src={`${brand}${['process-trolley', 'process-document', 'process-conversation'][i]}.svg`} width={48} height={48} alt=""/><h3>{card.title}</h3><p>{card.paragraphs[0]}</p></div>{i < 2 && <img className="process-connector" src={`${brand}process-chevron.svg`} width={28} height={56} alt=""/>}
        </li>)}</ol></div></section>
      </main>
      <FooterContent pkg={pkg}/>
    </div>
  </div></div>;
}
