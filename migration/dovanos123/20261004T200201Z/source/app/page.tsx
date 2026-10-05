import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { publishedArticlesFromStore } from "@/lib/content-store";
import { getHomeCategories } from "@/lib/homepage-data";
import { getCopy } from "@/lib/i18n";
import { localeAlternates, resolveSite, siteOrigin } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const origin = siteOrigin(site, host);
  return {
    title: site.name,
    description: site.description,
    alternates: { canonical: origin, languages: localeAlternates(site, origin) },
    openGraph: { title: site.name, description: site.description, url: origin, type: "website", images: [{ url: `${origin}/images/home/hand-casting-together.webp`, width: 1536, height: 1024, alt: "Pora kartu kuria rankų liejinį namuose" }] },
  };
}

export default async function Home() {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const articles = await publishedArticlesFromStore(site);
  const isPolish = site.defaultLocale === "pl-PL";
  const featured = articles.find((article) => article.id === (isPolish ? "pl-gift-for-couple" : "lt-hand-casting-guide")) ?? articles[0];
  const christmasHub = articles.find((article) => article.id === "lt-christmas-hub-2026");
  const christmasCouple = articles.find((article) => article.id === "lt-christmas-couple");
  const christmasMan = articles.find((article) => article.id === "lt-christmas-man");
  const seasonalArticles = [christmasHub, christmasCouple, christmasMan, ...articles.filter((article) => article.id.startsWith("lt-christmas-") && !["lt-christmas-hub-2026", "lt-christmas-couple", "lt-christmas-man"].includes(article.id))].filter((article) => article !== undefined).slice(0, 6);
  const quickArticles = isPolish ? articles.slice(0, 1) : [christmasHub, christmasMan, featured].filter((article) => article !== undefined);
  const latest = articles
    .filter((article) => article.id !== featured?.id && !seasonalArticles.some((seasonal) => seasonal.id === article.id))
    .sort((a, b) => Date.parse(b.publishAt) - Date.parse(a.publishAt))
    .slice(0, 3);
  const origin = siteOrigin(site, host);
  const copy = getCopy(site.defaultLocale);
  const categories = getHomeCategories(site.defaultLocale);
  const liveArticleIds = new Set(articles.map((article) => article.id));
  const availableCategories = categories.filter((category) => category.articleIds.some((id) => liveArticleIds.has(id)));
  const unavailableCategories = categories.filter((category) => !category.articleIds.some((id) => liveArticleIds.has(id)));
  const siteSchema = [
    { "@context": "https://schema.org", "@type": "Organization", name: site.name, url: origin },
    { "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: origin, inLanguage: site.defaultLocale },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: site.defaultLocale === "pl-PL" ? "Kategorie prezentowe" : "Dovanų kategorijos",
      itemListElement: availableCategories.map((category, index) => ({ "@type": "ListItem", position: index + 1, name: category.label, url: `${origin}/straipsniai?tema=${category.slug}` })),
    },
  ];

  return (
    <main className="site-shell home-page">
      <header className="site-header home-header">
        <div className="container header-inner">
          <Link href="/" className="brand-mark" aria-label={`${site.name} pagrindinis puslapis`}>
            <span className="brand-dot" aria-hidden="true" />
            <span>{site.name}</span>
          </Link>
          <nav className="main-nav" aria-label="Pagrindinė navigacija">
            <Link href="/straipsniai">{copy.navGuides}</Link>
            <Link href="#kategorijos">{copy.navCategories}</Link>
            {seasonalArticles.length > 0 && <Link href="#kaledos">Kalėdos</Link>}
            <Link href="/apie">{copy.navAbout}</Link>
          </nav>
          <a
            className="header-cta"
            href={`${site.productUrl}?utm_source=${site.id}&utm_medium=content&utm_campaign=header`}
          >
            {copy.headerCta} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-kicker">{isPolish ? "Poradniki prezentowe" : "Dovanų gidai su prasme"}</p>
            <h1 id="home-title">{isPolish ? "Pomysł na prezent zaczyna się od osoby." : "Gera dovana prasideda nuo žmogaus."}</h1>
            <p>{isPolish ? "Wybierz okazję, poznaj praktyczne kryteria i znajdź upominek, który naprawdę pasuje." : "Raskite idėją pagal progą, pomėgius ir jūsų ryšį. Aiškūs gidai padės išsirinkti tai, kuo žmogus iš tikrųjų džiaugsis."}</p>
            <div className="home-hero-actions">
              {seasonalArticles.length > 0 && <Link className="button button-primary" href="/straipsniai?tema=kaledoms">Kalėdinės dovanos <span aria-hidden="true">↗</span></Link>}
              <Link className={seasonalArticles.length > 0 ? "home-inline-link" : "button button-primary"} href="#kategorijos">{isPolish ? "Przeglądaj kategorie" : "Rinktis pagal kategoriją"} <span aria-hidden="true">↓</span></Link>
            </div>
            <p className="home-hero-note">{isPolish ? "Według osoby · okazji · pomysłu" : "Pagal žmogų · progą · biudžetą"}</p>
          </div>
          <figure className="home-hero-media"><img src="/images/home/hand-casting-together.webp" alt={isPolish ? "Para tworzy razem odlew dłoni przy stole" : "Pora kartu kuria rankų liejinį prie namų stalo"} width={1536} height={1024} fetchPriority="high" decoding="async" /><figcaption>{isPolish ? "Wspólny czas bywa najcenniejszym prezentem." : "Dovanos vertė kartais slypi bendrame laike."}</figcaption></figure>
        </div>
      </section>

      {quickArticles.length > 0 && <section className="container home-quick" aria-labelledby="quick-heading"><div className="home-section-heading compact"><div><p className="home-kicker">{isPolish ? "Na początek" : "Greita pradžia"}</p><h2 id="quick-heading">{isPolish ? "Zacznij od konkretnego poradnika" : "Nuo ko pradėti?"}</h2></div></div><div className="home-quick-grid">{quickArticles.map((article, index) => <Link className="home-quick-card" href={`/straipsniai/${article.slug}`} key={article.id}><span className="home-quick-index">0{index + 1}</span><span className="home-quick-title">{article.title}</span><span className="home-quick-arrow" aria-hidden="true">↗</span></Link>)}</div></section>}

      <section id="kategorijos" className="container home-categories" aria-labelledby="categories-heading"><div className="home-section-heading"><div><p className="home-kicker">{isPolish ? "Według osoby i okazji" : "Pagal žmogų ir progą"}</p><h2 id="categories-heading">{isPolish ? "Wybierz kierunek" : "Ieškokite savo krypties"}</h2></div><p>{isPolish ? "Najpierw zdecyduj, komu i z jakiej okazji wręczasz prezent." : "Kai žinote, kam dovanojate, tinkamą idėją rasti paprasčiau."}</p></div><div className="home-category-grid">{availableCategories.map((category, index) => <Link className={`home-category-card home-category-${category.tone}`} href={`/straipsniai?tema=${category.slug}`} key={category.slug}><span className="home-category-index">{String(index + 1).padStart(2, "0")}</span><span className="home-category-title">{category.label}</span><span className="home-category-desc">{category.description}</span><span className="home-category-arrow" aria-hidden="true">↗</span></Link>)}</div>{unavailableCategories.length > 0 && <div className="home-coming-topics"><span>{isPolish ? "W przygotowaniu" : "Dar ruošiame gidus"}</span><p>{unavailableCategories.map((category) => category.label).join(" · ")}</p></div>}</section>

      {seasonalArticles.length > 0 && <section id="kaledos" className="home-seasonal" aria-labelledby="seasonal-heading"><div className="container home-seasonal-grid"><div className="home-seasonal-media"><img src="/images/articles/christmas-gift-guide.webp" alt="Supakuota kalėdinė dovana jaukiame žiemos interjere" width={1536} height={1024} loading="lazy" decoding="async" /></div><div className="home-seasonal-copy"><p className="home-kicker">Šių metų šventėms</p><h2 id="seasonal-heading">Kalėdoms rinkitės ramiai, kol dar yra laiko.</h2><p>Pradėkite nuo žmogaus ir jo pomėgių. Mūsų gidai padeda palyginti patirtis, asmeniškas dovanas ir praktiškus pasirinkimus.</p><div className="home-seasonal-links">{seasonalArticles.map((article) => <Link href={`/straipsniai/${article.slug}`} key={article.id}>{article.title}<span aria-hidden="true">↗</span></Link>)}</div></div></div></section>}

      {featured && <section className="container home-feature" aria-labelledby="featured-heading"><div className="home-section-heading"><div><p className="home-kicker">{copy.featuredKicker}</p><h2 id="featured-heading">{isPolish ? "Warto przeczytać" : "Gidas, nuo kurio verta pradėti"}</h2></div><Link className="home-inline-link" href="/straipsniai">{copy.allArticles} <span aria-hidden="true">↗</span></Link></div><article className="home-feature-card"><div className="home-feature-media"><img src={featured.featuredImage?.src ?? "/images/articles/hand-casting-memory.webp"} alt={featured.featuredImage?.alt ?? "Rankų liejinio skulptūra"} width={featured.featuredImage?.width ?? 1536} height={featured.featuredImage?.height ?? 1024} loading="lazy" decoding="async" /></div><div className="home-feature-copy"><p className="home-kicker">{featured.category} · {featured.readingMinutes} min.</p><h3><Link href={`/straipsniai/${featured.slug}`}>{featured.title}</Link></h3><p>{featured.excerpt}</p><Link className="button button-dark" href={`/straipsniai/${featured.slug}`}>{copy.readGuide} <span aria-hidden="true">↗</span></Link></div></article></section>}

      {latest.length > 0 && <section className="container home-latest" aria-labelledby="latest-heading"><div className="home-section-heading"><div><p className="home-kicker">{copy.editorialSelection}</p><h2 id="latest-heading">{isPolish ? "Więcej pomysłów do odkrycia" : "Daugiau idėjų, kurias verta apsvarstyti"}</h2></div><Link className="home-inline-link" href="/straipsniai">{copy.allArticles} <span aria-hidden="true">↗</span></Link></div><div className="home-latest-grid">{latest.map((article) => <article className="home-latest-card" key={article.id}><div className="home-latest-image"><img src={article.featuredImage?.src ?? "/images/home/thoughtful-gift.webp"} alt={article.featuredImage?.alt ?? (isPolish ? "Starannie zapakowany prezent" : "Apgalvota dovanos idėja")} width={1536} height={1024} loading="lazy" decoding="async" /></div><div className="home-latest-body"><p className="home-kicker">{article.category} · {article.readingMinutes} min.</p><h3><Link href={`/straipsniai/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link className="home-inline-link" href={`/straipsniai/${article.slug}`}>{copy.readMore} <span aria-hidden="true">↗</span></Link></div></article>)}</div></section>}

      <section className="home-editorial" aria-labelledby="editorial-heading"><div className="container home-editorial-grid"><div className="home-editorial-copy"><p className="home-kicker">{isPolish ? "Jak wybieramy" : "Kaip atrenkame"}</p><h2 id="editorial-heading">{copy.editorialHeading}</h2><p>{copy.editorialLead}</p><ul><li>{isPolish ? "Dopasowanie do osoby, okazji i budżetu" : "Tinkamumas žmogui, progai ir biudžetui"}</li><li>{isPolish ? "Zalety i ograniczenia pomysłu" : "Idėjos privalumai ir ribos"}</li><li>{isPolish ? "Jasno opisane powiązania komercyjne" : "Aiškiai nurodyti komerciniai ryšiai"}</li></ul><Link className="home-inline-link" href="/redakcine-politika">{copy.editorialPolicyLink} <span aria-hidden="true">↗</span></Link></div><div className="home-editorial-media"><img src="/images/home/thoughtful-gift.webp" alt={isPolish ? "Starannie wybrany i zapakowany prezent" : "Apgalvotai supakuota dovana su atviruku"} width={1536} height={1024} loading="lazy" decoding="async" /></div></div></section>

      <section className="container home-product" aria-labelledby="recommendation-heading"><div className="home-product-grid"><div className="home-product-media"><img src="/images/articles/hand-casting-memory.webp" alt={isPolish ? "Biała rzeźba odlewu dłoni" : "Baltas rankų liejinys – bendro momento prisiminimas"} width={1536} height={1024} loading="lazy" decoding="async" /></div><div className="home-product-copy"><p className="home-kicker">{isPolish ? "Pomysł na wspólny czas" : "Idėja bendram laikui"}</p><h2 id="recommendation-heading">{site.productName}</h2><p>{copy.productLine}</p><p className="home-product-detail">{isPolish ? "Sprawdź, czy kreatywny zestaw pasuje osobie, która lubi wspólne zajęcia i własnoręczne pamiątki." : "Tinka porai ar šeimai, kuri mėgsta kūrybišką laiką kartu. Prieš dovanojant verta įvertinti, ar žmogui patiks rankdarbių procesas."}</p><a className="button button-primary" href={`${site.productUrl}?utm_source=${site.id}&utm_medium=content&utm_campaign=homepage`}>{copy.viewProduct} <span aria-hidden="true">↗</span></a><p className="home-product-disclosure">{isPolish ? "To nasz produkt. Link prowadzi do sklepu Memory Casting." : "Tai mūsų produktas. Nuoroda veda į „Memory Casting“ parduotuvę."} <Link href="/partneriu-nuorodu-atskleidimas">{isPolish ? "Więcej o powiązaniach" : "Daugiau apie komercinius ryšius"}</Link></p></div></div></section>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden="true" />{site.name}</Link>
            <p className="footer-note">{copy.homeFooter}</p>
          </div>
          <div className="footer-links">
            <Link href="/apie">{isPolish ? "O projekcie" : "Apie projektą"}</Link>
            <Link href="/autoriai">{isPolish ? "Autorzy" : "Autoriai"}</Link>
            <Link href="/redakcine-politika">{isPolish ? "Polityka redakcyjna" : "Redakcinė politika"}</Link>
            <Link href="/kontaktai">{isPolish ? "Kontakt" : "Kontaktai"}</Link>
            <Link href="/privatumas">{isPolish ? "Prywatność" : "Privatumas"}</Link>
            <Link href="/slapukai">{isPolish ? "Pliki cookie" : "Slapukai"}</Link>
            <Link href="/partneriu-nuorodu-atskleidimas">{isPolish ? "Linki partnerskie" : "Partnerių nuorodos"}</Link>
          </div>
        </div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
    </main>
  );
}
