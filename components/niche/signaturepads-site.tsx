import { renderSignaturepads } from './signaturepads/render.mjs';
import './signaturepads/signaturepads.css';

// Presentational shell. SignaturepadsCoreSite supplies the shared publication
// projection; this component does not load a source snapshot or decide approval.
export function SignaturepadsSite({ snapshot, route, query = '' }: { snapshot: unknown; route: unknown; query?: string }) {
  return <div className="signaturepads-site" dangerouslySetInnerHTML={{__html: renderSignaturepads(snapshot, route, new URLSearchParams(query))}} />;
}
