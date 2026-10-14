declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NICHE_DEV_SITE_ID?: string;
    LEAD_EMAIL?: SendEmail;
    LEAD_SMTP_ENABLED?: string;
    LEAD_SMTP_USER?: string;
    LEAD_SMTP_PASSWORD?: string;
    VOICE_WIDGET_ENABLED?: string;
    VOICE_SITE_IDS?: string;
    VOICE_PILOT_SITE_IDS?: string;
    CHAT_WIDGET_ENABLED?: string;
    CHAT_SITE_IDS?: string;
    VOICE_CORE_URL?: string;
    VOICE_EDGE_SECRET?: string;
  }
}
