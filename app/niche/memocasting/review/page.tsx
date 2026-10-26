/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages -- Existing brand asset and native host-rewritten routes. */
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {nicheSiteByHost,publicNichePages} from '@/lib/niche-sites';
import {memoCompany} from '@/lib/memocasting-structure.mjs';
import {memoFooterGroups} from '@/lib/memocasting-footer.mjs';
import {memoLogoImage} from '@/lib/memocasting-homepage-images.mjs';
import {MemoHomepageFooter} from '@/components/niche/memocasting-homepage-footer';
import {MemoReviewForm} from '@/components/niche/memocasting-review-form';
import '@/components/niche/memocasting-reviews.css';
import s from '@/components/niche/memocasting-site.module.css';
export const dynamic='force-dynamic';
export default async function ReviewPage(){const pkg=nicheSiteByHost((await headers()).get('host'));if(pkg?.siteId!=='memocasting')notFound();const pages=publicNichePages(pkg),home=pages.find(p=>p.slug==='');if(!home)notFound();return <div className={s.site}><a className={s.skip} href="#turinys">Pereiti prie turinio</a><header className={s.header}><a href="/" className={s.logo}><img src={memoLogoImage.src} srcSet={memoLogoImage.srcSet} sizes="200px" width="1000" height="300" alt="Memory Casting"/></a><nav aria-label="Parduotuvė"><a href="/ranku-liejimo-rinkiniai">Rinkiniai</a></nav></header><main id="turinys" className={s.main}><MemoReviewForm/></main><MemoHomepageFooter company={memoCompany(pkg,pages)} groups={memoFooterGroups(home,pages)} languages={[]} languageLabel="Svetainės kalba" automation="Mūsų verslas automatizuotas su" language="lt"/></div>;}
