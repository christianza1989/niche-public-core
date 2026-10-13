'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {mountMemoHomepage} from '@/lib/memocasting-homepage-motion.mjs';
import {mountHomepageCatalogue} from '@/lib/memocasting-homepage-catalogue.mjs';
import {memoCommerceClient} from './memocasting-native-checkout';

// The narrative HTML is server-rendered trusted markup. React owns the wrapper
// and native footer, while the effect owns only the narrative's visual spans.
export function MemoHomepageMotion({children}:{children:ReactNode}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!root.current)return;const motion=mountMemoHomepage(root.current),catalogue=mountHomepageCatalogue(root.current,memoCommerceClient());return()=>{catalogue();motion();};},[]);
 return <div ref={root} className="memo-homepage" data-memo-homepage>{children}</div>;
}
