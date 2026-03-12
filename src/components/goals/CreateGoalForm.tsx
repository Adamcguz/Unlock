import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useGoalStore } from '../../store/useGoalStore';
import { useUserStore } from '../../store/useUserStore';
import { useRecurringTaskStore } from '../../store/useRecurringTaskStore';
import { GOAL_UNIT_PRESETS } from '../../lib/constants';
import { Plus, TrendingUp, Flame } from 'lucide-react';
import type { GoalType, GoalLink } from '../../types';

interface CreateGoalFormProps {
  onCreated: () => void;
}

export function CreateGoalForm({ onCreated }: CreateGoalFormProps) {
  const createGoal = useGoalStore((s) => s.createGoal);
  const categories = useUserStore((s) => s.profile?.taskCategories ?? []);
  const templates = useRecurringTaskStore((s) => s.templates).filter((t) => t.isActive);

  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [name, setName] = useState('');
  const [linkType, setLinkType] = useState<'category' | 'templates'>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [startValue, setStartValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!goalType) { setError('Select a goal type'); return; }
    if (!name.trim()) { setError('Goal name is required'); return; }

    let link: GoalLink;
    if (linkType === 'category') {
      if (!selectedCategory) { setError('Select a category'); return; }
      link = { type: 'category', category: selectedCategory };
    } else {
      if (selectedTemplateIds.size === 0) { setError('Select at least one task'); return; }
      link = { type: 'templates', templateIds: [...selectedTemplateIds] };
    }

    if (goalType === 'numeric') {
      if (!startValue || !targetValue) { setError('Start and target values are required'); return; }
      if (!unit.trim()) { setError('Unit is required'); return; }
    }

    createGoal({
      name: name.trim(),
      type: goalType,
      link,
      startValue: goalType === 'numeric' ? parseFloat(startValue) : undefined,
      targetValue: goalType === 'numeric' ? parseFloat(targetValue) : undefined,
      unit: goalType === 'numeric' ? unit.trim() : undefined,
    });

    onCreated();
  };

  // Step 1: Type selection
  if (!goalType) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">What type of goal?</p>
        <button
          onClick={() => setGoalType('numeric')}
          className="flex items-center gap-3 p-4 bg-surface-light rounded-xl hover:bg-surface-light/80 transition-colors cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-text-primary">Numeric Goal</p>
            <p className="text-xs text-text-muted">Track a measurable value (weight, savings, etc.)</p>
          </div>
        </button>
        <button
          onClick={() => setGoalType('habit')}
          className="flex items-center gap-3 p-4 bg-surface-light rounded-xl hover:bg-surface-light/80 transition-colors cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Flame size={20} className="text-orange-400" />
          </div>
          <div>
            <p className="font-medium text-text-primary">Habit Goal</p>
            <p className="text-xs text-text-muted">Track consistency and streaks from task completions</p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Goal Name"
        placeholder={goalType === 'numeric' ? 'e.g., Lose 30 pounds' : 'e.g., Meditate daily'}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary font-medium">Link to</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLinkType('category')}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
              linkType === 'category' ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary'
            }`}
          >
            Category
          </button>
          <button
            type="button"
            onClick={() => setLinkType('templates')}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
              linkType === 'templates' ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary'
            }`}
          >
            Specific Tasks
          </button>
        </div>
      </div>

      {linkType === 'category' ? (
        <Select
          label="Category"
          options={[
            { value: '', label: 'Select a category' },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-text-secondary font-medium">Select recurring tasks</label>
          {templates.length === 0 ? (
            <p className="text-xs text-text-muted p-3 bg-surface-light rounded-xl">
              No active recurring tasks. Create recurring tasks first.
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {templates.map((t) => (
                <label key={t.id} className="flex items-center gap-2 p-2 bg-surface-light rounded-lg cursor-pointer hover:bg-surface-light/80">
                  <input
                    type="checkbox"
                    checked={selectedTemplateIds.has(t.id)}
                    onChange={() => toggleTemplate(t.id)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-text-primary">{t.name}</span>
                  {t.category && <span className="text-xs text-text-muted ml-auto">{t.category}</span>}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {goalType === 'numeric' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Value"
              type="number"
              step="any"
              placeholder="e.g., 200"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
            />
            <Input
              label="Target Value"
              type="number"
              step="any"
              placeholder="e.g., 170"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
          <Select
            label="Unit"
            options={[
              { value: '', label: 'Select unit' },
              ...GOAL_UNIT_PRESETS.map((u) => ({ value: u, label: u })),
              { value: '__custom', label: 'Custom...' },
            ]}
            value={GOAL_UNIT_PRESETS.includes(unit) || unit === '' ? unit : '__custom'}
            onChange={(e) => {
              if (e.target.value === '__custom') setUnit('');
              else setUnit(e.target.value);
            }}
          />
          {!GOAL_UNIT_PRESETS.includes(unit) && unit !== '' && (
            <Input
              label="Custom Unit"
              placeholder="e.g., pushups"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          )}
        </>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" icon={<Plus size={16} />}>
        Create Goal
      </Button>
    </form>
  );
}
