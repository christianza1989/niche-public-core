import { headers } from "next/headers";
import { authorsForArticleFromStore, publishedArticlesFromStore, sourcesForArticleFromStore } from "@/lib/content-store";
import { resolveSite, siteOrigin } from "@/lib/site-config";

export async function GET() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const site = resolveSite(host);
  const origin = siteOrigin(site, host);
  const articles = await publishedArticlesFromStore(site);
  const sections = await Promise.all(articles.map(async (article) => {
    const authors = await authorsForArticleFromStore(site, article);
    const sources = sourcesForArticleFromStore(article);
    return [
      `## ${article.title}`,
      `Canonical: ${origin}/straipsniai/${article.slug}`,
      `Category: ${article.category}`,
      `Author: ${authors.map((author) => author.name).join(", ") || "Nenurodyta"}`,
      "",
      article.body.join("\n\n"),
      sources.length > 0 ? `\nSources: ${sources.map((source) => `${source.title} (${source.url})`).join("; ")}` : "",
    ].join("\n");
  }));
  const body = [
    `# ${site.name} — full live content`,
    `> ${site.description}`,
    "",
    "This file contains only canonical pages that are currently published.",
    "",
    ...sections,
  ].join("\n\n");

  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}
