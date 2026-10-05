/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element -- Native links and sized WebP. */
import type { CSSProperties } from "react";
import { nichePagePath, type NicheBlock, type NicheMedia, type NichePage, type NichePackage } from "@/lib/niche-sites";
import { LinkedText } from "./linked-text";
import { nicheJsonLd } from "@/lib/niche-seo";
import { nicheNetworkContact } from "@/lib/niche-network";
import { nicheBreadcrumbs } from "@/lib/niche-schema-core.mjs";
import { ArticleMeta } from "./article-meta";
import { imageSrcSet, visibleImageCredit } from "@/lib/niche-media.mjs";
import styles from "@/app/niche/[siteId]/[[...slug]]/site.module.css";
function Block({ block, media, page, livePages }: { block: NicheBlock; media: NicheMedia[]; page: NichePage; livePages: NichePage[] }) {
  if (block.type === "paragraph") return <p><LinkedText text={block.text} page={page} livePages={livePages} /></p>;
  if (block.type === "heading") return block.level === 2 ? <h2>{block.text}</h2> : <h3>{block.text}</h3>;
  if (block.type === "list") return <ul>{block.items.map((item, index) => <li key={`${index}-${item}`}><LinkedText text={item} page={page} livePages={livePages} /></li>)}</ul>;
  const asset = media.find((item) => item.id === block.assetId);
  if (!asset) return null;
  return (
    <figure className={styles.articleImage}>
      <img src={asset.src} srcSet={imageSrcSet(media,asset)} sizes="(max-width: 760px) calc(100vw - 44px), 760px" alt={asset.alt} width={asset.width} height={asset.height} loading="lazy" decoding="async" />
      {visibleImageCredit(asset) && <figcaption>{visibleImageCredit(asset)}</figcaption>}
    </figure>
  );
}

