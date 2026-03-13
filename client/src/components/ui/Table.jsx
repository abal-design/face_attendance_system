import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';
import Skeleton from './Skeleton';

const Table = ({ children, className }) => (
  <div className="w-full overflow-x-auto scrollbar-thin">
    <table className={cn('w-full border-collapse', className)}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className }) => (
  <thead className={cn('bg-slate-50 dark:bg-slate-800/50', className)}>
    {children}
  </thead>
);

export const TableBody = ({ children, loading, rows = 5 }) => {
  if (loading) {
    return (
      <tbody>
        {[...Array(rows)].map((_, i) => (
          <tr key={i}>
            <td colSpan="100%" className="p-4">
              <Skeleton variant="rectangular" className="w-full h-12" />
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  return <tbody>{children}</tbody>;
};

export const TableRow = ({ children, className, hover = true }) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn(
      'border-b border-slate-200 dark:border-slate-700 transition-colors',
      hover && 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
      className
    )}
  >
    {children}
  </motion.tr>
);

export const TableHead = ({ children, className }) => (
  <th
    className={cn(
      'px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider',
      className
    )}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className }) => (
  <td className={cn('px-4 py-4 text-sm text-slate-900 dark:text-slate-100', className)}>
    {children}
  </td>
);

export default Table;
