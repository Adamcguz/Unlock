import { Flame, Trophy } from 'lucide-react';

interface StreakMilestoneProps {
  streakDays: number;
  onDismiss: () => void;
}

export function StreakMilestone({ streakDays, onDismiss }: StreakMilestoneProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={onDismiss}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
          {streakDays >= 30 ? (
            <Trophy size={40} className="text-orange-400" />
          ) : (
            <Flame size={40} className="text-orange-400" />
          )}
        </div>
        <p className="text-3xl font-bold text-white">{streakDays} Day Streak!</p>
        <p className="text-text-secondary text-center max-w-xs">
          {streakDays >= 30
            ? "An entire month of consistency. That's incredible!"
            : streakDays >= 14
              ? "Two weeks strong. You're building a real habit!"
              : streakDays >= 7
                ? "A full week! Your consistency is paying off."
                : "Three days in a row! Great momentum!"}
        </p>
        <p className="text-xs text-text-muted mt-2">Tap to dismiss</p>
      </div>
    </div>
  );
}
