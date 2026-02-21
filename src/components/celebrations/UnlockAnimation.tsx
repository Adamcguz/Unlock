import { useEffect, useState } from 'react';
import ConfettiExplosion from 'react-confetti-explosion';
import { Unlock } from 'lucide-react';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { MOTIVATING_MESSAGES } from '../../lib/constants';
import type { Task } from '../../types';

interface UnlockAnimationProps {
  task: Task;
  onDismiss: () => void;
}

export function UnlockAnimation({ task, onDismiss }: UnlockAnimationProps) {
  const [message] = useState(
    () => MOTIVATING_MESSAGES[Math.floor(Math.random() * MOTIVATING_MESSAGES.length)]
  );

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={onDismiss}
    >
      <div className="flex flex-col items-center gap-4 animate-bounce-in">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ConfettiExplosion
            force={0.6}
            duration={3000}
            particleCount={80}
            width={400}
          />
        </div>
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <Unlock size={40} className="text-primary" />
        </div>
        <CurrencyDisplay amount={task.dollarValue} size="xl" className="text-primary" showSign />
        <p className="text-xl font-bold text-white">{message}</p>
        <p className="text-text-secondary">{task.name}</p>
        <p className="text-xs text-text-muted mt-2">Tap to dismiss</p>
      </div>
    </div>
  );
}
