import { headers } from "next/headers";
import { publishedArticlesFromStore } from "@/lib/content-store";
import { resolveSite, siteOrigin } from "@/lib/site-config";

export async function GET() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const site = resolveSite(host);
  const origin = siteOrigin(site, host);
  const articles = await publishedArticlesFromStore(site);
  const body = [
    `# ${site.name}`,
    `> ${site.description}`,
    "",
    "## Pagrindiniai puslapiai",
    `- [Pagrindinis puslapis](${origin}/): ${site.description}`,
    `- [Apie projektą](${origin}/apie): Kaip atrenkamos ir tikrinamos dovanų idėjos.`,
    `- [Pilnas gyvas turinys](${origin}/llms-full.txt): Tik šiuo metu publikuojamų straipsnių tekstas.`,
    "",
    "## Gyvi straipsniai",
    ...articles.map(
      (article) => `- [${article.title}](${origin}/straipsniai/${article.slug}): ${article.excerpt}`,
    ),
    "",
    "## Turinio taisyklės",
    "- Publikuojami tik patikrinti, žmonėms naudingi straipsniai.",
    "- Produktų kainos ir prieinamumas gali keistis; tikrinkite prekybininko puslapyje.",
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}
