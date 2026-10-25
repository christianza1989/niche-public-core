import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {memoAnalyticsConfig} from '@/lib/memocasting-analytics.mjs';
import {MemoAnalyticsConsent} from './memocasting-analytics-consent';

// The caller supplies only the already eligible native page, never request URLs,
// titles from checkout state, customer data or an unfiltered draft inventory.
export async function MemoAnalytics({siteId,path,title,language,functional,privacyPath}:{siteId:string;path:string;title:string;language:string;functional:boolean;privacyPath?:string}){
 const host=(await headers()).get('host')?.toLowerCase()||'';
 const values=env as Record<string,unknown>;
 const config=memoAnalyticsConfig(values,{siteId,host,path,title,language,functional});
 // Also cover the HTTP Referer of the tag's subsequent requests, not only the
 // GA page_referrer parameter. React hoists this metadata before hydration.
 return config?<><meta name="referrer" content="no-referrer"/><MemoAnalyticsConsent config={config} privacyPath={privacyPath}/></>:null;
}
