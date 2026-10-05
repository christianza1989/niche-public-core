/** Small gift-only accessibility fixes; retain the legacy visual system for other hosts. */
export function GiftStyles() {
  return <style>{`
.gift-skip-link { position: fixed; top: 8px; left: 8px; z-index: 100; padding: 14px 18px; background: #25221f; color: #fff; border-radius: 8px; transform: translateY(-160%); }
.gift-skip-link:focus { transform: translateY(0); }
.gift-view .header-inner, .gift-view .main-nav { flex-wrap: wrap; }
.gift-view .brand-mark { max-width: 100%; min-width: 0; white-space: normal; overflow-wrap: anywhere; }
.gift-view .brand-dot { flex-shrink: 0; }
.gift-view .footer-grid > * { min-width: 0; }
.gift-view .home-hero-note { color: #64584f; }
.gift-view .home-hero-media:has(figcaption) { height: auto; }
.gift-view .home-hero-media figcaption { position: static; width: auto; padding: 10px 0 0; color: #64584f; background: none; box-shadow: none; font: 13px/1.5 Arial, sans-serif; }
.gift-view .home-quick-index { color: #8a4b38; }
.gift-view .home-category-index { color: #8a4b38; }
.gift-view .home-category-desc { color: #64584f; }
.gift-view .footer-note, .gift-view .footer-links a { color: #675f58; }
.gift-view .article-copy, .gift-view .breadcrumbs, .gift-view .source-list, .gift-view .footer-links { overflow-wrap: anywhere; }
.gift-view .article-meta { flex-wrap: wrap; }
.gift-view .home-latest-card { min-width: 0; }
.gift-view .home-category-card { min-width: 0; overflow-wrap: anywhere; }
.gift-view .article-copy a, .gift-view .source-list a { text-decoration: underline; text-underline-offset: 3px; }
.gift-contact-panel { margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--line); }
.gift-contact-form { display: grid; gap: 16px; }
.gift-contact-form label { display: grid; gap: 8px; }
.gift-contact-form input:not([type=checkbox]), .gift-contact-form textarea { width: 100%; min-width: 0; border: 1px solid #81756a; border-radius: 8px; padding: 12px; font: inherit; color: var(--ink); background: #fff; }
.gift-contact-form input:focus-visible, .gift-contact-form textarea:focus-visible { outline: 3px solid #a852d4; outline-offset: 3px; }
.gift-contact-form .gift-contact-consent { display: flex; align-items: start; gap: 12px; }
.gift-contact-consent input { flex: 0 0 auto; width: 22px; height: 22px; margin-top: 4px; }
.gift-contact-form p { margin-bottom: 0; }
.gift-contact-form button { justify-self: start; border: 0; min-height: 44px; cursor: pointer; }
@media (max-width: 760px) { .gift-view .main-nav { display: flex; gap: 14px; line-height: 1.5; } .gift-view .header-inner { padding-block: 16px; gap: 16px; } .gift-view .main-nav a { min-height: 28px; display: inline-flex; align-items: center; } }
@media (max-width: 380px) { .gift-view .home-category-grid { grid-template-columns: minmax(0, 1fr); } .gift-view .home-category-card { min-height: 160px; } }
@media (prefers-reduced-motion: reduce) { html:has(.gift-view) { scroll-behavior: auto; } .gift-view .button { transition: none; } .gift-view .button:hover { transform: none; } }
`}</style>;
}
