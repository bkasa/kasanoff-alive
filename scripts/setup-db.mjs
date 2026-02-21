// Run with: node scripts/setup-db.mjs
// Sets up all tables for the Explorations platform.
// Works with both local SQLite (dev) and Turso (production).

import { mkdirSync, readFileSync } from 'fs';
import { createClient } from '@libsql/client';

// Load .env.local so TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are available
try {
  const env = readFileSync('.env.local', 'utf8');
  env.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
} catch {
  // .env.local not found — rely on existing env vars
}

const url = process.env.TURSO_DATABASE_URL || 'file:./data/explorations.db';

// Create local data directory before opening the DB file
if (url.startsWith('file:')) {
  mkdirSync('./data', { recursive: true });
}

const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS purchases (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_email  TEXT NOT NULL,
    exploration_id  TEXT NOT NULL,
    stripe_session  TEXT UNIQUE,
    amount_cents    INTEGER DEFAULT 1800,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_email  TEXT NOT NULL,
    exploration_id  TEXT NOT NULL,
    status          TEXT DEFAULT 'in_progress',
    started_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS magic_links (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          TEXT NOT NULL,
    token          TEXT UNIQUE NOT NULL,
    exploration_id TEXT NOT NULL,
    used           INTEGER DEFAULT 0,
    expires_at     DATETIME NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS idx_messages_session  ON messages(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_purchases_email   ON purchases(customer_email)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_email    ON sessions(customer_email)`,
  `CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token)`,
];

async function setup() {
  console.log('Setting up Explorations database...');

  for (const sql of statements) {
    await db.execute(sql);
  }

  console.log('All tables created successfully.');
  console.log('\nTables:');
  console.log('  ✓ customers');
  console.log('  ✓ purchases');
  console.log('  ✓ sessions');
  console.log('  ✓ messages');
  console.log('  ✓ magic_links');
  console.log('\nDatabase setup complete.');
}

setup().catch(console.error);
