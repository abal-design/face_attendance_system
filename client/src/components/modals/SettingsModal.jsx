import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Globe, Bell, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import Button from "../ui/Button";
import Input from "../ui/Input";

const SettingsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    attendance: true,
    announcements: true,
  });

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preferences updated");
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    toast.success("Password changed successfully");

    setPasswords({
      current: "",
      new: "",
      confirm: "",
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-4">

          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Settings
              </h2>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">

              {/* Appearance */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <Palette className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Appearance
                  </h3>
                </div>

                <div className="space-y-4">

                  {/* Dark Mode */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        Dark Mode
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Toggle between light and dark theme
                      </p>
                    </div>

                    <button
                      onClick={toggleTheme}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        theme === "dark"
                          ? "bg-primary-600"
                          : "bg-slate-300"
                      }`}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: theme === "dark" ? 28 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    </button>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Language
                      </div>
                    </label>

                    <select className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Notifications */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-success-500 to-success-600 text-white">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Notification Preferences
                  </h3>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
                    { key: "push", label: "Push Notifications", desc: "Receive browser push notifications" },
                    { key: "attendance", label: "Attendance Alerts", desc: "Get notified about attendance updates" },
                    { key: "announcements", label: "Announcements", desc: "Receive important announcements" },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {label}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleNotificationToggle(key)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          notifications[key]
                            ? "bg-primary-600"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: notifications[key] ? 28 : 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-danger-500 to-danger-600 text-white">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Security
                  </h3>
                </div>

                <div className="space-y-4">

                  {/* Current Password */}
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) =>
                        setPasswords({ ...passwords, current: e.target.value })
                      }
                    />

                    <button
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) =>
                        setPasswords({ ...passwords, new: e.target.value })
                      }
                    />

                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Input
                      label="Confirm New Password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords({ ...passwords, confirm: e.target.value })
                      }
                    />

                    <button
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handlePasswordChange}
                    className="w-full"
                  >
                    Change Password
                  </Button>

                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;