CREATE TABLE traffic_daily (
  day TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0 CHECK (visits >= 0)
);

-- Short-lived random receipts only; no IP, cookie, path or visitor profile.
CREATE TABLE view_receipts (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX receipts_created_at ON view_receipts(created_at);

-- The receipt and daily counter change atomically, including on retries.
CREATE TRIGGER count_pageview AFTER INSERT ON view_receipts
BEGIN
  INSERT INTO traffic_daily(day, visits) VALUES (NEW.day, 1)
  ON CONFLICT(day) DO UPDATE SET visits = visits + 1;
END;
