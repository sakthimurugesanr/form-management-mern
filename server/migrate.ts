import { pool } from './db.js';
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL,
      email VARCHAR(254) UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK (role = 'admin')
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL,
      email VARCHAR(254) NOT NULL, phone VARCHAR(30) NOT NULL, department VARCHAR(100) NOT NULL,
      description TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK (ends_at > starts_at)
    );
    CREATE INDEX IF NOT EXISTS appointments_starts_idx ON appointments(starts_at);
    CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
  `);
  console.log('Database migration complete.');
} finally { await pool.end(); }
