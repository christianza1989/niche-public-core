CREATE TABLE IF NOT EXISTS niche_interest_daily (
  site_id text NOT NULL,
  day text NOT NULL,
  page_path text NOT NULL,
  event text NOT NULL CHECK(event IN ('pageview', 'email_click', 'phone_click')),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, day, page_path, event)
);
