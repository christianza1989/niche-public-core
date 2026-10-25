-- Additive hosted editorial storage. Existing site, lead and analytics tables are untouched.
CREATE TABLE IF NOT EXISTS content_admin_accounts (
 site_id TEXT NOT NULL, email TEXT NOT NULL, password_hash TEXT,
 password_version INTEGER NOT NULL DEFAULT 1, enabled INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL, PRIMARY KEY(site_id,email)
);
CREATE TABLE IF NOT EXISTS content_admin_enrollments (
 token_hash TEXT PRIMARY KEY, site_id TEXT NOT NULL, email TEXT NOT NULL,
 expires_at INTEGER NOT NULL, consumed_at INTEGER, operation_id TEXT
);
CREATE TABLE IF NOT EXISTS content_admin_sessions (
 token_hash TEXT PRIMARY KEY, site_id TEXT NOT NULL, email TEXT NOT NULL,
 csrf_token TEXT NOT NULL, account_version INTEGER NOT NULL,
 created_at INTEGER NOT NULL, seen_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS content_admin_sessions_expiry ON content_admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS content_admin_limits (
 limit_key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS content_admin_settings (
 site_id TEXT PRIMARY KEY, context_json TEXT NOT NULL, paused_at TEXT,
 version INTEGER NOT NULL DEFAULT 1, operation_id TEXT, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS content_admin_edits (
 site_id TEXT NOT NULL, page_id TEXT NOT NULL, base_revision TEXT NOT NULL,
 draft_json TEXT NOT NULL, approved_json TEXT, review_json TEXT,
 title TEXT NOT NULL, publish_at TEXT NOT NULL, has_changes INTEGER NOT NULL DEFAULT 1,
 version INTEGER NOT NULL, operation_id TEXT NOT NULL,
 actor_email TEXT NOT NULL, updated_at INTEGER NOT NULL,
 PRIMARY KEY(site_id,page_id)
);
CREATE TABLE IF NOT EXISTS content_admin_history (
 site_id TEXT NOT NULL, page_id TEXT NOT NULL, version INTEGER NOT NULL,
 action TEXT NOT NULL, snapshot_json TEXT NOT NULL, actor_email TEXT NOT NULL,
 created_at INTEGER NOT NULL, PRIMARY KEY(site_id,page_id,version)
);
CREATE TABLE IF NOT EXISTS content_admin_audit (
 id TEXT PRIMARY KEY, site_id TEXT NOT NULL, actor_email TEXT NOT NULL,
 action TEXT NOT NULL, page_id TEXT, revision_hash TEXT, created_at INTEGER NOT NULL
);
