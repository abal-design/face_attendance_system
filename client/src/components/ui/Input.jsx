import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/helpers';

const Input = ({
  label,
  error,
  helperText,
  icon,
  type = 'text',
  className,
  inputClassName,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
            'bg-white dark:bg-slate-800',
            'text-slate-900 dark:text-slate-100',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-slate-300 dark:border-slate-600',
            icon && 'pl-10',
            type === 'password' && 'pr-10',
            inputClassName
          )}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        {isFocused && (
          <motion.div
            layoutId="input-focus"
            className="absolute inset-0 rounded-lg border-2 border-primary-500 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-danger-500"
        >
          {error}
        </motion.p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
