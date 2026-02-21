import { readFileSync } from 'fs';
import { createClient } from '@libsql/client';

// Load .env.local
const env = readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
});

const EMAIL = process.argv[2];
if (!EMAIL) {
  console.error('Usage: node scripts/seed-test-purchase.mjs your@email.com');
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await db.execute({
  sql: 'INSERT INTO customers (email) VALUES (?) ON CONFLICT(email) DO NOTHING',
  args: [EMAIL],
});

await db.execute({
  sql: 'INSERT OR IGNORE INTO purchases (customer_email, exploration_id, stripe_session, amount_cents) VALUES (?, ?, ?, ?)',
  args: [EMAIL, 'ikigai', 'manual_test_001', 1800],
});

console.log(`✓ Purchase recorded for ${EMAIL}`);
process.exit(0);
