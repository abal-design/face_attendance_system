import { motion } from 'framer-motion';

const Skeleton = ({ className, variant = 'rectangular', width, height }) => {
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded',
  };

  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`bg-slate-200 dark:bg-slate-700 ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard = () => (
  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
    <Skeleton variant="rectangular" className="w-full h-48 mb-4" />
    <Skeleton variant="text" className="w-3/4 h-6 mb-2" />
    <Skeleton variant="text" className="w-1/2 h-4" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <Skeleton key={i} variant="rectangular" className="w-full h-12" />
    ))}
  </div>
);

export default Skeleton;
