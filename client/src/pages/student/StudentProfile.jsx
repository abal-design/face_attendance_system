import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Camera, Edit2, Save, Award, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const StudentProfile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+1 234 567 8900',
    address: '123 Campus Drive, University City',
    department: 'Computer Science',
    year: '3rd Year',
    semester: '6th Semester',
    bloodGroup: 'O+',
    dateOfBirth: '2002-05-15',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    updateUser({ name: formData.name, email: formData.email });
    setEditing(false);
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          My Profile 👤
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          View and manage your personal information
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="lg:col-span-1 overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-primary-500 to-primary-700 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
          </div>
          <CardBody className="text-center -mt-12 relative">
            <div className="relative inline-block">
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-white dark:border-slate-800 shadow-lg"
              />
              <button className="absolute bottom-3 right-0 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {formData.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{formData.email}</p>
            <Badge variant="primary" className="mb-4">{formData.department}</Badge>
            
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">
                  {formData.year} - {formData.semester}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">{formData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">{formData.phone}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Details card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Personal Information
              </h2>
              {!editing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(true)}
                  icon={<Edit2 className="w-4 h-4" />}
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
                icon={<User className="w-5 h-5" />}
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                icon={<Mail className="w-5 h-5" />}
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
                icon={<Phone className="w-5 h-5" />}
              />
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={!editing}
                icon={<Calendar className="w-5 h-5" />}
              />
              <Input
                label="Department"
                name="department"
                value={formData.department}
                disabled
              />
              <Input
                label="Year"
                name="year"
                value={formData.year}
                disabled
              />
              <Input
                label="Semester"
                name="semester"
                value={formData.semester}
                disabled
              />
              <Input
                label="Blood Group"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                disabled={!editing}
              />
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                icon={<MapPin className="w-5 h-5" />}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Academic Performance */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Academic Performance
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'CGPA', value: '8.5', icon: Award, gradient: 'from-primary-500 to-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
              { label: 'Attendance', value: '92%', icon: TrendingUp, gradient: 'from-success-500 to-success-600', bg: 'bg-success-50 dark:bg-success-900/20' },
              { label: 'Credits', value: '135', icon: BookOpen, gradient: 'from-warning-500 to-warning-600', bg: 'bg-warning-50 dark:bg-warning-900/20' },
              { label: 'Rank', value: '12th', icon: Trophy, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`relative overflow-hidden p-5 rounded-xl ${stat.bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default StudentProfile;
