import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Lock, Eye, EyeOff, Palette, Globe } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';

const TeacherSettings = () => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    classReminders: true,
    studentAbsence: true,
  });

  const [profile, setProfile] = useState({
    name: 'Dr. Michael Chen',
    email: 'michael.chen@university.edu',
    phone: '+1 (555) 123-4567',
    department: 'Computer Science',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification preferences updated');
  };

  const handleProfileUpdate = () => {
    toast.success('Profile updated successfully');
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password changed successfully');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          Settings ⚙️
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account settings and preferences
        </p>
      </motion.div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Profile Information
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Update your personal details</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
            <Input
              label="Department"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleProfileUpdate}>
              Save Changes
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Appearance
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Customize the look and feel</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                Dark Mode
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Toggle between light and dark theme
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`
                relative w-14 h-7 rounded-full transition-colors
                ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-300'}
              `}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                animate={{ x: theme === 'dark' ? 28 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language
              </div>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>English (US)</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
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
                Notification Preferences
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Control how you receive alerts</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
            { key: 'push', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
            { key: 'classReminders', label: 'Class Reminders', desc: 'Get reminders before classes start' },
            { key: 'studentAbsence', label: 'Student Absence Alerts', desc: 'Notify when students are absent' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">{label}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
              <button
                onClick={() => handleNotificationToggle(key)}
                className={`
                  relative w-14 h-7 rounded-full transition-colors
                  ${notifications[key] ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}
                `}
              >
                <motion.div
                  className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: notifications[key] ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 text-white shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Security
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Manage your password</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handlePasswordChange}>
              Change Password
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TeacherSettings;
