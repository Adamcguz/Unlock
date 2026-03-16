import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Landmark, CheckCircle2, Loader2, Receipt, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { PlaidLinkButton } from '../plaid/PlaidLinkButton';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlaidStore } from '../../store/usePlaidStore';
import { supabase } from '../../lib/supabase';
import type { RecurringBill, PaySchedule } from '../../types';

interface BankSetupStepProps {
  onNext: () => void;
  onBack: () => void;
  onBankDataReady: (data: {
    income: number;
    bills: RecurringBill[];
    paySchedule: PaySchedule;
    nextPayDate: string;
  }) => void;
  generateId: () => string;
}

export function BankSetupStep({ onNext, onBack, onBankDataReady, generateId }: BankSetupStepProps) {
  const { user, signInWithEmail } = useAuthStore();
  const { isConnected, detectedBills, detectedIncome } = usePlaidStore();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDetectedData = detectedBills.length > 0 || detectedIncome !== null;

  // When data is detected, prepare it for import
  useEffect(() => {
    if (hasDetectedData && detectedIncome) {
      const bills: RecurringBill[] = detectedBills.map((b) => ({
        id: generateId(),
        name: b.name,
        amount: b.amount,
        dayOfMonth: b.dayOfMonth,
      }));

      onBankDataReady({
        income: detectedIncome.estimatedMonthlyIncome,
        bills,
        paySchedule: detectedIncome.paySchedule,
        nextPayDate: detectedIncome.nextPayDate,
      });
    }
  }, [hasDetectedData, detectedBills, detectedIncome, generateId, onBankDataReady]);

  const handleSendEmail = async () => {
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
  };

  // Not configured
  if (!supabase) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Bank</h2>
            <p className="text-text-secondary">
              Bank connection isn't configured yet. You can set it up later in Settings.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-6">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>Back</Button>
          <Button onClick={onNext} className="flex-1" icon={<ArrowRight size={16} />}>
            Set Up Manually
          </Button>
        </div>
      </div>
    );
  }

  // Connected with detected data — show summary
  if (isConnected && hasDetectedData) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bank Connected!</h2>
              <p className="text-text-secondary text-sm">We detected your financial info</p>
            </div>
          </div>

          {detectedIncome && (
            <div className="bg-surface-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-primary" />
                <span className="text-sm font-medium">Income Detected</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-muted">Monthly</span>
                <span className="font-medium">${detectedIncome.estimatedMonthlyIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Schedule</span>
                <span className="capitalize">{detectedIncome.paySchedule.replace('-', ' ')}</span>
              </div>
            </div>
          )}

          {detectedBills.length > 0 && (
            <div className="bg-surface-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={16} className="text-danger" />
                <span className="text-sm font-medium">{detectedBills.length} Bills Detected</span>
              </div>
              {detectedBills.slice(0, 5).map((bill) => (
                <div key={bill.merchantName} className="flex justify-between text-sm py-0.5">
                  <span className="text-text-muted">{bill.name}</span>
                  <span>${bill.amount.toFixed(2)}/mo</span>
                </div>
              ))}
              {detectedBills.length > 5 && (
                <p className="text-xs text-text-muted mt-1">+{detectedBills.length - 5} more</p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-6">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>Back</Button>
          <Button onClick={onNext} className="flex-1" icon={<ArrowRight size={16} />}>
            Use This Data
          </Button>
        </div>
      </div>
    );
  }

  // Connected but no data yet (still syncing)
  if (isConnected && !hasDetectedData) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="text-primary animate-spin" />
          <h2 className="text-xl font-bold">Analyzing Your Transactions...</h2>
          <p className="text-text-secondary text-sm text-center">
            We're scanning your bank history to detect your income and recurring bills.
          </p>
        </div>
        <div className="flex gap-3 pt-6">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>Back</Button>
          <Button variant="secondary" onClick={onNext} className="flex-1" icon={<ArrowRight size={16} />}>
            Skip — Set Up Manually
          </Button>
        </div>
      </div>
    );
  }

  // Not signed in or not connected
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Bank</h2>
          <p className="text-text-secondary">
            Automatically detect your income, bills, and pay schedule — or skip and enter manually.
          </p>
        </div>

        {!user ? (
          // Sign in first
          emailSent ? (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-400">Check your email for a sign-in link! Come back here after signing in.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-light rounded-xl text-sm border border-border focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleSendEmail}
                disabled={isLoading || !email}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                Sign In to Connect Bank
              </button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )
        ) : (
          // Signed in, show Plaid Link
          <PlaidLinkButton />
        )}
      </div>
      <div className="flex gap-3 pt-6">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>Back</Button>
        <Button variant="secondary" onClick={onNext} className="flex-1" icon={<ArrowRight size={16} />}>
          Skip — Set Up Manually
        </Button>
      </div>
    </div>
  );
}
