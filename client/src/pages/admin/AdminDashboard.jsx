import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Building2,
  Calendar,
  Award,
  Activity,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  FileText,
} from 'lucide-react';
import api from '@/utils/api';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import StatCard from '@/components/dashboard/StatCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const DEPT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];

const relativeTime = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'just now';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const AdminDashboard = () => {
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({ students: 0, teachers: 0, departments: 0, classes: 0, attendanceToday: 0 });
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        const [statsRes, studentsRes, teachersRes, attendanceRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/students'),
          api.get('/teachers'),
          api.get('/attendance'),
        ]);

        if (!mounted) return;

        setStats(statsRes.data.stats || {});
        setStudents(studentsRes.data.students || []);
        setTeachers(teachersRes.data.teachers || []);
        setAttendanceRecords(attendanceRes.data.attendance || []);
      } catch {
        if (!mounted) return;
        setStudents([]);
        setTeachers([]);
        setAttendanceRecords([]);
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    };

    loadDashboardData();
    const intervalId = setInterval(loadDashboardData, 20000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const totalStudents = stats.students;
  const totalTeachers = stats.teachers;
  const totalDepartments = stats.departments;
  const avgAttendance = attendanceRecords.length
    ? Math.round((attendanceRecords.filter((record) => record.status === 'present').length / attendanceRecords.length) * 1000) / 10
    : 0;

  const monthlyData = useMemo(() => {
    const now = new Date();
    const buckets = [];

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        key,
        month: d.toLocaleString('en-US', { month: 'short' }),
        students: 0,
        teachers: 0,
        present: 0,
        totalAttendance: 0,
      });
    }

    const byKey = new Map(buckets.map((item) => [item.key, item]));

    students.forEach((student) => {
      const d = new Date(student.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.students += 1;
    });

    teachers.forEach((teacher) => {
      const d = new Date(teacher.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.teachers += 1;
    });

    attendanceRecords.forEach((record) => {
      const d = new Date(record.attendanceDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byKey.get(key);
      if (!bucket) return;
      bucket.totalAttendance += 1;
      if (record.status === 'present') bucket.present += 1;
    });

    let runningStudents = 0;
    let runningTeachers = 0;

    return buckets.map((item) => {
      runningStudents += item.students;
      runningTeachers += item.teachers;
      return {
        month: item.month,
        students: runningStudents,
        teachers: runningTeachers,
        attendance: item.totalAttendance ? Math.round((item.present / item.totalAttendance) * 100) : 0,
      };
    });
  }, [attendanceRecords, students, teachers]);

  const departmentData = useMemo(() => {
    const counts = new Map();
    students.forEach((student) => {
      const name = student.department?.name || 'Unassigned';
      counts.set(name, (counts.get(name) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value], index) => ({ name, value, color: DEPT_COLORS[index % DEPT_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [students]);

  const recentActivities = useMemo(() => {
    const items = [
      ...students.slice(0, 3).map((student) => ({
        id: `student-${student.id}`,
        action: 'New student registered',
        user: student.user?.name || student.studentId || 'Student',
        time: relativeTime(student.createdAt),
        type: 'info',
        icon: UserPlus,
        date: new Date(student.createdAt).getTime() || 0,
      })),
      ...teachers.slice(0, 2).map((teacher) => ({
        id: `teacher-${teacher.id}`,
        action: 'New teacher added',
        user: teacher.user?.name || teacher.teacherId || 'Teacher',
        time: relativeTime(teacher.createdAt),
        type: 'success',
        icon: GraduationCap,
        date: new Date(teacher.createdAt).getTime() || 0,
      })),
      ...attendanceRecords.slice(0, 2).map((record) => ({
        id: `attendance-${record.id}`,
        action: 'Attendance marked',
        user: record.markedBy || 'System',
        time: relativeTime(record.markedAt || record.createdAt),
        type: record.status === 'present' ? 'success' : 'warning',
        icon: record.status === 'present' ? CheckCircle2 : AlertCircle,
        date: new Date(record.markedAt || record.createdAt).getTime() || 0,
      })),
    ];

    return items.sort((a, b) => b.date - a.date).slice(0, 6);
  }, [attendanceRecords, students, teachers]);

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          Admin Dashboard 
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          System overview and analytics from live database data
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={totalStudents}
          change={6.5}
          trend="up"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Teachers"
          value={totalTeachers}
          change={2.3}
          trend="up"
          icon={GraduationCap}
          color="success"
        />
        <StatCard
          title="Departments"
          value={totalDepartments}
          icon={Building2}
          color="warning"
        />
        <StatCard
          title="Avg Attendance"
          value={`${avgAttendance}%`}
          change={3.8}
          trend="up"
          icon={TrendingUp}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Growth & Attendance Trends
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              6-month overview based on database records
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="students"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorStudents)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="attendance"
                  stroke="#22c55e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAttendance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Department distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Department Distribution
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {departmentData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {dept.name}
                    </span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {dept.value}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Recent Activities
              </h2>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Activity className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                const colorMap = {
                  success: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
                  warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
                  info: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
                };
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[activity.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {activity.action}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          by {activity.user}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quick Stats
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                  Active Sessions Today
                </span>
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-2xl font-bold text-primary-900 dark:text-primary-300">
                {stats.attendanceToday || 0} Sessions
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-500 mt-1">
                Across all departments
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-900/10 rounded-lg border border-success-200 dark:border-success-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-success-700 dark:text-success-400">
                  System Performance
                </span>
                <Award className="w-5 h-5 text-success-600 dark:text-success-400" />
              </div>
              <p className="text-2xl font-bold text-success-900 dark:text-success-300">
                {avgAttendance >= 90 ? 'Excellent' : avgAttendance >= 75 ? 'Good' : 'Needs Attention'}
              </p>
              <div className="mt-2">
                <div className="h-2 bg-success-200 dark:bg-success-900/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, avgAttendance))}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-success-600"
                  />
                </div>
                <p className="text-xs text-success-600 dark:text-success-500 mt-1">
                  {avgAttendance}% attendance quality
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-900/10 rounded-lg border border-warning-200 dark:border-warning-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-warning-700 dark:text-warning-400">
                  Pending Actions
                </span>
                <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              </div>
              <p className="text-2xl font-bold text-warning-900 dark:text-warning-300">
                {Math.max(0, stats.students - (stats.attendanceToday || 0))} Items
              </p>
              <p className="text-xs text-warning-600 dark:text-warning-500 mt-1">
                Require your attention
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
