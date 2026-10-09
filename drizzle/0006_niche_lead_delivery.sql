CREATE TABLE IF NOT EXISTS niche_lead_delivery (
 id TEXT PRIMARY KEY NOT NULL,
 site_id TEXT NOT NULL,
 canonical_host TEXT NOT NULL,
 recipient TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','accepted','failed')),
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0,
 lease_until INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS niche_lead_delivery_due ON niche_lead_delivery(site_id,state,next_attempt_at);
