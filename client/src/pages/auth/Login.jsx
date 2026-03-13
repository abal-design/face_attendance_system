import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Camera, Shield, Users, GraduationCap, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login successful!');
        const role = result.user.role;
        navigate(`/${role}/dashboard`);
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role) => {
    const emails = {
      admin: 'admin@faceattend.com',
      teacher: 'teacher@faceattend.com',
      student: 'student@faceattend.com',
    };
    setEmail(emails[role]);
    setPassword('password123');
  };

  const roleIcons = {
    admin: <Shield className="w-4 h-4" />,
    teacher: <GraduationCap className="w-4 h-4" />,
    student: <Users className="w-4 h-4" />,
  };

  const features = [
    { icon: <Camera className="w-5 h-5" />, text: 'AI Face Recognition' },
    { icon: <Sparkles className="w-5 h-5" />, text: 'Real-time Tracking' },
    { icon: <Shield className="w-5 h-5" />, text: 'Secure & Private' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex">
      {/* Animated background elements */}
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
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-400/10 dark:bg-violet-600/5 rounded-full blur-3xl"
        />
      </div>

      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
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
              Attendance made
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">
                effortless.
              </span>
            </h2>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              Streamline your attendance workflow with AI-powered face recognition. Fast, accurate, and completely hands-free.
            </p>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    {feature.icon}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-[440px]"
        >
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xl shadow-primary-500/30 mb-4"
            >
              <Camera className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">FaceAttend</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">AI-Powered Attendance</p>
          </div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 p-8 sm:p-10 border border-slate-200/60 dark:border-slate-700/60"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="w-5 h-5" />}
                required
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  icon={<Lock className="w-5 h-5" />}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 focus:ring-offset-0" />
                  <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full !py-3 text-base"
                icon={<LogIn className="w-5 h-5" />}
              >
                Sign in
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium">
                  Quick access
                </span>
              </div>
            </div>

            {/* Quick login buttons */}
            <div className="grid grid-cols-3 gap-2">
              {['admin', 'teacher', 'student'].map((role) => (
                <motion.button
                  key={role}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => quickLogin(role)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all group"
                >
                  <span className="text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {roleIcons[role]}
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{role}</span>
                </motion.button>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1 transition-colors">
                Sign up <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </motion.div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} FaceAttend. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
