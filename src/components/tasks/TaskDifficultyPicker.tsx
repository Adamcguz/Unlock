import { getDifficultyLabel, getDifficultyColor } from '../../lib/constants';

interface TaskDifficultyPickerProps {
  value: number;
  onChange: (val: number) => void;
}

export function TaskDifficultyPicker({ value, onChange }: TaskDifficultyPickerProps) {
  const label = getDifficultyLabel(value);
  const colorClass = getDifficultyColor(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-text-secondary font-medium">Difficulty</label>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
          {value}/10 — {label}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>1 — Easy</span>
        <span>10 — Extreme</span>
      </div>
    </div>
  );
}
