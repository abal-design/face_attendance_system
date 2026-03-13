import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';

const Modal = ({ isOpen, onClose, children, title, size = 'md', className }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ pointerEvents: 'auto' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl',
              sizes[size],
              className
            )}
            style={{ pointerEvents: 'auto' }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ModalBody = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className }) => (
  <div className={cn('px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3', className)}>
    {children}
  </div>
);

export default Modal;
