import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
