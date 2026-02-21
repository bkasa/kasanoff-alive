import db from './db';

// ─── Customers ────────────────────────────────────────────────

export async function upsertCustomer(email: string) {
  await db.execute({
    sql: `INSERT INTO customers (email) VALUES (?) ON CONFLICT(email) DO NOTHING`,
    args: [email.toLowerCase()],
  });
}

export async function getAllCustomerEmails(): Promise<string[]> {
  const result = await db.execute(
    `SELECT email FROM customers ORDER BY created_at DESC`
  );
  return result.rows.map((r) => r.email as string);
}

// ─── Purchases ───────────────────────────────────────────────

export async function recordPurchase(
  customerEmail: string,
  explorationId: string,
  stripeSession: string,
  amountCents: number = 1800
) {
  // Idempotent — skip if this Stripe session already recorded
  const existing = await db.execute({
    sql: `SELECT id FROM purchases WHERE stripe_session = ?`,
    args: [stripeSession],
  });
  if (existing.rows.length > 0) return existing.rows[0].id;

  const result = await db.execute({
    sql: `INSERT INTO purchases (customer_email, exploration_id, stripe_session, amount_cents)
          VALUES (?, ?, ?, ?)`,
    args: [customerEmail, explorationId, stripeSession, amountCents],
  });
  return result.lastInsertRowid;
}

export async function hasPurchased(
  customerEmail: string,
  explorationId: string
): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT id FROM purchases WHERE customer_email = ? AND exploration_id = ?`,
    args: [customerEmail.toLowerCase(), explorationId],
  });
  return result.rows.length > 0;
}

export async function getAllPurchases() {
  const result = await db.execute(
    `SELECT * FROM purchases ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getDailyTotals() {
  const result = await db.execute(
    `SELECT
       DATE(created_at) as date,
       COUNT(*) as order_count,
       SUM(amount_cents) as revenue_cents
     FROM purchases
     GROUP BY DATE(created_at)
     ORDER BY date DESC`
  );
  return result.rows;
}

// ─── Sessions (conversations) ─────────────────────────────────

export async function findOrCreateSession(
  customerEmail: string,
  explorationId: string
): Promise<number> {
  const email = customerEmail.toLowerCase();
  // Return existing in-progress session if one exists
  const existing = await db.execute({
    sql: `SELECT id FROM sessions
          WHERE customer_email = ? AND exploration_id = ? AND status = 'in_progress'
          ORDER BY started_at DESC LIMIT 1`,
    args: [email, explorationId],
  });
  if (existing.rows.length > 0) return existing.rows[0].id as number;

  const result = await db.execute({
    sql: `INSERT INTO sessions (customer_email, exploration_id) VALUES (?, ?)`,
    args: [email, explorationId],
  });
  return Number(result.lastInsertRowid);
}

export async function getSession(id: number) {
  const result = await db.execute({
    sql: `SELECT * FROM sessions WHERE id = ?`,
    args: [id],
  });
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function touchSession(id: number) {
  await db.execute({
    sql: `UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [id],
  });
}

// ─── Messages ────────────────────────────────────────────────

export async function saveMessage(
  sessionId: number,
  role: 'user' | 'assistant',
  content: string
) {
  await db.execute({
    sql: `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
    args: [sessionId, role, content],
  });
}

export async function getSessionMessages(
  sessionId: number
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const result = await db.execute({
    sql: `SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC`,
    args: [sessionId],
  });
  return result.rows.map((r) => ({
    role: r.role as 'user' | 'assistant',
    content: r.content as string,
  }));
}

// ─── Magic Links ─────────────────────────────────────────────

export async function createMagicLink(
  email: string,
  token: string,
  explorationId: string,
  expiresAt: string
) {
  await db.execute({
    sql: `INSERT INTO magic_links (email, token, exploration_id, expires_at) VALUES (?, ?, ?, ?)`,
    args: [email, token, explorationId, expiresAt],
  });
}

export async function validateMagicLink(token: string) {
  const result = await db.execute({
    sql: `SELECT * FROM magic_links WHERE token = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP`,
    args: [token],
  });
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function consumeMagicLink(token: string) {
  await db.execute({
    sql: `UPDATE magic_links SET used = 1 WHERE token = ?`,
    args: [token],
  });
}
