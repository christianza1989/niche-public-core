-- Additive delivery metadata; no customer, payment or native data is replaced.
CREATE TABLE IF NOT EXISTS commerce_deliveries (
 order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),carrier TEXT NOT NULL,
 tracking_number TEXT NOT NULL,tracking_url TEXT NOT NULL,dispatched_at INTEGER NOT NULL,
 delivered_at INTEGER
);
-- The supply model is immutable per order; future policy edits cannot turn a
-- stocked order into a dropship order or consume invented stock at dispatch.
CREATE TABLE IF NOT EXISTS commerce_procurement (
 order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
 model TEXT NOT NULL CHECK(model='manual_dropship'),created_at INTEGER NOT NULL
);
-- Preserve the exact accepted offer after later website edits.
CREATE TABLE IF NOT EXISTS commerce_policy_records (
 version TEXT PRIMARY KEY, seller TEXT NOT NULL, terms_text TEXT NOT NULL, created_at INTEGER NOT NULL
);
