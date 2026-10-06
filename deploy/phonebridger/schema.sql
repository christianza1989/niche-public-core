CREATE TABLE IF NOT EXISTS customer_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS customer_sessions (digest TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS customer_session_expiry ON customer_sessions(expires_at);
CREATE TABLE IF NOT EXISTS request_rates (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS niche_leads (id TEXT PRIMARY KEY, site_id TEXT NOT NULL, created_at INTEGER NOT NULL, source_path TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, consent_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new');
CREATE INDEX IF NOT EXISTS leads_site_created ON niche_leads(site_id,created_at);
CREATE TABLE IF NOT EXISTS niche_interest_daily (site_id TEXT NOT NULL,day TEXT NOT NULL,page_path TEXT NOT NULL,event TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(site_id,day,page_path,event));
