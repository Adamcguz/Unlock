import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export function Input({
  label,
  error,
  prefix,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-text-secondary font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-surface-light rounded-xl px-3 py-2.5 text-text-primary
            border border-transparent focus:border-primary focus:outline-none
            placeholder:text-text-muted transition-colors
            ${prefix ? 'pl-7' : ''}
            ${error ? 'border-danger' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
