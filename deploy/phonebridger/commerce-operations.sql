-- Additive delivery metadata; no customer, payment or native data is replaced.
CREATE TABLE IF NOT EXISTS commerce_deliveries (
 order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),carrier TEXT NOT NULL,
 tracking_number TEXT NOT NULL,tracking_url TEXT NOT NULL,dispatched_at INTEGER NOT NULL,
 delivered_at INTEGER
);
