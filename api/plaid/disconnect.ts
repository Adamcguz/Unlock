import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, supabaseAdmin } from '../_lib/supabase.js';
import { plaidClient } from '../_lib/plaid.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getAuthUser(req);
    const { item_id } = req.body;

    if (!item_id) {
      return res.status(400).json({ error: 'Missing item_id' });
    }

    // Get access token
    const { data: item, error: findError } = await supabaseAdmin
      .from('plaid_items')
      .select('id, access_token')
      .eq('user_id', userId)
      .eq('item_id', item_id)
      .single();

    if (findError || !item) {
      return res.status(404).json({ error: 'Plaid item not found' });
    }

    // Remove from Plaid
    try {
      await plaidClient.itemRemove({ access_token: item.access_token });
    } catch {
      // Continue with DB cleanup even if Plaid call fails
    }

    // Delete from database (cascades to cached_accounts and cached_transactions)
    await supabaseAdmin.from('plaid_items').delete().eq('id', item.id);

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('authorization') || message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
