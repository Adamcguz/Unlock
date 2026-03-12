import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { Modal } from '../ui/Modal';
import { useUserStore } from '../../store/useUserStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useRecurringTaskStore } from '../../store/useRecurringTaskStore';
import { PAY_SCHEDULE_OPTIONS, COMMON_BILL_PRESETS } from '../../lib/constants';
import { calculateSpendingMoney, calculateLockedAmountPerPeriod, calculateLockedAmountForPeriod } from '../../lib/calculations';
import { getCurrentPeriodDates, formatCurrency } from '../../lib/dateUtils';
import { generateId } from '../../lib/storage';
import type { RecurringBill, PaySchedule } from '../../types';
import { Save, Plus, Pencil, Trash2 } from 'lucide-react';

export function FinancialSettings() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [income, setIncome] = useState(profile?.monthlyIncome ?? 0);
  const [bills, setBills] = useState<RecurringBill[]>(profile?.bills ?? []);
  const [paySchedule, setPaySchedule] = useState<PaySchedule>(profile?.paySchedule ?? 'monthly');
  const [nextPayDate, setNextPayDate] = useState(profile?.nextPayDate ?? '');
  const [lockPercentage, setLockPercentage] = useState(profile?.lockPercentage ?? 50);
  const [saved, setSaved] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDay, setBillDay] = useState(1);

  const spendingMoney = calculateSpendingMoney(income, bills);
  const lockedPerPeriod = calculateLockedAmountPerPeriod(spendingMoney, lockPercentage, paySchedule);

  const openAddModal = () => {
    setEditingBill(null);
    setBillName('');
    setBillAmount('');
    setBillDay(1);
    setShowModal(true);
  };

  const openEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setBillName(bill.name);
    setBillAmount(String(bill.amount));
    setBillDay(bill.dayOfMonth);
    setShowModal(true);
  };

  const handleSaveBill = () => {
    if (!billName.trim() || !billAmount) return;
    const amount = Number(billAmount);
    if (amount <= 0) return;

    if (editingBill) {
      setBills(bills.map((b) =>
        b.id === editingBill.id
          ? { ...b, name: billName.trim(), amount, dayOfMonth: billDay }
          : b
      ));
    } else {
      setBills([...bills, {
        id: generateId(),
        name: billName.trim(),
        amount,
        dayOfMonth: billDay,
      }]);
    }
    setShowModal(false);
  };

  const handleDeleteBill = (billId: string) => {
    setBills(bills.filter((b) => b.id !== billId));
  };

  const handleSave = () => {
    updateProfile({
      monthlyIncome: income,
      bills,
      paySchedule,
      nextPayDate,
      lockPercentage,
    });

    const currentPeriod = usePayPeriodStore.getState().getCurrentPeriod();
    if (currentPeriod && nextPayDate) {
      const expiredTasks = useTaskStore.getState().expireTasksForPeriod(currentPeriod.id);

      const savedAmount = Math.max(0, currentPeriod.lockedAmount - currentPeriod.unlockedAmount);

      if (savedAmount > 0) {
        useHistoryStore.getState().addEntry({
          taskId: currentPeriod.id,
          taskName: 'Period savings',
          difficulty: 0,
          dollarValue: savedAmount,
          completedAt: new Date().toISOString(),
          payPeriodId: currentPeriod.id,
          type: 'saved',
        });
      }

      const allTasks = useTaskStore.getState().getTasksByPeriod(currentPeriod.id);
      useHistoryStore.getState().addPeriodSummary({
        payPeriodId: currentPeriod.id,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        totalLocked: currentPeriod.lockedAmount,
        totalUnlocked: currentPeriod.unlockedAmount,
        totalSaved: savedAmount,
        tasksCompleted: allTasks.filter((t) => t.status === 'completed').length,
        tasksExpired: expiredTasks.length,
        tasksTotal: allTasks.length,
      });

      usePayPeriodStore.getState().completePeriod(currentPeriod.id, savedAmount);

      const referenceDate = new Date(nextPayDate + 'T00:00:00');
      const { startDate, endDate } = getCurrentPeriodDates(paySchedule, referenceDate);
      const newLockedAmount = calculateLockedAmountForPeriod(
        income, bills, lockPercentage, paySchedule,
        new Date(startDate), new Date(endDate)
      );
      const newPeriod = usePayPeriodStore.getState().createPeriod(startDate, endDate, newLockedAmount);

      const templates = useRecurringTaskStore.getState().templates
        .filter((t) => t.isActive && t.lastGeneratedPeriodId !== newPeriod.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      for (const template of templates) {
        const count = template.timesPerPeriod ?? 1;
        for (let i = 0; i < count; i++) {
          const task = useTaskStore.getState().createTask({
            payPeriodId: newPeriod.id,
            name: template.name,
            difficulty: template.difficulty,
            dueDate: null,
            notes: template.notes,
            recurringTemplateId: template.id,
            category: template.category,
          });
          usePayPeriodStore.getState().addTaskToPeriod(newPeriod.id, task.id);
        }
        useRecurringTaskStore.getState().markGenerated(template.id, newPeriod.id);
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const scheduleOptions = Object.entries(PAY_SCHEDULE_OPTIONS).map(([value, { label }]) => ({
    value,
    label,
  }));

  const sortedBills = [...bills].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  const availablePresets = COMMON_BILL_PRESETS.filter(
    (p) => !bills.some((b) => b.name === p)
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Financial Setup</h2>
      <p className="text-sm text-text-muted">Changes will apply to your next pay period.</p>

      <Card className="flex flex-col gap-3">
        <Input
          label="Monthly Income"
          prefix="$"
          type="number"
          value={income || ''}
          onChange={(e) => setIncome(Number(e.target.value))}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary font-medium">Recurring Bills</label>
            <button
              onClick={openAddModal}
              className="text-primary text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Add Bill
            </button>
          </div>

          {sortedBills.length === 0 ? (
            <p className="text-xs text-text-muted py-2">No bills added yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {sortedBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between bg-surface-light rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-text-muted font-medium shrink-0">
                      {bill.dayOfMonth}{getOrdinalSuffix(bill.dayOfMonth)}
                    </span>
                    <span className="text-sm font-medium truncate">{bill.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm text-danger font-medium mr-1">{formatCurrency(bill.amount)}</span>
                    <button onClick={() => openEditModal(bill)} className="p-1 text-text-muted hover:text-text-primary cursor-pointer">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteBill(bill.id)} className="p-1 text-text-muted hover:text-danger cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Select
          label="Pay Schedule"
          options={scheduleOptions}
          value={paySchedule}
          onChange={(e) => setPaySchedule(e.target.value as PaySchedule)}
        />

        <Input
          label="Next Pay Date"
          type="date"
          value={nextPayDate}
          onChange={(e) => setNextPayDate(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary font-medium">Lock Percentage</label>
            <span className="text-sm font-bold text-locked">{lockPercentage}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={lockPercentage}
            onChange={(e) => setLockPercentage(Number(e.target.value))}
            className="w-full accent-locked"
          />
        </div>

        <div className="bg-surface-light rounded-xl p-3 flex items-center justify-between text-sm">
          <span className="text-text-secondary">Spending Money</span>
          <CurrencyDisplay amount={spendingMoney} size="sm" className="text-primary" />
        </div>
        <div className="bg-surface-light rounded-xl p-3 flex items-center justify-between text-sm">
          <span className="text-text-secondary">Locked per Period (avg)</span>
          <CurrencyDisplay amount={lockedPerPeriod} size="sm" className="text-locked" />
        </div>

        <Button onClick={handleSave} icon={<Save size={16} />}>
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBill ? 'Edit Bill' : 'Add Bill'}>
        <div className="flex flex-col gap-4">
          <Input
            label="Bill Name"
            placeholder="e.g., Rent"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            autoFocus
          />

          {!editingBill && availablePresets.length > 0 && !billName && (
            <div className="flex flex-wrap gap-2">
              {availablePresets.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBillName(preset)}
                  className="text-xs bg-surface-light text-text-secondary px-2.5 py-1.5 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          <Input
            label="Amount"
            prefix="$"
            type="number"
            min={0}
            step={10}
            placeholder="0"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
          />

          <Input
            label="Day of Month"
            type="number"
            min={1}
            max={31}
            value={billDay}
            onChange={(e) => setBillDay(Math.max(1, Math.min(31, Number(e.target.value))))}
          />

          <Button
            onClick={handleSaveBill}
            disabled={!billName.trim() || !billAmount || Number(billAmount) <= 0}
          >
            {editingBill ? 'Save Changes' : 'Add Bill'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
