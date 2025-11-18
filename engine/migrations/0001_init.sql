BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_agent TEXT,
  env_info TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS installs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  mode TEXT,
  status TEXT,
  started_at TEXT,
  finished_at TEXT,
  selections TEXT,
  results TEXT,
  logs_path TEXT,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS components (
  id TEXT PRIMARY KEY,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS env_fingerprints (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  host TEXT,
  distro TEXT,
  kernel TEXT,
  pkg_managers TEXT,
  languages TEXT,
  frameworks TEXT,
  ci_configs TEXT,
  containers TEXT,
  hash TEXT
);

CREATE TABLE IF NOT EXISTS compatibility_matrices (
  id TEXT PRIMARY KEY,
  fingerprint_id TEXT,
  matrix_json TEXT,
  FOREIGN KEY(fingerprint_id) REFERENCES env_fingerprints(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT,
  action TEXT,
  target TEXT,
  status TEXT,
  detail TEXT
);

COMMIT;


