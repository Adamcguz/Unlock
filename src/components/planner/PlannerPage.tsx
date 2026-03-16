import { useState } from 'react';
import { Wallet, Plus, Pencil, ArrowDownCircle, ArrowUpCircle, ShoppingCart, Calendar, Receipt } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useDebtStore } from '../../store/useDebtStore';
import { useUserStore } from '../../store/useUserStore';
import { usePlaidStore } from '../../store/usePlaidStore';
import { DebtCard } from './DebtCard';
import { DebtFormModal } from './DebtFormModal';
import { PaydownPlan } from './PaydownPlan';
import { getUpcomingEvents } from '../../lib/debtCalculations';
import { format, formatDistanceToNow } from 'date-fns';
import type { Debt, DebtType } from '../../types';

export function PlannerPage() {
  const { debts, accountBalance, transactions, addDebt, updateDebt, removeDebt, setAccountBalance } = useDebtStore();
  const profile = useUserStore((s) => s.profile);
  const { isConnected: plaidConnected, lastSyncedAt, transactions: plaidTransactions } = usePlaidStore();

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleOpenBalanceModal = () => {
    setBalanceInput(accountBalance > 0 ? accountBalance.toString() : '');
    setShowBalanceModal(true);
  };

  const handleSaveBalance = () => {
    const val = parseFloat(balanceInput);
    if (!isNaN(val) && val >= 0) {
      setAccountBalance(val);
    }
    setShowBalanceModal(false);
  };

  const handleAddDebt = () => {
    setEditingDebt(null);
    setShowDebtForm(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setShowDebtForm(true);
  };

  const handleDebtSubmit = (data: { name: string; type: DebtType; balance: number; minimumPayment: number; apr: number }) => {
    if (editingDebt) {
      updateDebt(editingDebt.id, data);
    } else {
      addDebt(data);
    }
    setShowDebtForm(false);
    setEditingDebt(null);
  };

  const handleDeleteDebt = (debtId: string) => {
    removeDebt(debtId);
    setConfirmDelete(null);
  };

  // Upcoming events
  const upcomingEvents = profile
    ? getUpcomingEvents(profile.bills, profile.nextPayDate, profile.paySchedule, profile.monthlyIncome, 14)
    : [];

  // Recent transactions (last 8)
  const recentTransactions = transactions.slice(0, 8);

  const txIcon = (type: string) => {
    switch (type) {
      case 'bill': return <Receipt size={14} className="text-danger" />;
      case 'deposit': return <ArrowDownCircle size={14} className="text-primary" />;
      case 'spending': return <ShoppingCart size={14} className="text-savings" />;
      default: return null;
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        {/* Account Balance */}
        <Card onClick={plaidConnected ? undefined : handleOpenBalanceModal}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-medium">Account Balance</span>
                  {plaidConnected && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-full">Live</span>
                  )}
                </div>
                <CurrencyDisplay amount={accountBalance} size="lg" className="text-primary" />
                {plaidConnected && lastSyncedAt && (
                  <span className="text-[10px] text-text-muted">
                    Synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
            {!plaidConnected && <Pencil size={14} className="text-text-muted" />}
          </div>
        </Card>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5 mb-2">
              <Calendar size={14} />
              Upcoming (Next 2 Weeks)
            </h3>
            <div className="flex flex-col gap-1.5">
              {upcomingEvents.slice(0, 5).map((event, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    {event.type === 'bill' ? (
                      <ArrowUpCircle size={14} className="text-danger shrink-0" />
                    ) : (
                      <ArrowDownCircle size={14} className="text-primary shrink-0" />
                    )}
                    <span className="text-text-primary">{event.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={event.type === 'bill' ? 'text-danger text-sm font-medium' : 'text-primary text-sm font-medium'}>
                      {event.type === 'bill' ? '-' : '+'}${event.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-text-muted">{format(event.date, 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        {plaidConnected && plaidTransactions.length > 0 ? (
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Recent Transactions
              <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-full align-middle">Live</span>
            </h3>
            <div className="flex flex-col gap-1.5">
              {plaidTransactions.slice(0, 8).map((tx) => (
                <div key={tx.transactionId} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    {tx.amount > 0 ? (
                      <ArrowUpCircle size={14} className="text-danger shrink-0" />
                    ) : (
                      <ArrowDownCircle size={14} className="text-primary shrink-0" />
                    )}
                    <span className="text-text-primary truncate max-w-[160px]">
                      {tx.merchantName || tx.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={tx.amount > 0 ? 'text-danger text-sm font-medium' : 'text-primary text-sm font-medium'}>
                      {tx.amount > 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <span className="text-xs text-text-muted">{format(new Date(tx.date), 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : recentTransactions.length > 0 ? (
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Recent Activity</h3>
            <div className="flex flex-col gap-1.5">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    {txIcon(tx.type)}
                    <span className="text-text-primary">{tx.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={tx.amount >= 0 ? 'text-primary text-sm font-medium' : 'text-danger text-sm font-medium'}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-text-muted">{format(new Date(tx.date), 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Debts */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Debts</h2>
          <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={handleAddDebt}>
            Add Debt
          </Button>
        </div>

        {debts.length === 0 ? (
          <Card>
            <p className="text-sm text-text-muted text-center py-4">
              No debts added yet. Add a credit card or loan to get paydown recommendations.
            </p>
          </Card>
        ) : (
          debts.map((debt) => (
            <div key={debt.id}>
              <DebtCard
                debt={debt}
                onEdit={() => handleEditDebt(debt)}
                onDelete={() => setConfirmDelete(debt.id)}
              />
              {confirmDelete === debt.id && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteDebt(debt.id)} className="flex-1">
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Paydown Plan */}
        <PaydownPlan />
      </div>

      {/* Balance Modal */}
      <Modal isOpen={showBalanceModal} onClose={() => setShowBalanceModal(false)} title="Account Balance">
        <div className="flex flex-col gap-4">
          <Input
            label="Current Balance"
            prefix="$"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowBalanceModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveBalance} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Debt Form Modal */}
      <DebtFormModal
        isOpen={showDebtForm}
        onClose={() => { setShowDebtForm(false); setEditingDebt(null); }}
        onSubmit={handleDebtSubmit}
        debt={editingDebt}
      />
    </PageContainer>
  );
}
