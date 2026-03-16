import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, supabaseAdmin } from '../_lib/supabase';
import { plaidClient } from '../_lib/plaid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getAuthUser(req);

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('plaid_items')
      .select('id, access_token, cursor')
      .eq('user_id', userId);

    if (itemsError) throw new Error(itemsError.message);
    if (!items || items.length === 0) {
      return res.status(200).json({ transactions: [], added: 0, modified: 0, removed: 0 });
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;

    for (const item of items) {
      let cursor = item.cursor || undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await plaidClient.transactionsSync({
          access_token: item.access_token,
          cursor,
        });

        const { added, modified, removed, next_cursor, has_more } = response.data;

        // Insert/update added transactions
        for (const tx of added) {
          await supabaseAdmin.from('cached_transactions').upsert({
            plaid_item_id: item.id,
            user_id: userId,
            transaction_id: tx.transaction_id,
            account_id: tx.account_id,
            amount: tx.amount,
            date: tx.date,
            name: tx.name,
            merchant_name: tx.merchant_name,
            category: tx.category,
            pending: tx.pending,
          }, { onConflict: 'transaction_id' });
        }

        // Update modified transactions
        for (const tx of modified) {
          await supabaseAdmin.from('cached_transactions').upsert({
            plaid_item_id: item.id,
            user_id: userId,
            transaction_id: tx.transaction_id,
            account_id: tx.account_id,
            amount: tx.amount,
            date: tx.date,
            name: tx.name,
            merchant_name: tx.merchant_name,
            category: tx.category,
            pending: tx.pending,
          }, { onConflict: 'transaction_id' });
        }

        // Remove deleted transactions
        for (const tx of removed) {
          if (tx.transaction_id) {
            await supabaseAdmin
              .from('cached_transactions')
              .delete()
              .eq('transaction_id', tx.transaction_id);
          }
        }

        totalAdded += added.length;
        totalModified += modified.length;
        totalRemoved += removed.length;
        cursor = next_cursor;
        hasMore = has_more;
      }

      // Update cursor
      await supabaseAdmin
        .from('plaid_items')
        .update({ cursor, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }

    // Return recent transactions
    const { data: transactions } = await supabaseAdmin
      .from('cached_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    return res.status(200).json({
      transactions: (transactions || []).map((tx: any) => ({
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        amount: tx.amount,
        date: tx.date,
        name: tx.name,
        merchantName: tx.merchant_name,
        category: tx.category || [],
        pending: tx.pending,
      })),
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('authorization') || message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
