interface ProgressBarProps {
  value: number; // 0 to 1
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  color = 'bg-primary',
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value * 100));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-muted min-w-[3ch] text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