function Contact({ email, phone, greitos = false, pages }: { email: string; phone?: string; greitos?: boolean; pages: NichePage[] }) {
  return (
    <section id="kontaktai" className={styles.contact} aria-labelledby="contact-title">
      <div className={styles.contactIntro}>
        <p className={styles.eyebrow}>{greitos ? "Pradėkime nuo jūsų darbų" : "Susisiekime"}</p>
        <h2 id="contact-title">{greitos ? "Kokia svetainė padėtų jūsų klientams apsispręsti?" : "Papasakokite, ko ieškote"}</h2>
        <p>{greitos ? "Parašykite, kokius apdailos darbus atliekate ir ką norite parodyti klientams. Pagal tai pasiūlysime tinkamą puslapių apimtį." : "Atsakysime pagal jūsų pateiktą poreikį. Užklausa dar nėra užsakymas ar patvirtinta rezervacija."}</p>
      </div>
      <form className={styles.leadForm} action="/uzklausa" method="post" acceptCharset="utf-8">
        <label>Jūsų vardas<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label>El. paštas<input name="email" type="email" autoComplete="email" maxLength={250} required /></label>
        <label>{greitos ? "Kokius darbus atliekate ir kokios svetainės reikia?" : "Ko ieškote?"}<textarea name="message" rows={5} minLength={20} maxLength={3000} required aria-describedby="message-help" placeholder={greitos ? "Pvz., atlieku vonios remontą Kaune, turiu 8 darbų nuotraukas ir noriu gauti aiškesnes užklausas..." : undefined} /></label>
        <p id="message-help">Trumpai aprašykite savo poreikį, bent 20 simbolių. Visi matomi laukai privalomi.</p>
        <label className={styles.formConsent}><input name="consent" type="checkbox" value="yes" required /> Sutinku, kad šie duomenys būtų naudojami atsakyti į mano užklausą.</label>
        <p>Vardą, el. paštą ir žinutę saugome užklausai apdoroti. {pages.some(p=>p.slug === "privatumas") && <><a href="/privatumas">Privatumo informacija</a>. </>}Dėl savo duomenų rašykite <a href={`mailto:${email}`}>{email}</a>. Rinkodaros laiškų pagal šią formą nesiunčiame.</p>
        <div className={styles.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <button type="submit">{greitos ? "Gauti pasiūlymą" : "Siųsti užklausą"}</button>
      </form>
      <div className={styles.contactActions}>
        <a href={`mailto:${email}`}>Rašyti el. paštu</a>
        {phone && <a href={`tel:${phone.replace(/[^+0-9]/g, "")}`}>Skambinti: {phone}</a>}
      </div>
    </section>
  );
}

function Footer({ pkg, pages }: { pkg: NichePackage; pages: NichePage[] }) {
  return <footer className={styles.footer}>
    <span>{pkg.site.name}</span>
    <span>{nicheNetworkContact(pkg.siteId).operatorName}</span>
    <span>El. paštas: <a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></span>
    {pkg.site.contact.phone && <span>Telefonas: <a href={`tel:${pkg.site.contact.phone.replace(/[^+0-9]/g, "")}`}>{pkg.site.contact.phone}</a></span>}
    {pages.filter(p=>["privatumas","apie-projekta","redakcija","naudojimo-salygos","kontaktai","gidai"].includes(p.slug)).map(p=><a key={p.id} href={nichePagePath(p)}>{p.title}</a>)}
    <span>Mūsų verslas automatizuotas su <a href="https://verslomatika.lt/" rel="noopener noreferrer">verslomatika.lt</a></span>
  </footer>;
}

function GreitosHomepage({ pkg, page, livePages, hero, siteStyle }: { pkg: NichePackage; page: NichePage; livePages: NichePage[]; hero?: NicheMedia; siteStyle: CSSProperties }) {
  const service = livePages.find((item) => item.slug === "svetaine-apdailos-meistrui");
  const guides = ["gidas/darbu-pavyzdziai-meistrui", "ka-tureti-meistro-svetaineje", "svetaine-ar-facebook-puslapis-meistrui"]
    .map((slug) => livePages.find((item) => item.slug === slug)).filter((item): item is NichePage => Boolean(item));
  const faq = livePages.find((item) => item.slug === "duk");
  return <div className={`${styles.shell} ${styles.greitos}`} style={siteStyle}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: nicheJsonLd(pkg, page) }} />
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.brand} href="/"><span className={styles.brandSymbol} aria-hidden="true">g<span>.</span></span><span>greitos<span className={styles.brandAccent}>svetainės</span></span></a>
        <nav className={styles.nav} aria-label="Pagrindinė navigacija">
          <a href="#sprendimas">Sprendimas</a><a href="#procesas">Kaip dirbame</a><a href="#gidai">Gidai</a>
          {service && <a href={nichePagePath(service)}>Paslauga</a>}
        </nav>
        <a className={styles.headerContact} href="#kontaktai">Aptarti svetainę <span aria-hidden="true">↗</span></a>
      </div>
    </header>
    <main>
      <section className={styles.pilotHero} aria-labelledby="pilot-title">
        <div className={styles.pilotHeroInner}>
          <div className={styles.pilotHeroCopy}>
            <p className={styles.pilotKicker}><span aria-hidden="true" /> Svetainės apdailos meistrams</p>
            <h1 id="pilot-title">Parodykite savo darbus. <em>Gaukite aiškesnes užklausas.</em></h1>
            <p className={styles.pilotLead}>Kuriame svetaines meistrams, kuriose klientas greitai randa jūsų paslaugas, pamato darbų pavyzdžius ir tiksliai aprašo savo poreikį. Jūs gaunate daugiau konteksto pirmajam pokalbiui.</p>
            <div className={styles.pilotActions}>
              <a className={styles.pilotPrimary} href="#kontaktai">Aptarti mano svetainę <span aria-hidden="true">↗</span></a>
              {service && <a className={styles.pilotSecondary} href={nichePagePath(service)}>Kas įeina į paslaugą</a>}
            </div>
            <div className={styles.pilotHighlights}><span>Mobilus dizainas</span><span>Darbų galerija</span><span>Užklausos forma</span></div>
          </div>
          <div className={styles.mockWrap} aria-label="Konceptinis meistro svetainės maketas">
            <div className={styles.mockBrowser}>
              <div className={styles.mockTop}><div><i /><i /><i /></div><span>Jūsų būsima svetainė</span><b>↗</b></div>
              <div className={styles.mockBody}>
                <div className={styles.mockNav}><strong>Jūsų vardas.</strong><span>Paslaugos &nbsp; Darbai &nbsp; Kontaktai</span></div>
                <p className={styles.mockEyebrow}>APDAILOS DARBAI</p>
                <h2>Jūsų darbai kalba.<br />Svetainė padeda juos parodyti.</h2>
                <div className={styles.mockPills}><span>Vonios remontas</span><span>Dažymas</span><span>Plytelių klojimas</span></div>
                <div className={styles.mockInquiry}><span>NAUJA UŽKLAUSA</span><strong>Ko reikia klientui?</strong><div><i>Darbo tipas</i><b>Vonios atnaujinimas</b></div><div><i>Vieta</i><b>Kaunas</b></div><div><i>Apimtis</i><b>Trumpas aprašymas</b></div></div>
              </div>
            </div>
            <p className={styles.mockCaption}>Iliustracinis maketas, ne kliento projektas</p>
          </div>
        </div>
      </section>

      <section className={styles.valueStrip} aria-label="Kuo remiasi svetainė"><div><span>01 / AIŠKUMAS</span><strong>Klientas iškart supranta, ką darote.</strong></div><div><span>02 / PASITIKĖJIMAS</span><strong>Rodo tikrus darbus ir jų kontekstą.</strong></div><div><span>03 / UŽKLAUSOS</span><strong>Surenka informaciją prieš pirmą pokalbį.</strong></div></section>

      <section id="sprendimas" className={styles.pilotSection}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Svetainė su tikslu</p><h2>Ne vien gražus puslapis. Aiškesnis kelias nuo paieškos iki pokalbio.</h2><p>Žmogus, ieškantis meistro, nori greitai suprasti tris dalykus: ar atliekate jo darbą, kaip atrodo jūsų rezultatas ir kaip pateikti užklausą. Šiuos atsakymus sudedame į aiškią struktūrą.</p></div>
        <div className={styles.featureGrid}>
          <article><span>01</span><h3>Paslaugos be miglos</h3><p>Kiekvienai svarbiai paslaugai — aiškus aprašymas, darbų ribos ir informacija, kurios reikia pirmajam įvertinimui.</p></article>
          <article><span>02</span><h3>Darbai su kontekstu</h3><p>Nuotraukos su trumpu paaiškinimu, kas buvo atlikta. Rodome tik jūsų pateiktą medžiagą, kurią leidžiama viešinti.</p></article>
          <article><span>03</span><h3>Tikslesnė užklausa</h3><p>Kontaktų kelias padeda klientui aprašyti darbą, vietą ir apimtį. Jums lengviau nuspręsti, nuo ko pradėti atsakymą.</p></article>
        </div>
      </section>

      <section className={styles.pilotShowcase}>
        <div className={styles.showcaseMedia}>{hero && <img src={hero.src} width={hero.width} height={hero.height} alt={hero.alt} loading="lazy" decoding="async" />}<span>Vizualinė iliustracija</span></div>
        <div className={styles.showcaseCopy}><p className={styles.eyebrow}>Jūsų darbas centre</p><h2>Svetainė turi kalbėti jūsų klientui, ne apie svetainių kūrimą.</h2><p>Vietoj bendrų pažadų išryškiname realias paslaugas, darbo vietovę, atrinktus pavyzdžius ir dažniausius klausimus. Turinį tikriname prieš skelbdami — išgalvotų atsiliepimų ar projektų nereikia.</p>{service && <a href={nichePagePath(service)}>Peržiūrėti paslaugos apimtį <span aria-hidden="true">↗</span></a>}</div>
      </section>

      <section className={styles.priceBand} aria-labelledby="price-title"><div><p className={styles.eyebrow}>Aiški pradžia</p><h2 id="price-title">Meistro svetainė <strong>nuo 490 €</strong></h2><p>Pradžios puslapis, iki keturių papildomų puslapių, mobilus dizainas, užklausos kelias ir SEO pagrindai. Tikslią apimtį suderiname pagal jūsų medžiagą.</p></div><a href="#kontaktai">Aptarti projektą ↗</a></section>

      <section id="procesas" className={styles.pilotSection}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Paprasta pradžia</p><h2>Trys žingsniai iki jūsų svetainės plano</h2></div>
        <div className={styles.stepsGrid}>
          <article><span>01</span><h3>Papasakojate apie darbus</h3><p>Parašote, kokias paslaugas teikiate, kur dirbate ir kokių užklausų norėtumėte. Jei turite nuotraukų, atrenkame tinkamas.</p></article>
          <article><span>02</span><h3>Sudedame struktūrą</h3><p>Parengiame pradžios puslapį, svarbiausius paslaugų aprašymus ir naudingus atsakymus į klientų klausimus.</p></article>
          <article><span>03</span><h3>Patikriname kelią</h3><p>Peržiūrime mobilų vaizdą, nuorodas, kontaktus, SEO pagrindus ir tai, ar užklausa iš tiesų pasiekia jus.</p></article>
        </div>
      </section>

      <section id="gidai" className={styles.guideSection}>
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Naudingi gidai</p><h2>Prieš kuriant verta žinoti</h2><p>Trumpi praktiniai atsakymai į klausimus, kurie padeda pasiruošti geresnei meistro svetainei.</p></div>
        <div className={styles.guideGrid}>{guides.map((guide, index) => <a href={nichePagePath(guide)} key={guide.id}><span>GIDAS / 0{index + 1}</span><h3>{guide.title}</h3><p>{guide.description}</p><strong>Skaityti gidą <span aria-hidden="true">↗</span></strong></a>)}</div>
        {faq && <p className={styles.faqLink}>Dar klausimų? <a href={nichePagePath(faq)}>Peržiūrėkite dažniausius atsakymus ↗</a></p>}
      </section>
      <Contact email={pkg.site.contact.email} phone={pkg.site.contact.phone} pages={livePages} greitos />
    </main>
    <Footer pkg={pkg} pages={livePages} />
  </div>;
}

