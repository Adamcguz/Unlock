import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, supabaseAdmin } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getAuthUser(req);
    const days = parseInt(req.query.days as string) || 30;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const { data: transactions, error } = await supabaseAdmin
      .from('cached_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sinceDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);

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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('authorization') || message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
