import type { Metadata } from "next";
import type { ContentPackageV2, ProjectedContentPageV2 } from "./content-model-v2";
import { contentAuthorPage, contentFeaturedImage, contentArticles } from "./content-presentation";

export function contentMetadata(pkg: ContentPackageV2, page: ProjectedContentPageV2, filtered = false, articleTypes: string[] = ["article"]): Metadata {
  const image = contentFeaturedImage(page);
  return {
    title: page.title, description: page.description, alternates: { canonical: page.url },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: page.title, description: page.description, url: page.url, locale: pkg.locale.replace("-", "_"), type: articleTypes.includes(page.type) ? "article" : "website",
      ...(image ? { images: [{ url: new URL(image.src, page.url).href, width: image.width, height: image.height, alt: image.alt }] } : {}),
      ...(articleTypes.includes(page.type) && page.editorial.datePublished ? { publishedTime: page.editorial.datePublished } : {}),
      ...(articleTypes.includes(page.type) && page.editorial.dateModified ? { modifiedTime: page.editorial.dateModified } : {}),
    },
  };
}

export function contentSchemas(pkg: ContentPackageV2, page: ProjectedContentPageV2, livePages: ProjectedContentPageV2[],
  navigation: { homeLabel?: string; articleIndexSlug?: string; articleIndexLabel?: string; articleTypes?: string[]; authorProfileAnySlug?: boolean } = {}) {
  const origin = `https://${pkg.canonicalHost}`;
  const indexSlug = navigation.articleIndexSlug ?? "straipsniai";
  const indexLabel = navigation.articleIndexLabel ?? "Dovanų gidai";
  const organization = { "@type": "Organization", "@id": `${origin}/#publisher`, name: pkg.site.name, url: origin };
  const base = { "@context": "https://schema.org", name: page.title, description: page.description, url: page.url, inLanguage: pkg.locale };
  if (page.type === "home") return [{ ...organization, "@context": "https://schema.org" }, { ...base, "@type": "WebSite", "@id": `${origin}/#website`, publisher: organization }];
  if ((navigation.articleTypes ?? ["article"]).includes(page.type)) {
    const image = contentFeaturedImage(page);
    const article = { ...base, "@type": "Article", headline: page.title, articleSection: page.editorial.category, mainEntityOfPage: page.url, publisher: organization,
      // Scheduling is not evidence of historical publication or a meaningful update.
      ...(page.editorial.datePublished ? { datePublished: page.editorial.datePublished } : {}),
      ...(page.editorial.dateModified ? { dateModified: page.editorial.dateModified } : {}),
      author: page.editorial.authors.map(author => {
        const profile = contentAuthorPage(author, livePages, navigation.authorProfileAnySlug);
        return { "@type": author.kind === "organization" ? "Organization" : "Person", name: author.name, ...(profile ? { url: profile.url } : {}), ...(author.sameAs.length ? { sameAs: author.sameAs } : {}) };
      }), ...(image ? { image: [new URL(image.src, origin).href] } : {}),
      ...(page.editorial.sources.length ? { citation: page.editorial.sources.map(source => source.url) } : {}),
    };
    const crumbs = [{ name: navigation.homeLabel ?? "Pradžia", item: origin + "/" }, ...(livePages.some(p => p.type === "index" && p.slug === indexSlug) ? [{ name: indexLabel, item: origin + "/" + indexSlug }] : []), { name: page.title, item: page.url }];
    return [article, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, i) => ({ "@type": "ListItem", position: i + 1, ...crumb })) }];
  }
  if (page.type === "index" && page.slug === indexSlug) return [{ ...base, "@type": "CollectionPage", mainEntity: { "@type": "ItemList", itemListElement: contentArticles(livePages, navigation.articleTypes).map((article, i) => ({ "@type": "ListItem", position: i + 1, name: article.title, url: article.url })) } }];
  // Organization editorial profile is not a fabricated Person/ProfilePage expert.
  return [{ ...base, "@type": page.type === "contact" ? "ContactPage" : page.type === "about" ? "AboutPage" : "WebPage" }];
}

export const contentJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
