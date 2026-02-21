import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`max-w-lg mx-auto w-full px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}
