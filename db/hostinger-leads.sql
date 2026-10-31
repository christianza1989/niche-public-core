CREATE TABLE IF NOT EXISTS niche_leads (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  site_id VARCHAR(80) NOT NULL,
  created_at BIGINT NOT NULL,
  source_path VARCHAR(300) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(250) NOT NULL,
  message TEXT NOT NULL,
  consent_at BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  INDEX niche_leads_site_created (site_id, created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
