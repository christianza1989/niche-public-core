"use client";
/* eslint-disable @next/next/no-img-element -- SSR image URLs remain discoverable without JavaScript. */
import { useCallback, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { NicheMedia } from "@/lib/niche-sites";
import { imageFamilyKey, imageSrcSet, responsiveImageVariants, uniqueImageFamilies } from "@/lib/niche-media.mjs";
import s from "./promedical-gallery.module.css";

const mainSizes = "(max-width: 720px) calc(100vw - 40px), (max-width: 1264px) calc((100vw - 124px) / 2), 560px";
function sourceAt(media: NicheMedia[], asset: NicheMedia, width: number): NicheMedia {
  const variants = responsiveImageVariants(media, asset) as NicheMedia[];
  return variants.find(item => item.width >= width) ?? asset;
}
function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
}
function Chevron({ back = false }: { back?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={back ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function PromedicalGallery({ media, title }: { media: NicheMedia[]; title: string }) {
  const families = uniqueImageFamilies(media) as NicheMedia[];
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  // A cached failure may finish before hydration and its error event is then
  // already gone. Inspect the mounted image as well as listening for new loads.
  const completedImage = useCallback((element: HTMLImageElement | null) => {
    if (element?.complete) setFailed(element.naturalWidth === 0);
  }, []);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLAnchorElement>(null);
  const thumbs = useRef<(HTMLAnchorElement | null)[]>([]);
  const asset = families[selected] ?? families[0];
  if (!asset) return null;
  const primary = sourceAt(media, asset, 800);
  const choose = (index: number) => { setSelected(index); setFailed(false); };
  const move = (offset: number) => choose((selected + offset + families.length) % families.length);
  const close = () => { dialog.current?.close(); setExpanded(false); opener.current?.focus(); };
  function keys(event: KeyboardEvent, thumbnail = false) {
    let next: number | undefined;
    if (event.key === "ArrowRight") next = (selected + 1) % families.length;
    if (event.key === "ArrowLeft") next = (selected - 1 + families.length) % families.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = families.length - 1;
    if (next !== undefined) { event.preventDefault(); choose(next); if (thumbnail) thumbs.current[next]?.focus(); }
  }
  function dialogKeys(event: KeyboardEvent<HTMLDialogElement>) {
    keys(event);
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")];
    const first = controls[0], last = controls.at(-1);
    const active = event.currentTarget.ownerDocument.activeElement;
    if (event.shiftKey && active === first && last) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last && first) { event.preventDefault(); first.focus(); }
  }
  const status = `Nuotrauka ${selected + 1} iš ${families.length}`;
  return <div className={s.gallery} role="group" aria-label="Produkto nuotraukos">
    <a ref={opener} className={s.main} href={asset.src} aria-label={`${status}. Peržiūrėti vaizdą didesniu dydžiu`} onClick={event => {
      if (!plainClick(event) || typeof dialog.current?.showModal !== "function") return;
      event.preventDefault(); setExpanded(true); dialog.current.showModal();
    }}>
      <img ref={completedImage} key={`${primary.id}-${retry}`} src={primary.src} srcSet={imageSrcSet(media, asset)} sizes={mainSizes} alt={asset.alt} width={asset.width} height={asset.height} style={{ maxWidth: asset.width, maxHeight: asset.height }} loading={selected === 0 ? "eager" : "lazy"} fetchPriority={selected === 0 ? "high" : "auto"} decoding="async" onLoad={() => setFailed(false)} onError={() => setFailed(true)}/>
      <span className={s.enlarge}>Peržiūrėti vaizdą didesniu dydžiu</span>
    </a>
    {failed && <div className={s.error} role="status"><a href={asset.src}>Atverti nuotrauką</a><button type="button" onClick={() => { setRetry(value => value + 1); setFailed(false); }}>Bandyti dar kartą</button></div>}
    <p className={s.count} aria-live="polite" aria-atomic="true">{status}</p>
    {families.length > 1 && <ol className={s.thumbnails} aria-label="Visos produkto nuotraukos">{families.map((item, index) => {
      const thumb = sourceAt(media, item, 160);
      return <li key={imageFamilyKey(item)}><a ref={element => { thumbs.current[index] = element; }} className={s.thumbnail} href={item.src} aria-label={`Nuotrauka ${index + 1} iš ${families.length}: ${item.alt}`} aria-current={selected === index ? "true" : undefined} onKeyDown={event => keys(event, true)} onClick={event => { if (plainClick(event)) { event.preventDefault(); choose(index); } }}>
        <img src={thumb.src} srcSet={imageSrcSet(media, item)} sizes="80px" alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async"/>
      </a></li>;
    })}</ol>}
    <dialog ref={dialog} className={s.lightbox} aria-label={`${title} – produkto nuotraukos`} onKeyDown={dialogKeys} onCancel={() => { setExpanded(false); opener.current?.focus(); }} onClose={() => setExpanded(false)} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {expanded && <div className={s.lightboxContent}><div className={s.toolbar}><span role="status">{status}</span><button type="button" onClick={close} autoFocus>Uždaryti <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button></div>
        <div className={s.expandedImage}><img src={asset.src} srcSet={imageSrcSet(media, asset)} sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1296px) calc(100vw - 96px), 1200px" width={asset.width} height={asset.height} style={{ maxWidth: asset.width, maxHeight: asset.height }} alt={asset.alt} decoding="async"/>
          {families.length > 1 && <div className={s.controls}><button type="button" aria-label="Ankstesnė nuotrauka" onClick={() => move(-1)}><Chevron back/></button><button type="button" aria-label="Kita nuotrauka" onClick={() => move(1)}><Chevron/></button></div>}
        </div><p className={s.caption}>{asset.alt}</p><a className={s.direct} href={asset.src} target="_blank" rel="noopener noreferrer">Atverti nuotrauką</a>
      </div>}
    </dialog>
  </div>;
}
