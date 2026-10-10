import type { CSSProperties } from 'react';
import type { ContentPackageV2, ProjectedContentPageV2 } from '@/lib/content-model-v2';
import { RichContent, ContentImage } from '@/components/content/rich-content';
import { contentPath, contentFeaturedImage, contentAuthorPage, contentDate, contentArticles } from '@/lib/content-presentation';
import { contentSchemas, contentJsonLd } from '@/lib/content-page-seo';
import styles from './native-content-site.module.css';

type Props = { pkg: ContentPackageV2; page: ProjectedContentPageV2; livePages: ProjectedContentPageV2[] };
const editorialTypes = ['article', 'guide'];

export function NativeContentSite({ pkg, page, livePages }: Props) {
  // This component never resolves raw links, publication dates or private drafts.
  if (pkg.site.renderer !== 'niche' || page.siteId !== pkg.siteId || !livePages.some(item => item.id === page.id)) return null;
  const site = page.siteSnapshot;
  const home = livePages.find(item => item.type === 'home' && item.slug === '');
  const index = livePages.find(item => item.type === 'index' && page.slug.startsWith(item.slug + '/')) ?? livePages.find(item => item.type === 'index');
  const navigation = livePages.filter(item => ['index', 'service', 'about', 'contact'].includes(item.type)).slice(0, 6);
  const information = livePages.filter(item => ['policy', 'about', 'contact', 'author'].includes(item.type));
  const image = contentFeaturedImage(page);
  const relatedIds = [...new Set([...page.links.map(link => link.targetPageId), ...page.editorial.relatedPageIds])];
  const related = relatedIds.flatMap(id => livePages.find(item => item.id === id && item.id !== page.id) ?? []);
  const guides = contentArticles(livePages, editorialTypes);
  const accent = /^#[a-f\d]{6}$/i.test(site.brand.accent) ? site.brand.accent : '#31554a';
  const date = (label: string, value: string | null) => value && <span>{label} <time dateTime={value}>{contentDate(value, pkg.locale, site.timezone)}</time></span>;
  return <div className={styles.site} style={{ '--accent': accent } as CSSProperties}>
    <a className={styles.skip} href="#main-content">Pereiti prie turinio</a>
    <header className={styles.header}><a className={styles.brand} href={home ? contentPath(home) : '/'}>{site.name}</a><nav aria-label="Pagrindinė navigacija">{navigation.map(item => <a key={item.id} href={contentPath(item)} aria-current={item.id === page.id ? 'page' : undefined}>{item.title}</a>)}</nav></header>
    <main id="main-content" tabIndex={-1} className={styles.main}>
      {page.type !== 'home' && <nav className={styles.breadcrumbs} aria-label="Puslapio vieta">{home && <a href={contentPath(home)}>Pradžia</a>}{index && editorialTypes.includes(page.type) && <a href={contentPath(index)}>{index.title}</a>}<span aria-current="page">{page.title}</span></nav>}
      <article><h1>{page.title}</h1><p className={styles.lead}>{page.description}</p>
        {editorialTypes.includes(page.type) && <div className={styles.meta}>{page.editorial.authors.map(author => { const profile = contentAuthorPage(author, livePages, true); return profile ? <a key={author.id} href={contentPath(profile)}>{author.name}</a> : <span key={author.id}>{author.name}</span>; })}{date('Paskelbta', page.editorial.datePublished)}{date('Atnaujinta', page.editorial.dateModified)}</div>}
        {image && <figure className={styles.hero}><ContentImage asset={image} media={page.media} priority sizes="(max-width: 760px) calc(100vw - 40px), 900px" />{image.credit && <figcaption>{image.credit}</figcaption>}</figure>}
        <div className={styles.copy}><RichContent body={page.body.filter(block => block.type !== 'image' || block.assetId !== image?.id)} media={page.media} /></div>
        {page.type === 'contact' && site.contact.email && <p className={styles.contact}>El. paštas: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></p>}
        {page.editorial.authors.length > 0 && page.type === 'author' && page.editorial.authors.map(author => <section key={author.id}><h2>{author.name}</h2><p>{author.role}</p><p>{author.bio}</p></section>)}
        {page.editorial.sources.length > 0 && <section className={styles.sources}><h2>Šaltiniai</h2><ul>{page.editorial.sources.map(source => <li key={source.id}><a href={source.url} rel="noopener noreferrer">{source.title}</a> — {source.publisher}; peržiūrėta <time dateTime={source.accessedAt}>{contentDate(source.accessedAt, pkg.locale, site.timezone)}</time>.</li>)}</ul></section>}
        {page.editorial.productRecommendation && page.editorial.commerceTargets.map(target => <aside className={styles.recommendation} key={target.id}><h2>{target.label}</h2><p>{target.relationship}</p><a href={target.url} rel="noopener noreferrer">Peržiūrėti informaciją</a></aside>)}
      </article>
      {['home', 'index'].includes(page.type) && guides.length > 0 && <section className={styles.guides} aria-label="Gidai">{page.type === 'home' && <h2>Gidai</h2>}<div className={styles.grid}>{guides.map(guide => { const thumbnail = contentFeaturedImage(guide); return <article key={guide.id} className={styles.card}>{thumbnail && <ContentImage asset={thumbnail} media={guide.media} sizes="(max-width: 760px) calc(100vw - 40px), 440px" />}<h2><a href={contentPath(guide)}>{guide.title}</a></h2><p>{guide.description}</p></article>; })}</div></section>}
      {related.length > 0 && <section className={styles.related}><h2>Skaitykite toliau</h2><ul>{related.map(item => <li key={item.id}><a href={contentPath(item)}>{item.title}</a></li>)}</ul></section>}
    </main>
    <footer className={styles.footer}><p>{site.operatorName}</p><nav aria-label="Svetainės informacija">{information.map(item => <a key={item.id} href={contentPath(item)}>{item.title}</a>)}</nav><p>Mūsų verslas automatizuotas su verslomatika.lt</p></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: contentJsonLd(contentSchemas(pkg, page, livePages, { articleIndexSlug: index?.slug ?? '', articleIndexLabel: index?.title ?? '', articleTypes: editorialTypes, authorProfileAnySlug: true })) }} />
  </div>;
}
