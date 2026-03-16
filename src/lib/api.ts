import { supabase } from './supabase';
import type { PlaidAccount, PlaidTransaction } from '../types/plaid';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(path, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function createLinkToken(): Promise<string> {
  const data = await apiFetch<{ link_token: string }>('/api/plaid/create-link-token', {
    method: 'POST',
  });
  return data.link_token;
}

export async function exchangePublicToken(publicToken: string): Promise<{
  success: boolean;
  institutionName: string;
  accounts: PlaidAccount[];
}> {
  return apiFetch('/api/plaid/exchange-token', {
    method: 'POST',
    body: JSON.stringify({ public_token: publicToken }),
  });
}

export async function syncBalances(): Promise<{ accounts: PlaidAccount[] }> {
  return apiFetch('/api/plaid/sync-balances', { method: 'POST' });
}

export async function syncTransactions(): Promise<{
  transactions: PlaidTransaction[];
  added: number;
  modified: number;
  removed: number;
}> {
  return apiFetch('/api/plaid/sync-transactions', { method: 'POST' });
}

export async function disconnectPlaid(itemId: string): Promise<{ success: boolean }> {
  return apiFetch('/api/plaid/disconnect', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId }),
  });
}

export async function getAccounts(): Promise<{ accounts: PlaidAccount[] }> {
  return apiFetch('/api/plaid/accounts', { method: 'GET' });
}

export async function getTransactions(days = 30): Promise<{ transactions: PlaidTransaction[] }> {
  return apiFetch(`/api/plaid/transactions?days=${days}`, { method: 'GET' });
}
