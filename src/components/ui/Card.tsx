import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-2xl p-4 ${onClick ? 'cursor-pointer hover:bg-surface-light/70 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
