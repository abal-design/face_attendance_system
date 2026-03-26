import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Camera, UserPlus, Shield, GraduationCap, Users, CheckCircle2, Circle, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-green-500' },
    ];
    const idx = Math.min(score, 5) - 1;
    return idx >= 0 ? { score, ...levels[idx] } : { score: 0, label: '', color: '' };
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        toast.success('Registration successful!');

        const delivery = result.emailDelivery;
        if (delivery?.attempted) {
          if (delivery.sent) {
            toast.success('Credentials email sent successfully.');
          } else {
            toast.warning(`Account created, but email failed: ${delivery.error || 'Unknown SMTP error'}`);
          }
        } else {
          toast.info('Account created. Email service is not configured in server env.');
        }

        navigate(`/${result.user.role}/dashboard`);
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student', label: 'Student', icon: <Users className="w-5 h-5" />, desc: 'Track your attendance' },
    { value: 'teacher', label: 'Teacher', icon: <GraduationCap className="w-5 h-5" />, desc: 'Manage your classes' },
    { value: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" />, desc: 'Full system control' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary-400/15 dark:bg-primary-600/8 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.15, 1, 1.15], x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-400/15 dark:bg-blue-600/8 rounded-full blur-3xl"
        />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">FaceAttend</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Smart Attendance System</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight mb-6">
              Get started
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">
                in seconds.
              </span>
            </h2>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              Create your free account and experience the future of attendance management with AI-powered face recognition.
            </p>

            <div className="space-y-3">
              {['No credit card required', 'Instant setup', 'Free for students'].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="text-center mb-6 lg:hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xl shadow-primary-500/30 mb-4"
            >
              <Camera className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">FaceAttend</h1>
          </div>

          {/* Register card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 p-8 sm:p-10 border border-slate-200/60 dark:border-slate-700/60"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                icon={<User className="w-5 h-5" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                icon={<Mail className="w-5 h-5" />}
                required
              />

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <motion.button
                      key={role.value}
                      type="button"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, role: role.value })}
                      className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
                        formData.role === role.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm shadow-primary-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={`transition-colors ${formData.role === role.value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {role.icon}
                      </span>
                      <span className={`text-xs font-semibold transition-colors ${formData.role === role.value ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        {role.label}
                      </span>
                      <span className={`text-[10px] transition-colors ${formData.role === role.value ? 'text-primary-500 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {role.desc}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  icon={<Lock className="w-5 h-5" />}
                  required
                />
                {/* Password strength */}
                <AnimatePresence>
                  {formData.password && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{passwordStrength.label}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                icon={<Lock className="w-5 h-5" />}
                required
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full !py-3 text-base"
                icon={<UserPlus className="w-5 h-5" />}
              >
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Sign in
              </Link>
            </p>
          </motion.div>

          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} AbalBohara. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
