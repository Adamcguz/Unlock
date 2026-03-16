import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, supabaseAdmin } from '../_lib/supabase.js';
import { plaidClient } from '../_lib/plaid.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getAuthUser(req);
    const { public_token } = req.body;

    if (!public_token) {
      return res.status(400).json({ error: 'Missing public_token' });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Get institution info
    const itemResponse = await plaidClient.itemGet({ access_token });
    const institutionId = itemResponse.data.item.institution_id;
    let institutionName = 'Unknown Bank';

    if (institutionId) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US'] as any,
        });
        institutionName = instResponse.data.institution.name;
      } catch {
        // Keep default name
      }
    }

    // Store in database
    const { error: dbError } = await supabaseAdmin.from('plaid_items').insert({
      user_id: userId,
      access_token,
      item_id,
      institution_name: institutionName,
    });

    if (dbError) {
      console.error('Supabase insert error:', JSON.stringify(dbError));
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Fetch initial balances
    const balanceResponse = await plaidClient.accountsBalanceGet({ access_token });
    const accounts = balanceResponse.data.accounts.map((acct) => ({
      accountId: acct.account_id,
      name: acct.name,
      type: acct.type,
      currentBalance: acct.balances.current ?? 0,
      availableBalance: acct.balances.available,
    }));

    return res.status(200).json({
      success: true,
      institutionName,
      accounts,
    });
  } catch (error: unknown) {
    console.error('Exchange token error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('authorization') || message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