function pageTypeLabel(page: NichePage): string {
  return ({ home: "Pradžia", service: "Paslauga", product: "Prekė", guide: "Gidas", faq: "Klausimai", location: "Vieta" } as const)[page.type];
}

export function GenericNicheSite({ pkg, page, livePages }: { pkg: NichePackage; page: NichePage; livePages: NichePage[] }) {
  const home = livePages.find((item) => item.type === "home");
  const navigation = livePages.filter((item) => item.type !== "home").slice(0, 5);
  const byId = new Map(livePages.map((item) => [item.id, item]));
  const hero = page.media.find((media) => !page.body.some((block) => block.type === "image" && block.assetId === media.id));
  const siteStyle = { "--niche-accent": pkg.site.brand.accent } as CSSProperties;


  if (pkg.siteId === "greitossvetaines" && page.type === "home") {
    return <GreitosHomepage pkg={pkg} page={page} livePages={livePages} hero={hero} siteStyle={siteStyle} />;
  }

  return (
    <div className={`${styles.shell} ${pkg.siteId === "greitossvetaines" ? styles.greitos : ""}`} style={siteStyle}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {pkg.siteId === "greitossvetaines"
            ? <a className={styles.brand} href="/"><span className={styles.brandSymbol} aria-hidden="true">g<span>.</span></span><span>greitos<span className={styles.brandAccent}>svetainės</span></span></a>
            : <a className={styles.brand} href="/">{pkg.site.name}</a>}
          <nav className={styles.nav} aria-label="Pagrindinė navigacija">
            {pkg.siteId === "greitossvetaines"
              ? <><a href="/">Pradžia</a><a href="/svetaine-apdailos-meistrui">Paslauga</a><a href="/#gidai">Gidai</a><a href="/duk">DUK</a></>
              : navigation.map((item) => <a href={nichePagePath(item)} key={item.id}>{item.title}</a>)}
          </nav>
          <a className={styles.headerContact} href="#kontaktai">Susisiekti</a>
        </div>
      </header>

      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: nicheJsonLd(pkg, page) }} />
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div>
              {page.type !== "home" && <nav className={styles.breadcrumbs} aria-label="Puslapio kelias">{nicheBreadcrumbs(pkg,page,livePages).map((item: {name:string;path:string},i:number,trail:{name:string;path:string}[]) => <span key={item.path}>{i > 0 && <span aria-hidden="true"> / </span>}{i === trail.length - 1 ? <span aria-current="page">{item.name}</span> : <a href={item.path}>{item.name}</a>}</span>)}</nav>}
              <p className={styles.eyebrow}>{pageTypeLabel(page)}</p>
              <h1>{page.title}</h1>
              <p className={styles.lead}>{page.description}</p>
              {page.type === "guide" && <ArticleMeta pkg={pkg} page={page} pages={livePages} />}
              <a className={styles.primaryAction} href="#kontaktai">Gauti atsakymą į užklausą <span aria-hidden="true">↗</span></a>
            </div>
            {hero && <img className={styles.heroImage} src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} fetchPriority="high" decoding="async" />}
          </div>
        </section>

        <div className={styles.contentGrid}>
          <article className={styles.article}>
            {page.body.map((block, index) => <Block block={block} media={page.media} page={page} livePages={livePages} key={`${block.type}-${index}`} />)}
            {Boolean(page.externalLinks?.length) && <section className={styles.externalSources} aria-labelledby="external-sources-title">
              <h2 id="external-sources-title">Šaltiniai ir papildoma informacija</h2>
              <ul>{page.externalLinks?.map((link) => <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>
                <p>{link.reason}</p>
              </li>)}</ul>
            </section>}
          </article>
          <aside className={styles.aside}>
            <h2>Šioje svetainėje</h2>
            <p>{pkg.site.offer}</p>
            {home && page.id !== home.id && <a href="/">Grįžti į pradžią <span aria-hidden="true">↗</span></a>}
          </aside>
        </div>

        {page.links.length > 0 && <section className={styles.related} aria-labelledby="related-title">
          <h2 id="related-title">Toliau gali būti naudinga</h2>
          <div className={styles.relatedLinks}>{page.links.map((link) => {
            const target = byId.get(link.targetPageId);
            return target
              ? <a href={nichePagePath(target)} key={`${link.targetPageId}-${link.label}`}>{link.label} <span aria-hidden="true">↗</span></a>
              : <span key={`${link.targetPageId}-${link.label}`}>{link.label}</span>;
          })}</div>
        </section>}
        <Contact email={pkg.site.contact.email} phone={pkg.site.contact.phone} pages={livePages} greitos={pkg.siteId === "greitossvetaines"} />
      </main>

      <Footer pkg={pkg} pages={livePages} />
    </div>
  );
}
