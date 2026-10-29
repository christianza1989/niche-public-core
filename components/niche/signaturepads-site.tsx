import { renderSignaturepads } from './signaturepads/render.mjs';
import './signaturepads/signaturepads.css';

// Migration renderer only. No production dispatch or publication registration.
// The private preview supplies the captured source; production needs the normal
// reviewed package and site adapter admission before this component is wired.
export function SignaturepadsSite({ snapshot, route, query = '' }: { snapshot: unknown; route: unknown; query?: string }) {
  return <div className="signaturepads-site" dangerouslySetInnerHTML={{__html: renderSignaturepads(snapshot, route, new URLSearchParams(query))}} />;
}
