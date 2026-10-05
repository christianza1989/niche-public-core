-- Initial platform configuration. Replace demo editorial/legal values before
-- making any market public. INSERT OR IGNORE keeps redeploys idempotent.
INSERT OR IGNORE INTO sites (id, key, display_name, default_locale, timezone, currency, status, created_at, updated_at)
VALUES ('dovanos123', 'dovanos123', 'Dovanos 123', 'lt-LT', 'Europe/Vilnius', 'EUR', 'active', unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO sites (id, key, display_name, default_locale, timezone, currency, status, created_at, updated_at)
VALUES ('dovanuletas', 'dovanuletas', 'Dovanėlės', 'lt-LT', 'Europe/Vilnius', 'EUR', 'active', unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO sites (id, key, display_name, default_locale, timezone, currency, status, created_at, updated_at)
VALUES ('dovanadladov', 'dovanadladov', 'Dovana dla Dov', 'pl-PL', 'Europe/Warsaw', 'PLN', 'active', unixepoch('now') * 1000, unixepoch('now') * 1000);

INSERT OR IGNORE INTO domains (id, site_id, hostname, is_primary, created_at, updated_at) VALUES ('domain-dovanos123', 'dovanos123', 'dovanos123.lt', 1, unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO domains (id, site_id, hostname, is_primary, created_at, updated_at) VALUES ('domain-dovanuletas', 'dovanuletas', 'dovaneles.lt', 1, unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO domains (id, site_id, hostname, is_primary, created_at, updated_at) VALUES ('domain-dovanadladov', 'dovanadladov', 'dovanadladov.pl', 1, unixepoch('now') * 1000, unixepoch('now') * 1000);

INSERT OR IGNORE INTO locales (id, site_id, locale, hreflang, path_prefix, enabled, created_at, updated_at) VALUES ('locale-dovanos123-lt', 'dovanos123', 'lt-LT', 'lt-LT', '', 1, unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO locales (id, site_id, locale, hreflang, path_prefix, enabled, created_at, updated_at) VALUES ('locale-dovanos123-lv', 'dovanos123', 'lv-LV', 'lv-LV', 'lv', 0, unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO locales (id, site_id, locale, hreflang, path_prefix, enabled, created_at, updated_at) VALUES ('locale-dovanos123-pl', 'dovanos123', 'pl-PL', 'pl-PL', 'pl', 0, unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO locales (id, site_id, locale, hreflang, path_prefix, enabled, created_at, updated_at) VALUES ('locale-dovanuletas-lt', 'dovanuletas', 'lt-LT', 'lt-LT', '', 1, unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO locales (id, site_id, locale, hreflang, path_prefix, enabled, created_at, updated_at) VALUES ('locale-dovanadladov-pl', 'dovanadladov', 'pl-PL', 'pl-PL', '', 1, unixepoch('now') * 1000, unixepoch('now') * 1000);

INSERT OR IGNORE INTO authors (id, site_id, locale, slug, name, role, bio, experience, same_as_json, created_at, updated_at)
VALUES ('aiste-redaktore', 'dovanos123', 'lt-LT', 'aiste-redaktore', 'Aistė Petrauskaitė', 'Dovanų gidų redaktorė', 'Aistė redaguoja dovanų gidus ir tikrina, ar rekomendacijos aiškios bei praktiškos.', 'Dovanų idėjų atranka ir turinio faktų patikra.', '[]', unixepoch('now') * 1000, unixepoch('now') * 1000);
INSERT OR IGNORE INTO authors (id, site_id, locale, slug, name, role, bio, experience, same_as_json, created_at, updated_at)
VALUES ('kasia-redaktorka', 'dovanadladov', 'pl-PL', 'kasia-redaktorka', 'Kasia Nowak', 'Redaktorka poradników prezentowych', 'Kasia opracowuje praktyczne poradniki prezentowe dla par i rodzin.', 'Analiza potrzeb odbiorców i lokalizacja treści.', '[]', unixepoch('now') * 1000, unixepoch('now') * 1000);
