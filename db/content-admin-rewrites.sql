-- Additive migration; apply only with explicit deployment authorization.
CREATE TABLE IF NOT EXISTS content_admin_rewrites (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 site_id TEXT NOT NULL, id TEXT NOT NULL, page_id TEXT NOT NULL,
 request_hash TEXT NOT NULL, etag TEXT NOT NULL, snapshot_json TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('whole','selection')),
 selection_json TEXT, note TEXT NOT NULL, actor_email TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','drafted','superseded')),
 result_hash TEXT, review_json TEXT, draft_etag TEXT, created_at INTEGER NOT NULL,
 UNIQUE(site_id,id)
);
CREATE INDEX IF NOT EXISTS content_admin_rewrites_pending ON content_admin_rewrites(site_id,state,seq);
