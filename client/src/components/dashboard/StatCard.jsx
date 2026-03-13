import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/helpers';

const StatCard = ({ title, value, change, icon: Icon, trend, color = 'primary' }) => {
  const colors = {
    primary: 'from-primary-500 to-primary-700',
    success: 'from-success-500 to-success-700',
    warning: 'from-warning-500 to-warning-700',
    danger: 'from-danger-500 to-danger-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 overflow-hidden group"
    >
      {/* Gradient background */}
      <div className={cn('absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500', colors[color])} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {value}
            </p>
          </div>
          <div className={cn('p-3 rounded-lg bg-gradient-to-br', colors[color])}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', trend === 'up' ? 'text-success-600' : 'text-danger-600')}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{change}% from last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
