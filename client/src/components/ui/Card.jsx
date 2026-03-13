import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';

const Card = ({
  children,
  className,
  hover = false,
  glass = false,
  gradient = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border',
        glass
          ? 'glass border-white/20 dark:border-slate-700/50'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        gradient && 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className, ...props }) => (
  <div className={cn('p-6 border-b border-slate-200 dark:border-slate-700', className)} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className, ...props }) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }) => (
  <div className={cn('p-6 border-t border-slate-200 dark:border-slate-700', className)} {...props}>
    {children}
  </div>
);

export default Card;
