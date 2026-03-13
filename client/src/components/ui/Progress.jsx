import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';

const Progress = ({ value = 0, max = 100, size = 'md', variant = 'primary', showLabel = false, className }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden', sizes[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', variants[variant])}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
};

export default Progress;
