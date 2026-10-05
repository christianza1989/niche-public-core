import { Fragment } from "react";
import type { NichePage } from "@/lib/niche-sites";
import { nichePagePath } from "@/lib/niche-sites";
import { contextualParts } from "@/lib/niche-links.mjs";
export function LinkedText({ text, page, livePages }: { text: string; page: NichePage; livePages: NichePage[] }) {
  const links = [
    ...page.links.flatMap(link => { const target = livePages.find(item => item.id === link.targetPageId); return target ? [{ label: link.label, href: nichePagePath(target) }] : []; }),
    ...(page.externalLinks || []).map(link => ({ label: link.label, href: link.url })),
  ];
  return contextualParts(text, links).map((part: { text: string; href?: string }, index: number) => part.href
    ? <a key={index} href={part.href}>{part.text}</a> : <Fragment key={index}>{part.text}</Fragment>);
}
