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
  progress_context_json TEXT NOT NULL,
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
  updated_at TEXT NOT NULL,
  last_touched_at TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  internal_code TEXT UNIQUE,
  unit_of_measure TEXT NOT NULL,
  reorder_threshold INTEGER,
  par_level INTEGER,
  criticality TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  flat_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_items (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL,
  expected_quantity INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (template_id, inventory_item_id),
  FOREIGN KEY (template_id) REFERENCES inventory_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS flat_inventory (
  id TEXT PRIMARY KEY,
  flat_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL,
  expected_quantity INTEGER NOT NULL,
  current_quantity INTEGER NOT NULL,
  condition_status TEXT NOT NULL,
  notes TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (flat_id, inventory_item_id),
  FOREIGN KEY (flat_id) REFERENCES flats(id),
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT NOT NULL,
  flat_id TEXT,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  actor_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (flat_id) REFERENCES flats(id)
);

CREATE TABLE IF NOT EXISTS flat_readiness (
  flat_id TEXT PRIMARY KEY,
  cleaning_status TEXT NOT NULL,
  linen_status TEXT NOT NULL,
  consumables_status TEXT NOT NULL,
  maintenance_status TEXT NOT NULL,
  critical_asset_status TEXT NOT NULL,
  readiness_status TEXT NOT NULL,
  override_status TEXT,
  override_reason TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT,
  flat_id TEXT,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (flat_id) REFERENCES flats(id)
);

CREATE TABLE IF NOT EXISTS maintenance_issues (
  id TEXT PRIMARY KEY,
  flat_id TEXT NOT NULL,
  inventory_item_id TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (flat_id) REFERENCES flats(id),
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS worker_tasks (
  id TEXT PRIMARY KEY,
  flat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  assigned_to TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS reservation_notifications (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  template_key TEXT NOT NULL,
  audience TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  template_ref TEXT,
  status TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  reservation_id TEXT,
  reservation_token TEXT,
  payment_attempt_id TEXT,
  error_message TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (payment_attempt_id) REFERENCES payment_attempts(id)
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

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
