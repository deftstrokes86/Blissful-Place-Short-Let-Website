-- Backend MVP foundation schema (implementation direction)

CREATE TABLE IF NOT EXISTS flats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nightly_rate INTEGER NOT NULL,
  max_guests INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS extras (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  flat_fee INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  payment_method TEXT,
  stay_json TEXT NOT NULL,
  guest_json TEXT NOT NULL,
  pricing_json TEXT NOT NULL,
  transfer_hold_started_at TEXT,
  transfer_hold_expires_at TEXT,
  inventory_reopened_at TEXT,
  last_availability_json TEXT,
  confirmed_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS availability_blocks (
  id TEXT PRIMARY KEY,
  flat_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  block_type TEXT NOT NULL,
  manual_block_type TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  created_by TEXT,
  status TEXT NOT NULL,
  expires_at TEXT,
  released_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (source_type, source_id),
  FOREIGN KEY (flat_id) REFERENCES flats(id)
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  provider TEXT NOT NULL,
  outcome TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider_reference TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS transfer_verifications (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  transfer_reference TEXT NOT NULL,
  proof_note TEXT NOT NULL,
  proof_received_at TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  verified_by_staff_id TEXT,
  verified_at TEXT,
  verification_note TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS pos_coordinations (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  contact_window TEXT NOT NULL,
  coordination_note TEXT,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  completed_by_staff_id TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS reservation_events (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT NOT NULL,
  action TEXT NOT NULL,
  reservation_id TEXT,
  payload_hash TEXT NOT NULL,
  response_snapshot TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  PRIMARY KEY (key, action)
);

