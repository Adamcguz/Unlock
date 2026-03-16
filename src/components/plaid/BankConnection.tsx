import { useState } from 'react';
import { Landmark, RefreshCw, Unlink, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { PlaidLinkButton } from './PlaidLinkButton';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlaidStore } from '../../store/usePlaidStore';
import { disconnectPlaid, syncBalances, syncTransactions } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export function BankConnection() {
  const { user, signInWithEmail, signOut } = useAuthStore();
  const { isConnected, institutionName, itemId, lastSyncedAt, isSyncing, accounts, disconnect: clearPlaid } = usePlaidStore();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If Supabase isn't configured, show setup message
  if (!supabase) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">Bank Connection</h2>
        </div>
        <p className="text-sm text-text-muted">
          Bank connection requires Supabase and Plaid configuration. Add your API keys to the environment variables to enable this feature.
        </p>
      </Card>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">Bank Connection</h2>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Sign in to connect your bank account and automatically sync your balance and transactions.
        </p>

        {emailSent ? (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-400">Check your email for a sign-in link!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-light rounded-xl text-sm border border-border focus:border-accent focus:outline-none"
            />
            <button
              onClick={async () => {
                if (!email) return;
                setIsLoading(true);
                setError(null);
                try {
                  await signInWithEmail(email);
                  setEmailSent(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to send email');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading || !email}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Send Sign-in Link
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </Card>
    );
  }

  // Signed in but not connected
  if (!isConnected) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Bank Connection</h2>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-text-muted hover:text-text-secondary"
          >
            Sign Out
          </button>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Connect your bank to automatically sync your balance and transactions. Your credentials are handled securely by Plaid.
        </p>
        <PlaidLinkButton />
      </Card>
    );
  }

  // Connected
  const handleSync = async () => {
    setIsLoading(true);
    try {
      const balanceData = await syncBalances();
      usePlaidStore.getState().setAccounts(balanceData.accounts);
      const txData = await syncTransactions();
      usePlaidStore.getState().setTransactions(txData.transactions);
      usePlaidStore.getState().setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!itemId) return;
    setIsLoading(true);
    try {
      await disconnectPlaid(itemId);
      clearPlaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  const checkingTotal = accounts
    .filter((a) => a.type === 'checking')
    .reduce((sum, a) => sum + (a.availableBalance ?? a.currentBalance), 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold">Bank Connected</h2>
        </div>
        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
          Active
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Institution</span>
          <span>{institutionName || 'Connected Bank'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Checking Balance</span>
          <span className="font-medium">${checkingTotal.toFixed(2)}</span>
        </div>
        {lastSyncedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Last Synced</span>
            <span className="text-text-secondary">
              {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSync}
          disabled={isLoading || isSyncing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface-light rounded-xl text-sm hover:bg-surface-lighter transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </button>
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-xl text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <Unlink className="w-4 h-4" />
          Disconnect
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex justify-end">
        <button
          onClick={signOut}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Sign Out
        </button>
      </div>
    </Card>
  );
}
