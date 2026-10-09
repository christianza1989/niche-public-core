declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NICHE_DEV_SITE_ID?: string;
    LEAD_EMAIL?: SendEmail;
    LEAD_SMTP_ENABLED?: string;
    LEAD_SMTP_USER?: string;
    LEAD_SMTP_PASSWORD?: string;
    MAIL_RELAY_URL?: string;
    MAIL_RELAY_KEY?: string;
    MAIL_RELAY_SITE?: string;
    ASSETS: Fetcher;
    LEAD_MAIL_RETRY_ENABLED?: string;
    RELEASE_SITE_ID?: string;
    RELEASE_ORIGIN?: string;
    RELEASE_MODE?: string;
    LEAD_LIMITER?: RateLimit;
    INTEREST_LIMITER?: RateLimit;
    VOICE_WIDGET_ENABLED?: string;
    VOICE_CORE_URL?: string;
    VOICE_EDGE_SECRET?: string;
  }
}
