// Native Workers email bindings are not available on Node. No provider fallback.
export class EmailMessage {
  constructor(){throw Error('cloudflare_email_binding_unavailable_on_node');}
}
