import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const Pagination = ({ currentPage, totalPages, onPageChange, className }) => {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        icon={<ChevronLeft className="w-4 h-4" />}
      >
        Previous
      </Button>

      <div className="flex gap-1">
        {startPage > 1 && (
          <>
            <PageButton page={1} currentPage={currentPage} onPageChange={onPageChange} />
            {startPage > 2 && <span className="px-2 py-1">...</span>}
          </>
        )}

        {pages.map(page => (
          <PageButton key={page} page={page} currentPage={currentPage} onPageChange={onPageChange} />
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 py-1">...</span>}
            <PageButton page={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        icon={<ChevronRight className="w-4 h-4" />}
      >
        Next
      </Button>
    </div>
  );
};

const PageButton = ({ page, currentPage, onPageChange }) => {
  const isActive = page === currentPage;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onPageChange(page)}
      className={`
        px-3 py-1 rounded-lg text-sm font-medium transition-all
        ${isActive
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        }
      `}
    >
      {page}
    </motion.button>
  );
};

export default Pagination;
