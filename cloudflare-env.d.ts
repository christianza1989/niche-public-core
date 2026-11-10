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
    LEAD_MAIL_RELAY_ENABLED?: string;
    LEAD_MAIL_RELAY_URL?: string;
    LEAD_MAIL_RELAY_SENDER?: string;
    LEAD_MAIL_RELAY_TOKEN?: string;
    VOICE_WIDGET_ENABLED?: string;
    VOICE_CORE_URL?: string;
    VOICE_EDGE_SECRET?: string;
  }
}
