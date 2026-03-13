import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Lock, Globe, Eye, Mail, Shield, Sun, Moon } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';

const StudentSettings = () => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    attendance: true,
    announcements: true,
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleNotificationToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    toast.success('Notification settings updated');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password changed successfully');
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          Settings ⚙️
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Appearance
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Customize how the app looks
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Theme</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Current: {theme === 'dark' ? 'Dark' : 'Light'} Mode
                </p>
              </div>
              <Button onClick={toggleTheme} variant="ghost" icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Language</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">English (US)</p>
              </div>
              <Button variant="ghost" icon={<Globe className="w-4 h-4" />}>
                Change
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-success-500 to-success-600 text-white shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Notifications
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage notification preferences
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                    {key} Notifications
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Receive {key} notifications
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(key)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                    ${value ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}
                  `}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`
                      inline-block h-4 w-4 rounded-full bg-white shadow-sm
                      ${value ? 'ml-6' : 'ml-1'}
                    `}
                  />
                </button>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Security */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 text-white shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Security
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Change your password
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                helperText="Minimum 6 characters"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <Button type="submit" icon={<Shield className="w-4 h-4" />}>
                Update Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default StudentSettings;
