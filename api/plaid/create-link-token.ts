import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../_lib/supabase';
import { plaidClient } from '../_lib/plaid';
import { CountryCode, Products } from 'plaid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getAuthUser(req);

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Unlock',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return res.status(200).json({ link_token: response.data.link_token });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('authorization') || message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
