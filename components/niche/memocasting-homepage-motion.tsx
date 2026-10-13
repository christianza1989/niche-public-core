'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {mountMemoHomepage} from '@/lib/memocasting-homepage-motion.mjs';

// The narrative HTML is server-rendered trusted markup. React owns the wrapper
// and native footer, while the effect owns only the narrative's visual spans.
export function MemoHomepageMotion({children}:{children:ReactNode}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>root.current?mountMemoHomepage(root.current):undefined,[]);
 return <div ref={root} className="memo-homepage" data-memo-homepage>{children}</div>;
}
