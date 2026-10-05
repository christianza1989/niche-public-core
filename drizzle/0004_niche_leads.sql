CREATE TABLE IF NOT EXISTS `niche_leads` (
  `id` text PRIMARY KEY NOT NULL,
  `site_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `source_path` text NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `message` text NOT NULL,
  `consent_at` integer NOT NULL,
  `status` text NOT NULL DEFAULT 'new'
);
CREATE INDEX IF NOT EXISTS `niche_leads_site_created_idx` ON `niche_leads` (`site_id`, `created_at`);
