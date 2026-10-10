import { imageSrcSet } from "@/lib/niche-media.mjs";
import type { MediaV2, VisibleBlockV2 } from "@/lib/content-model-v2";

/** href is supplied only by the shared public projection. Never resolve a raw target here. */
export type ContentInline = { type: "text" | "link"; text: string; href?: string };
export type ContentBlock = VisibleBlockV2;

function Inline({ nodes }: { nodes: ContentInline[] }) {
  return nodes.map((node, index) => node.type === "link" && node.href
    ? <a href={node.href} key={index} {...(node.href.startsWith("https://") ? { rel: "noopener noreferrer" } : {})}>{node.text}</a>
    : <span key={index}>{node.text}</span>);
}

export function ContentImage({ asset, media, priority = false, sizes = "(max-width: 760px) calc(100vw - 40px), 900px", className }: { asset: MediaV2; media: MediaV2[]; priority?: boolean; sizes?: string; className?: string }) {
  // Already optimized by the shared responsive WebP pipeline; do not add a second image service.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={asset.src} srcSet={imageSrcSet(media, asset)} sizes={sizes} alt={asset.alt} width={asset.width} height={asset.height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />;
}

export function RichContent({ body, media }: { body: ContentBlock[]; media: MediaV2[] }) {
  return body.map((block, index) => {
    if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
    if (block.type === "richParagraph") return <p key={index}><Inline nodes={block.content} /></p>;
    if (block.type === "heading" || block.type === "richHeading") {
      const Heading = block.level === 3 ? "h3" : "h2";
      return <Heading key={index}>{block.type === "heading" ? block.text : <Inline nodes={block.content} />}</Heading>;
    }
    if (block.type === "list" || block.type === "richList") {
      const List = block.type === "richList" && block.ordered ? "ol" : "ul";
      return <List key={index}>{block.items.map((item, offset) => <li key={offset}>{typeof item === "string" ? item : <Inline nodes={item} />}</li>)}</List>;
    }
    const asset = media.find((item) => item.id === block.assetId);
    return asset ? <figure key={index}><ContentImage asset={asset} media={media} />{asset.credit && <figcaption>{asset.credit}</figcaption>}</figure> : null;
  });
}
