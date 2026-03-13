import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className,
  onClick,
  type = 'button',
  ...props
}) => {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50',
    secondary: 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white shadow-lg shadow-danger-500/30 hover:shadow-danger-500/50',
    success: 'bg-success-600 hover:bg-success-700 text-white shadow-lg shadow-success-500/30 hover:shadow-success-500/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-200 focus-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="w-5 h-5">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
