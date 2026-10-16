-- Site-specific additive account security and service mail. Existing identities stay intact.
CREATE TABLE IF NOT EXISTS account_email_verifications (user_id TEXT PRIMARY KEY,email TEXT NOT NULL,verified_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS account_security_tokens (digest TEXT PRIMARY KEY,user_id TEXT NOT NULL,purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')),expires_at INTEGER NOT NULL,consumed_at INTEGER,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS security_tokens_user ON account_security_tokens(user_id,purpose);
CREATE TABLE IF NOT EXISTS account_mail_outbox (id TEXT PRIMARY KEY,user_id TEXT,kind TEXT NOT NULL,payload TEXT,status TEXT NOT NULL CHECK(status IN ('pending','sending','sent','unknown','expired')),created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,attempted_at INTEGER,sent_at INTEGER);
CREATE INDEX IF NOT EXISTS account_mail_pending ON account_mail_outbox(status,created_at);
CREATE TABLE IF NOT EXISTS creator_payout_accounts (partner_id TEXT PRIMARY KEY,account_id TEXT UNIQUE,country TEXT NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('test','live')),status TEXT NOT NULL CHECK(status IN ('creating','onboarding','ready','restricted')),created_at INTEGER NOT NULL,checked_at INTEGER);
CREATE TABLE IF NOT EXISTS creator_provider_transfers (payout_id TEXT PRIMARY KEY,account_id TEXT NOT NULL,mode TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('prepared','sending','confirmed','unknown','review','reversed')),transfer_id TEXT UNIQUE,created_at INTEGER NOT NULL,checked_at INTEGER,reversed_amount INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS creator_transfer_items (payout_id TEXT NOT NULL,commission_id TEXT NOT NULL,reversed_before INTEGER NOT NULL,PRIMARY KEY(payout_id,commission_id));
