declare namespace Cloudflare {
  interface Env {
    ASSETS?: Fetcher;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NICHE_DEV_SITE_ID?: string;
    LEAD_EMAIL?: SendEmail;
    LEAD_SMTP_ENABLED?: string;
    LEAD_SMTP_USER?: string;
    LEAD_SMTP_PASSWORD?: string;
    LEAD_SMTP_HOST?: string;
    LEAD_SMTP_SITE_ID?: string;
    LEAD_HOSTINGER_ENABLED?: string;
    LEAD_HOSTINGER_SITE_ID?: string;
    LEAD_HOSTINGER_API_KEY?: string;
    LEAD_HOSTINGER_MAILBOX_ID?: string;
    LEAD_HOSTINGER_SENDER?: string;
    VOICE_WIDGET_ENABLED?: string;
    VOICE_CORE_URL?: string;
    VOICE_EDGE_SECRET?: string;
  }
}
