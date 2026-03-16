import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Landmark, Loader2 } from 'lucide-react';
import { createLinkToken, exchangePublicToken } from '../../lib/api';
import { usePlaidStore } from '../../store/usePlaidStore';

export function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setConnected, setAccounts } = usePlaidStore();

  const generateToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await createLinkToken();
      setLinkToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize');
      setIsLoading(false);
    }
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await exchangePublicToken(publicToken);
        setConnected(true, result.institutionName);
        setAccounts(result.accounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
      } finally {
        setIsLoading(false);
      }
    },
    [setConnected, setAccounts]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setIsLoading(false),
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <div>
      <button
        onClick={generateToken}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Landmark className="w-5 h-5" />
        )}
        {isLoading ? 'Connecting...' : 'Connect Your Bank'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
