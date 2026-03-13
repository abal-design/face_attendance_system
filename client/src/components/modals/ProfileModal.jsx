import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useToast } from "@/contexts/ToastContext";

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [isEditMode, setIsEditMode] = useState(false);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const [profile, setProfile] = useState({
    name:
      user?.role === "student"
        ? "Alex Johnson"
        : user?.role === "teacher"
        ? "Dr. Michael Chen"
        : "Sarah Admin",
    email: user?.email || "user@faceattend.edu",
    phone: "+1 (555) 123-4567",
    department:
      user?.role === "student" ? "Computer Science" : "Administration",
    year: user?.role === "student" ? "3rd Year" : "",

    dateOfBirth: "1998-05-15",
    address: "123 University Ave, Campus City, CC 12345",
  });

  const handleSave = () => {
    setIsEditMode(false);
    toast.success("Profile updated successfully");
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
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                My Profile
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

              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={user?.avatar}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full border-4 border-primary-100 dark:border-primary-900 object-cover"
                  />

                  <button className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {profile.name}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {user?.role}
                </p>
              </div>

              {/* Personal Information */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Personal Information
                  </h3>

                  {!isEditMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Input
                    label="Full Name"
                    value={profile.name}
                    icon={<GraduationCap className="w-5 h-5" />}
                    disabled={!isEditMode}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    icon={<Mail className="w-5 h-5" />}
                    disabled={!isEditMode}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />

                  <Input
                    label="Phone Number"
                    value={profile.phone}
                    icon={<Phone className="w-5 h-5" />}
                    disabled={!isEditMode}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                  />

                  <Input
                    label="Date of Birth"
                    type="date"
                    value={profile.dateOfBirth}
                    icon={<Calendar className="w-5 h-5" />}
                    disabled={!isEditMode}
                    onChange={(e) =>
                      setProfile({ ...profile, dateOfBirth: e.target.value })
                    }
                  />

                  <Input
                    label="Department"
                    value={profile.department}
                    disabled={!isEditMode}
                    onChange={(e) =>
                      setProfile({ ...profile, department: e.target.value })
                    }
                  />

                  {user?.role === "student" && (
                    <Input
                      label="Year"
                      value={profile.year}
                      disabled={!isEditMode}
                      onChange={(e) =>
                          setProfile({ ...profile, year: e.target.value })
                        }
                      />
                  )}

                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      value={profile.address}
                      icon={<MapPin className="w-5 h-5" />}
                      disabled={!isEditMode}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Academic Performance */}
              {user?.role === "student" && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Academic Performance
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "CGPA", value: "8.5", icon: Award, gradient: "from-primary-500 to-primary-600" },
                      { label: "Attendance", value: "92%", icon: Calendar, gradient: "from-success-500 to-success-600" },
                      { label: "Credits", value: "120", icon: GraduationCap, gradient: "from-warning-500 to-warning-600" },
                      { label: "Rank", value: "#12", icon: Award, gradient: "from-purple-500 to-purple-600" },
                    ].map((stat) => {
                      const Icon = stat.icon;

                      return (
                        <div
                          key={stat.label}
                          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} text-white w-fit mb-2`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {stat.value}
                          </p>

                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {stat.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {isEditMode && (
              <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <Button
                  variant="ghost"
                  onClick={() => setIsEditMode(false)}
                >
                  Cancel
                </Button>

                <Button variant="primary" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;