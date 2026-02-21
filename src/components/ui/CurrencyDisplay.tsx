import { formatCurrency } from '../../lib/dateUtils';

interface CurrencyDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSign?: boolean;
}

const sizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export function CurrencyDisplay({
  amount,
  size = 'md',
  className = '',
  showSign = false,
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(amount);
  const sign = showSign && amount > 0 ? '+' : '';

  return (
    <span className={`font-bold tabular-nums ${sizes[size]} ${className}`}>
      {sign}{formatted}
    </span>
  );
}
