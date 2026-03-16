import { useState } from 'react';
import { Receipt, DollarSign, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { usePlaidStore } from '../../store/usePlaidStore';
import { useUserStore } from '../../store/useUserStore';
import { detectedBillsToRecurringBills } from '../../lib/transactionDetection';
import { generateId } from '../../lib/storage';
import type { DetectedBill } from '../../lib/transactionDetection';

export function PlaidInsights() {
  const {
    isConnected,
    detectedBills,
    detectedIncome,
    billsImported,
    incomeImported,
    csvImported,
    setBillsImported,
    setIncomeImported,
  } = usePlaidStore();

  const { profile, updateProfile } = useUserStore();

  const [selectedBills, setSelectedBills] = useState<Set<string>>(
    () => new Set(detectedBills.map((b) => b.merchantName))
  );
  const [showBillPicker, setShowBillPicker] = useState(false);

  if (!isConnected || (detectedBills.length === 0 && !detectedIncome)) return null;

  const toggleBill = (merchantName: string) => {
    setSelectedBills((prev) => {
      const next = new Set(prev);
      if (next.has(merchantName)) next.delete(merchantName);
      else next.add(merchantName);
      return next;
    });
  };

  const handleImportBills = () => {
    const toImport = detectedBills.filter((b) => selectedBills.has(b.merchantName));
    const newBills = detectedBillsToRecurringBills(toImport, generateId);
    updateProfile({ bills: newBills });
    setBillsImported(true);
    setShowBillPicker(false);
  };

  const handleImportIncome = () => {
    if (!detectedIncome) return;
    updateProfile({
      monthlyIncome: detectedIncome.estimatedMonthlyIncome,
      paySchedule: detectedIncome.paySchedule,
      nextPayDate: detectedIncome.nextPayDate,
    });
    setIncomeImported(true);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="font-semibold">Smart Insights</h2>
      </div>
      <p className="text-xs text-text-muted mb-4">
        We analyzed your {csvImported ? 'imported CSV' : 'bank'} transactions and detected recurring patterns.
      </p>

      {/* Detected Income */}
      {detectedIncome && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Detected Income</span>
            {incomeImported && (
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
            )}
          </div>
          <div className="bg-surface-light rounded-xl p-3 mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">Monthly Income</span>
              <span className="font-medium">${detectedIncome.estimatedMonthlyIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">Per Paycheck</span>
              <span>${detectedIncome.estimatedPerPeriodIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">Pay Schedule</span>
              <span className="capitalize">{detectedIncome.paySchedule.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Confidence</span>
              <span>{Math.round(detectedIncome.confidence * 100)}%</span>
            </div>
          </div>
          {!incomeImported ? (
            <button
              onClick={handleImportIncome}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Use This Income Data
            </button>
          ) : (
            <div className="flex items-center gap-2 justify-center text-sm text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              Income data imported
              {profile && (
                <span className="text-text-muted">
                  (${profile.monthlyIncome.toFixed(0)}/mo)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detected Bills */}
      {detectedBills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-danger" />
            <span className="text-sm font-medium">
              Detected {detectedBills.length} Recurring Bill{detectedBills.length !== 1 ? 's' : ''}
            </span>
            {billsImported && (
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
            )}
          </div>

          {!showBillPicker && !billsImported && (
            <>
              <div className="bg-surface-light rounded-xl p-3 mb-2">
                {detectedBills.slice(0, 4).map((bill) => (
                  <BillRow key={bill.merchantName} bill={bill} />
                ))}
                {detectedBills.length > 4 && (
                  <p className="text-xs text-text-muted text-center mt-1">
                    +{detectedBills.length - 4} more
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowBillPicker(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Review & Import Bills
              </button>
            </>
          )}

          {showBillPicker && (
            <>
              <div className="bg-surface-light rounded-xl p-3 mb-2 max-h-64 overflow-y-auto">
                {detectedBills.map((bill) => (
                  <label
                    key={bill.merchantName}
                    className="flex items-center gap-3 py-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBills.has(bill.merchantName)}
                      onChange={() => toggleBill(bill.merchantName)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <div className="flex-1 flex justify-between text-sm">
                      <span>{bill.name}</span>
                      <span className="text-text-muted">
                        ${bill.amount.toFixed(2)}/mo · Day {bill.dayOfMonth}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBillPicker(false)}
                  className="flex-1 px-3 py-2 bg-surface-light rounded-xl text-sm hover:bg-surface-lighter transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportBills}
                  disabled={selectedBills.size === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  Import {selectedBills.size} Bill{selectedBills.size !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}

          {billsImported && (
            <div className="flex items-center gap-2 justify-center text-sm text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              Bills imported ({profile?.bills.length ?? 0} bills)
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function BillRow({ bill }: { bill: DetectedBill }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span>{bill.name}</span>
      <span className="text-text-muted">
        ${bill.amount.toFixed(2)}/mo · Day {bill.dayOfMonth}
      </span>
    </div>
  );
}
