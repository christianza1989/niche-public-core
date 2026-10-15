CREATE TABLE commerce_mail_messages (
 environment TEXT NOT NULL CHECK(environment IN ('sandbox','production')),
 store_id TEXT NOT NULL,
 id TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 sender TEXT NOT NULL,
 recipient TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('unknown','accepted','rejected')),
 reference TEXT,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(environment,store_id,id),
 CHECK(status!='accepted' OR reference IS NOT NULL)
);
