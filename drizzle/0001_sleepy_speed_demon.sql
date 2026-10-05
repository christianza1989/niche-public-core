ALTER TABLE `articles` ADD `external_id` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_site_locale_external_unique` ON `articles` (`site_id`,`locale`,`external_id`);