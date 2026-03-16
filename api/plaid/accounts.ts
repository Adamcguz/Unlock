import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, supabaseAdmin } from '../_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getAuthUser(req);

    const { data: accounts, error } = await supabaseAdmin
      .from('cached_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return res.status(200).json({
      accounts: (accounts || []).map((acct: any) => ({
        accountId: acct.account_id,
        name: acct.name,
        type: acct.type,
        currentBalance: acct.current_balance,
        availableBalance: acct.available_balance,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('authorization') || message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
