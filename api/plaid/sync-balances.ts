import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, supabaseAdmin } from '../_lib/supabase';
import { plaidClient } from '../_lib/plaid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getAuthUser(req);

    // Get all Plaid items for this user
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('plaid_items')
      .select('id, access_token, item_id')
      .eq('user_id', userId);

    if (itemsError) throw new Error(itemsError.message);
    if (!items || items.length === 0) {
      return res.status(200).json({ accounts: [] });
    }

    const allAccounts: any[] = [];

    for (const item of items) {
      const balanceResponse = await plaidClient.accountsBalanceGet({
        access_token: item.access_token,
      });

      for (const acct of balanceResponse.data.accounts) {
        const accountData = {
          plaid_item_id: item.id,
          user_id: userId,
          account_id: acct.account_id,
          name: acct.name,
          type: acct.type,
          current_balance: acct.balances.current ?? 0,
          available_balance: acct.balances.available,
          last_synced_at: new Date().toISOString(),
        };

        // Upsert by account_id
        await supabaseAdmin
          .from('cached_accounts')
          .upsert(accountData, { onConflict: 'account_id' });

        allAccounts.push({
          accountId: acct.account_id,
          name: acct.name,
          type: acct.type,
          currentBalance: acct.balances.current ?? 0,
          availableBalance: acct.balances.available,
        });
      }
    }

    return res.status(200).json({ accounts: allAccounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('authorization') || message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
