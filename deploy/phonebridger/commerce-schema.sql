-- Additive migration. Do not modify existing accounts, leads or native data.
CREATE TABLE IF NOT EXISTS commerce_orders (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,email TEXT NOT NULL,holders INTEGER NOT NULL CHECK(holders BETWEEN 0 AND 3),finish TEXT NOT NULL,
 policy_version TEXT NOT NULL,currency TEXT NOT NULL,subtotal INTEGER NOT NULL,shipping INTEGER NOT NULL,
 status TEXT NOT NULL,fulfilment TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,
 session_id TEXT UNIQUE,payment_intent TEXT,paid_at INTEGER,shipping_details TEXT
);
CREATE INDEX IF NOT EXISTS commerce_order_user ON commerce_orders(user_id,created_at);
CREATE INDEX IF NOT EXISTS commerce_order_payment ON commerce_orders(payment_intent);
CREATE TABLE IF NOT EXISTS commerce_stock (finish TEXT PRIMARY KEY CHECK(finish IN ('black','silver')),quantity INTEGER NOT NULL CHECK(quantity>=0));
CREATE TABLE IF NOT EXISTS commerce_reservations (order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),finish TEXT NOT NULL REFERENCES commerce_stock(finish),quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 3),expires_at INTEGER);
CREATE TRIGGER IF NOT EXISTS commerce_stock_guard BEFORE INSERT ON commerce_reservations
WHEN NEW.quantity + COALESCE((SELECT SUM(quantity) FROM commerce_reservations WHERE finish=NEW.finish),0) > COALESCE((SELECT quantity FROM commerce_stock WHERE finish=NEW.finish),0)
BEGIN SELECT RAISE(ABORT,'Insufficient stock'); END;
CREATE TABLE IF NOT EXISTS commerce_events (id TEXT PRIMARY KEY,type TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS commerce_entitlements (order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),user_id TEXT NOT NULL,status TEXT NOT NULL,licence_reference TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS commerce_reviews (id TEXT PRIMARY KEY,order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id),user_id TEXT NOT NULL,display_name TEXT NOT NULL,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),title TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL,moderation TEXT NOT NULL DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS commerce_moderation_audit (id TEXT PRIMARY KEY,review_id TEXT NOT NULL,action TEXT NOT NULL,reason TEXT NOT NULL,created_at INTEGER NOT NULL);
