import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { useUserStore } from '../../store/useUserStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useRecurringTaskStore } from '../../store/useRecurringTaskStore';
import { EXPENSE_CATEGORIES, PAY_SCHEDULE_OPTIONS } from '../../lib/constants';
import { calculateSpendingMoney, calculateLockedAmountPerPeriod } from '../../lib/calculations';
import { getCurrentPeriodDates } from '../../lib/dateUtils';
import type { ExpenseBreakdown, PaySchedule } from '../../types';
import { Save } from 'lucide-react';

export function FinancialSettings() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [income, setIncome] = useState(profile?.monthlyIncome ?? 0);
  const [expenses, setExpenses] = useState<ExpenseBreakdown>(
    profile?.expenses ?? {
      rent: 0, groceries: 0, utilities: 0, subscriptions: 0,
      transportation: 0, savings: 0, other: 0,
    }
  );
  const [paySchedule, setPaySchedule] = useState<PaySchedule>(profile?.paySchedule ?? 'monthly');
  const [nextPayDate, setNextPayDate] = useState(profile?.nextPayDate ?? '');
  const [lockPercentage, setLockPercentage] = useState(profile?.lockPercentage ?? 50);
  const [saved, setSaved] = useState(false);

  const spendingMoney = calculateSpendingMoney(income, expenses);
  const lockedPerPeriod = calculateLockedAmountPerPeriod(spendingMoney, lockPercentage, paySchedule);

  const handleSave = () => {
    updateProfile({
      monthlyIncome: income,
      expenses,
      paySchedule,
      nextPayDate,
      lockPercentage,
    });

    const currentPeriod = usePayPeriodStore.getState().getCurrentPeriod();
    if (currentPeriod && nextPayDate) {
      // Close out the current period: expire remaining active tasks
      const expiredTasks = useTaskStore.getState().expireTasksForPeriod(currentPeriod.id);

      // Savings = locked amount minus what was unlocked by completing tasks
      const savedAmount = Math.max(0, currentPeriod.lockedAmount - currentPeriod.unlockedAmount);

      // Record savings as a history entry so it appears in all-time stats
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

      // Create the current period by calculating backwards from next pay date
      const referenceDate = new Date(nextPayDate + 'T00:00:00');
      const { startDate, endDate } = getCurrentPeriodDates(paySchedule, referenceDate);
      const newLockedAmount = calculateLockedAmountPerPeriod(spendingMoney, lockPercentage, paySchedule);
      const newPeriod = usePayPeriodStore.getState().createPeriod(startDate, endDate, newLockedAmount);

      // Auto-create recurring tasks for the new period
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

        {EXPENSE_CATEGORIES.map(({ key, label }) => (
          <Input
            key={key}
            label={label}
            prefix="$"
            type="number"
            value={expenses[key] || ''}
            onChange={(e) => setExpenses({ ...expenses, [key]: Number(e.target.value) })}
          />
        ))}

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
          <span className="text-text-secondary">Locked per Period</span>
          <CurrencyDisplay amount={lockedPerPeriod} size="sm" className="text-locked" />
        </div>

        <Button onClick={handleSave} icon={<Save size={16} />}>
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </Card>
    </div>
  );
}
