import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <motion.div
        animate={{
          marginLeft: sidebarOpen ? 280 : 80,
        }}
        className="transition-all duration-300"
      >
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;
