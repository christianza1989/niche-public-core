import type { NichePackage, NichePage } from "@/lib/niche-sites";
import { nicheNetworkContact } from "@/lib/niche-network";
import { nicheEditorialDates } from "@/lib/niche-schema-core.mjs";

export function ArticleMeta({ pkg, page, pages, className }: { pkg: NichePackage; page: NichePage; pages: NichePage[]; className?: string }) {
  const dates = nicheEditorialDates(page);
  const format = (date: string) => new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium", timeZone: pkg.site.timezone }).format(new Date(date));
  const author = nicheNetworkContact(pkg.siteId).operatorName;
  return <div className={className}>
    <p>Parengė {pages.some(p => p.slug === "redakcija") ? <a href="/redakcija" rel="author">{author}</a> : author} · Informacinis turinys, rengiamas su AI pagal nurodytus šaltinius.</p>
    <p>Publikavimo data <time dateTime={dates.published}>{format(dates.published)}</time> · Turinys peržiūrėtas <time dateTime={dates.modified}>{format(dates.modified)}</time></p>
  </div>;
}
