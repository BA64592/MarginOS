/**
 * Postgres pool + schema migrate for Margins 365 auth / licences.
 */
import pg from 'pg'

const { Pool } = pg

/** @type {import('pg').Pool | null} */
let pool = null

export function dbConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

function connectionConfig() {
  const raw = process.env.DATABASE_URL
  if (!raw) return null
  // Parse URI so we can force TLS settings DigitalOcean managed PG accepts from Node.
  const u = new URL(raw)
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '') || 'defaultdb',
    ssl: { rejectUnauthorized: false },
    max: 5,
  }
}

export function getPool() {
  if (!dbConfigured()) return null
  if (!pool) {
    pool = new Pool(connectionConfig())
  }
  return pool
}

export async function migrate() {
  const p = getPool()
  if (!p) return false
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      plan TEXT NOT NULL DEFAULT 'free',
      licence_state TEXT NOT NULL DEFAULT 'none',
      time_zone TEXT,
      stripe_customer_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_sign_in_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS verification_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS verification_tokens_user_id_idx ON verification_tokens(user_id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);

    CREATE TABLE IF NOT EXISTS stripe_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  // Soft-launch columns (idempotent)
  await p.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email';
  `)
  return true
}

export async function query(text, params) {
  const p = getPool()
  if (!p) throw new Error('DATABASE_URL is not configured')
  return p.query(text, params)
}
