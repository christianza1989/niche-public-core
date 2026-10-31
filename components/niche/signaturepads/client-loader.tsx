"use client";
import { useEffect } from 'react';
import clientUrl from './client.js?url';

// Vite emits the canonical standalone controller; the migration preview and
// native Core renderer use the same file and browser behavior.
export function SignaturepadsClient() {
  useEffect(()=>{
    const script=document.createElement('script');script.src=clientUrl;script.async=true;
    document.body.appendChild(script);
    return ()=>{script.remove();};
  },[]);
  return null;
}
