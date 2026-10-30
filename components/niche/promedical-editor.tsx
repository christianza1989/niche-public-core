"use client";
import { useEffect } from "react";

// No session or private draft is serialized into the public RSC response.
export function PromedicalEditor({ id, revision, kind }: { id: string; revision: string; kind: string }) {
  useEffect(() => {
    const mount = () => document.dispatchEvent(new Event('promedical:editor-mount'));
    let script = document.querySelector<HTMLScriptElement>('script[data-promedical-inline]');
    if (!script) {
      script = document.createElement('script');script.type='module';script.src='/brand/promedical/admin/inline.js';script.dataset.promedicalInline='1';
      const created=script;
      script.addEventListener('load',()=>{created.dataset.ready='1';},{once:true});document.head.appendChild(script);
      const style=document.createElement('link');style.rel='stylesheet';style.href='/brand/promedical/admin/inline.css';document.head.appendChild(style);
    }
    if(script.dataset.ready==='1')mount();else script.addEventListener('load',mount,{once:true});
    return () => {script?.removeEventListener('load',mount);document.dispatchEvent(new Event('promedical:editor-unmount'));};
  }, [id,revision,kind]);
  return <div data-promedical-editor data-page-id={id} data-revision={revision} data-kind={kind} />;
}
