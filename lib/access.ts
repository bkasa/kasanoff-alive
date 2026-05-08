import db from './db';

export type PurchaseRow = {
  id?: number | bigint;
  customer_email?: string;
  exploration_id?: string;
  stripe_session?: string;
  amount_cents?: number;
  created_at?: string;
  expires_at?: string | null;
  status?: string | null;
  prep_complete?: number;
  archived_document?: string | null;
};

/**
 * Returns 'active' or 'expired' for a purchase row.
 * If expires_at is null (existing Guides), always returns 'active'.
 */
export function getPurchaseAccessStatus(purchase: PurchaseRow): 'active' | 'expired' {
  if (!purchase.expires_at) return 'active';
  return new Date(purchase.expires_at) > new Date() ? 'active' : 'expired';
}

/**
 * Returns the most recent purchase row for a given email and exploration slug, or null.
 */
export async function findMostRecentPurchase(
  email: string,
  slug: string
): Promise<PurchaseRow | null> {
  const result = await db.execute({
    sql: `SELECT * FROM purchases
          WHERE customer_email = ? AND exploration_id = ?
          ORDER BY created_at DESC LIMIT 1`,
    args: [email.toLowerCase(), slug],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as PurchaseRow;
}
