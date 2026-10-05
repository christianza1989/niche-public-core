import type { Metadata } from "next";
import type { ContentPackageV2, ProjectedContentPageV2 } from "./content-model-v2";
import { giftAuthorPage, giftFeaturedImage, giftArticles } from "./gift-content";

export function giftMetadata(pkg: ContentPackageV2, page: ProjectedContentPageV2, filtered = false): Metadata {
  const image = giftFeaturedImage(page);
  return {
    title: page.title, description: page.description, alternates: { canonical: page.url },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: page.title, description: page.description, url: page.url, locale: pkg.locale.replace("-", "_"), type: page.type === "article" ? "article" : "website",
      ...(image ? { images: [{ url: new URL(image.src, page.url).href, width: image.width, height: image.height, alt: image.alt }] } : {}),
      ...(page.type === "article" && page.editorial.datePublished ? { publishedTime: page.editorial.datePublished } : {}),
      ...(page.type === "article" && page.editorial.dateModified ? { modifiedTime: page.editorial.dateModified } : {}),
    },
  };
}

export function giftSchemas(pkg: ContentPackageV2, page: ProjectedContentPageV2, livePages: ProjectedContentPageV2[]) {
  const origin = `https://${pkg.canonicalHost}`;
  const organization = { "@type": "Organization", "@id": `${origin}/#publisher`, name: pkg.site.name, url: origin };
  const base = { "@context": "https://schema.org", name: page.title, description: page.description, url: page.url, inLanguage: pkg.locale };
  if (page.type === "home") return [{ ...organization, "@context": "https://schema.org" }, { ...base, "@type": "WebSite", "@id": `${origin}/#website`, publisher: organization }];
  if (page.type === "article") {
    const image = giftFeaturedImage(page);
    const article = { ...base, "@type": "Article", headline: page.title, articleSection: page.editorial.category, mainEntityOfPage: page.url, publisher: organization,
      // Scheduling is not evidence of historical publication or a meaningful update.
      ...(page.editorial.datePublished ? { datePublished: page.editorial.datePublished } : {}),
      ...(page.editorial.dateModified ? { dateModified: page.editorial.dateModified } : {}),
      author: page.editorial.authors.map(author => {
        const profile = giftAuthorPage(author, livePages);
        return { "@type": author.kind === "organization" ? "Organization" : "Person", name: author.name, ...(profile ? { url: profile.url } : {}), ...(author.sameAs.length ? { sameAs: author.sameAs } : {}) };
      }), ...(image ? { image: [new URL(image.src, origin).href] } : {}),
      ...(page.editorial.sources.length ? { citation: page.editorial.sources.map(source => source.url) } : {}),
    };
    const crumbs = [{ name: "Pradžia", item: origin + "/" }, ...(livePages.some(p => p.slug === "straipsniai") ? [{ name: "Dovanų gidai", item: origin + "/straipsniai" }] : []), { name: page.title, item: page.url }];
    return [article, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, i) => ({ "@type": "ListItem", position: i + 1, ...crumb })) }];
  }
  if (page.type === "index" && page.slug === "straipsniai") return [{ ...base, "@type": "CollectionPage", mainEntity: { "@type": "ItemList", itemListElement: giftArticles(livePages).map((article, i) => ({ "@type": "ListItem", position: i + 1, name: article.title, url: article.url })) } }];
  // Organization editorial profile is not a fabricated Person/ProfilePage expert.
  return [{ ...base, "@type": page.type === "contact" ? "ContactPage" : page.type === "about" ? "AboutPage" : "WebPage" }];
}

export const giftJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
