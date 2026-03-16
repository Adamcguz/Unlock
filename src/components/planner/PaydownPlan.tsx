import { useState } from 'react';
import { TrendingDown, ArrowRight, Star, Zap, Gauge, Turtle } from 'lucide-react';
import { Card } from '../ui/Card';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { useUserStore } from '../../store/useUserStore';
import { useDebtStore } from '../../store/useDebtStore';
import { getPaydownPlan, type PaydownPlan as PaydownPlanType } from '../../lib/debtCalculations';

type Preset = 'minimum' | 'moderate' | 'aggressive';

const PRESET_CONFIG: Record<Preset, { label: string; icon: typeof Turtle; description: string; lockPct: number }> = {
  minimum: { label: 'Minimum', icon: Turtle, description: 'More spending money', lockPct: 90 },
  moderate: { label: 'Moderate', icon: Gauge, description: 'Balanced approach', lockPct: 60 },
  aggressive: { label: 'Aggressive', icon: Zap, description: 'Max payoff speed', lockPct: 30 },
};

export function PaydownPlan() {
  const profile = useUserStore((s) => s.profile);
  const spendingMoney = useUserStore((s) => s.getSpendingMoney());
  const debts = useDebtStore((s) => s.debts);
  const accountBalance = useDebtStore((s) => s.accountBalance);
  const [selectedPreset, setSelectedPreset] = useState<Preset>('moderate');

  if (!profile || debts.length === 0) return null;

  const getPresetLockPercentage = (preset: Preset): number => {
    return PRESET_CONFIG[preset].lockPct;
  };

  const getPlan = (preset: Preset): PaydownPlanType => {
    return getPaydownPlan(
      debts,
      spendingMoney,
      getPresetLockPercentage(preset),
      profile.paySchedule,
      accountBalance,
      profile.bills,
      profile.nextPayDate,
      profile.monthlyIncome
    );
  };

  const plan = getPlan(selectedPreset);

  // Get payoff months for all presets for comparison
  const presetPayoffs = (Object.keys(PRESET_CONFIG) as Preset[]).map((preset) => {
    const p = getPlan(preset);
    return {
      preset,
      months: p.items[0]?.monthsToPayoff ?? null,
      lockPct: getPresetLockPercentage(preset),
    };
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
        <TrendingDown size={18} />
        Paydown Plan
      </h2>

      {/* Payoff timeline presets */}
      <Card>
        <h3 className="text-sm font-medium text-text-secondary mb-3">Payoff Speed</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(Object.keys(PRESET_CONFIG) as Preset[]).map((preset) => {
            const config = PRESET_CONFIG[preset];
            const Icon = config.icon;
            const isSelected = selectedPreset === preset;
            const payoff = presetPayoffs.find((p) => p.preset === preset);
            return (
              <button
                key={preset}
                onClick={() => setSelectedPreset(preset)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent bg-surface-light hover:border-primary/30'
                }`}
              >
                <Icon size={18} className={isSelected ? 'text-primary' : 'text-text-muted'} />
                <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-text-muted">{payoff?.lockPct}% lock</span>
                {payoff?.months != null && (
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-primary' : 'text-text-muted'}`}>
                    ~{payoff.months} mo
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-muted text-center">
          {selectedPreset === 'minimum' && 'Keep most of your money for spending — only pay minimums on debt.'}
          {selectedPreset === 'moderate' && 'Balance spending money and debt payoff.'}
          {selectedPreset === 'aggressive' && 'Minimize spending money to pay off debt as fast as possible.'}
        </p>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-text-secondary mb-3">Priority Order (Highest APR First)</h3>
        <div className="flex flex-col gap-3">
          {plan.items.map((item) => (
            <div
              key={item.debt.id}
              className={`flex items-center justify-between p-2.5 rounded-xl ${
                item.isPriority ? 'bg-primary/10 border border-primary/30' : 'bg-surface-light'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {item.isPriority && <Star size={12} className="text-primary shrink-0" />}
                  <span className="text-sm font-medium text-text-primary truncate">{item.debt.name}</span>
                  <span className="text-xs text-text-muted shrink-0">{item.debt.apr}%</span>
                </div>
                <span className="text-xs text-text-muted">
                  Balance: <CurrencyDisplay amount={item.debt.balance} size="sm" className="inline" />
                </span>
              </div>
              <div className="text-right shrink-0">
                <CurrencyDisplay amount={item.recommendedPayment} size="sm" className="text-primary" />
                <span className="text-xs text-text-muted block">/month</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {plan.items[0]?.monthsToPayoff && (
        <Card>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight size={14} className="text-primary shrink-0" />
            <p className="text-text-secondary">
              At <CurrencyDisplay amount={plan.items[0].recommendedPayment} size="sm" className="text-primary inline" />/mo,{' '}
              <span className="text-text-primary font-medium">{plan.items[0].debt.name}</span> would be paid off in{' '}
              <span className="text-primary font-semibold">
                ~{plan.items[0].monthsToPayoff} {plan.items[0].monthsToPayoff === 1 ? 'month' : 'months'}
              </span>
            </p>
          </div>
        </Card>
      )}

      {plan.suggestedLockPercentage < getPresetLockPercentage(selectedPreset) && (
        <Card>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Suggested Lock Adjustment</h3>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <span className="text-xs text-text-muted">Current</span>
              <p className="text-lg font-bold text-text-primary">{getPresetLockPercentage(selectedPreset)}%</p>
              <CurrencyDisplay amount={plan.currentLockPerPeriod} size="sm" className="text-text-muted" />
              <span className="text-xs text-text-muted">/period</span>
            </div>
            <ArrowRight size={18} className="text-primary" />
            <div className="text-center">
              <span className="text-xs text-text-muted">Suggested</span>
              <p className="text-lg font-bold text-primary">{plan.suggestedLockPercentage}%</p>
              <CurrencyDisplay amount={plan.suggestedLockPerPeriod} size="sm" className="text-primary" />
              <span className="text-xs text-primary">/period</span>
            </div>
          </div>
          <p className="text-xs text-text-muted text-center mt-2">
            Locking less frees up more money to pay down debt faster
          </p>
        </Card>
      )}
    </div>
  );
}
