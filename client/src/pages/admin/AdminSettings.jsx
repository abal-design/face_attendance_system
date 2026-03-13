import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save, Globe, Bell, Shield, Database, Eye, EyeOff, Clock, Zap } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';

const AdminSettings = () => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [systemSettings, setSystemSettings] = useState({
    siteName: 'FaceAttend',
    siteUrl: 'https://faceattend.edu',
    adminEmail: 'admin@faceattend.edu',
    supportEmail: 'support@faceattend.edu',
    timezone: 'UTC',
    language: 'en',
  });

  const [attendanceSettings, setAttendanceSettings] = useState({
    autoMarkAbsent: true,
    graceMinutes: 15,
    minimumAttendance: 75,
    notifyThreshold: 70,
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    attendanceAlerts: true,
    systemUpdates: true,
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState('sk_live_****************************abcd');

  const handleSaveSystemSettings = () => {
    toast.success('System settings saved successfully');
  };

  const handleSaveAttendanceSettings = () => {
    toast.success('Attendance settings saved successfully');
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings updated');
  };

  const handleBackupDatabase = () => {
    toast.info('Starting database backup...');
    setTimeout(() => {
      toast.success('Database backup completed successfully');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          System Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure system-wide settings and preferences
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'System Status', value: 'Online', icon: Zap, gradient: 'from-success-500 to-success-700' },
          { label: 'Last Backup', value: '2 days ago', icon: Database, gradient: 'from-warning-500 to-warning-700' },
          { label: 'Uptime', value: '99.9%', icon: Clock, gradient: 'from-primary-500 to-primary-700' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="relative overflow-hidden">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardBody>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              General Settings
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Site Name"
              value={systemSettings.siteName}
              onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
            />
            <Input
              label="Site URL"
              value={systemSettings.siteUrl}
              onChange={(e) => setSystemSettings({ ...systemSettings, siteUrl: e.target.value })}
            />
            <Input
              label="Admin Email"
              type="email"
              value={systemSettings.adminEmail}
              onChange={(e) => setSystemSettings({ ...systemSettings, adminEmail: e.target.value })}
            />
            <Input
              label="Support Email"
              type="email"
              value={systemSettings.supportEmail}
              onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Timezone
              </label>
              <select
                value={systemSettings.timezone}
                onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-slate-900 dark:text-slate-100"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Asia/Kolkata">India Standard Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Language
              </label>
              <select
                value={systemSettings.language}
                onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-slate-900 dark:text-slate-100"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleSaveSystemSettings} icon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Attendance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Attendance Settings
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">Auto Mark Absent</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Automatically mark students absent if not present
                </p>
              </div>
              <button
                onClick={() => setAttendanceSettings({ ...attendanceSettings, autoMarkAbsent: !attendanceSettings.autoMarkAbsent })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  attendanceSettings.autoMarkAbsent ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: attendanceSettings.autoMarkAbsent ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Grace Period (minutes)"
                type="number"
                value={attendanceSettings.graceMinutes}
                onChange={(e) => setAttendanceSettings({ ...attendanceSettings, graceMinutes: e.target.value })}
              />
              <Input
                label="Minimum Attendance (%)"
                type="number"
                value={attendanceSettings.minimumAttendance}
                onChange={(e) => setAttendanceSettings({ ...attendanceSettings, minimumAttendance: e.target.value })}
              />
              <Input
                label="Alert Threshold (%)"
                type="number"
                value={attendanceSettings.notifyThreshold}
                onChange={(e) => setAttendanceSettings({ ...attendanceSettings, notifyThreshold: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleSaveAttendanceSettings} icon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notification Settings
            </h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send notifications via email' },
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Send push notifications to browsers' },
            { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Send notifications via SMS' },
            { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Alert for low attendance' },
            { key: 'systemUpdates', label: 'System Updates', desc: 'Notify about system updates' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">{label}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
              <button
                onClick={() => handleNotificationToggle(key)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  notifications[key] ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
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

      {/* Security & API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Security & API
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="w-full px-4 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button variant="secondary">
              Regenerate API Key
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Database & Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Database & Backup
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                Database Backup
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Last backup: 2 days ago
              </p>
            </div>
            <Button variant="primary" onClick={handleBackupDatabase}>
              Backup Now
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminSettings;
