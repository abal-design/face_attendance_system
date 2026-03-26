import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Award,
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import StatCard from '@/components/dashboard/StatCard';
import Progress from '@/components/ui/Progress';
import Badge from '@/components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const formatDateOnly = (dateText) => {
  if (!dateText) return '-';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return String(dateText);
  return date.toLocaleDateString();
};

const formatTimeOnly = (dateText) => {
  if (!dateText) return '-';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadStudentData = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const currentUserId = meRes.data.user?.id;

        const studentsRes = await api.get('/students');
        const students = studentsRes.data.students || [];
        const student = students.find((entry) => entry.user?.id === currentUserId) || null;

        if (!mounted) return;
        setStudentProfile(student);

        if (student?.id) {
          const attendanceRes = await api.get('/attendance', {
            params: { studentId: student.id },
          });

          if (!mounted) return;
          setAttendanceRecords(attendanceRes.data.attendance || []);
        } else {
          setAttendanceRecords([]);
        }
      } catch {
        if (!mounted) return;
        setAttendanceRecords([]);
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    };

    loadStudentData();
    const intervalId = setInterval(loadStudentData, 20000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const recentClasses = useMemo(
    () =>
      attendanceRecords.slice(0, 5).map((record) => ({
        id: record.id,
        subject: record.class?.name || record.class?.code || 'Class',
        date: formatDateOnly(record.attendanceDate),
        time: formatTimeOnly(record.markedAt),
        status: String(record.status || 'absent').toLowerCase(),
        teacher: record.markedBy || 'System',
      })),
    [attendanceRecords]
  );

  const totalClasses = attendanceRecords.length;
  const attendedClasses = attendanceRecords.filter((record) => record.status === 'present').length;
  const absentClasses = attendanceRecords.filter((record) => record.status === 'absent').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  const attendanceData = useMemo(() => {
    const now = new Date();
    const buckets = [];

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        key,
        month: d.toLocaleString('en-US', { month: 'short' }),
        present: 0,
        total: 0,
      });
    }

    const byKey = new Map(buckets.map((item) => [item.key, item]));

    attendanceRecords.forEach((record) => {
      const d = new Date(record.attendanceDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byKey.get(key);
      if (!bucket) return;

      bucket.total += 1;
      if (record.status === 'present') bucket.present += 1;
    });

    return buckets.map((item) => ({
      month: item.month,
      attendance: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
    }));
  }, [attendanceRecords]);

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome back, {user?.name || 'Student'}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Department: {studentProfile?.department?.name || 'Not assigned'} • Live attendance synced from database.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Attendance"
          value={`${attendancePercentage}%`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Classes Attended"
          value={attendedClasses}
          icon={CheckCircle2}
          color="primary"
        />
        <StatCard
          title="Total Classes"
          value={totalClasses}
          icon={Calendar}
          color="warning"
        />
        <StatCard
          title="Absent Days"
          value={absentClasses}
          icon={XCircle}
          color="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Attendance Trend
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Last 6 months from database records</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAttendance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Monthly performance */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Monthly Performance
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - attendancePercentage / 100) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="text-primary-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {attendancePercentage}%
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    This Month
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Present</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {attendedClasses} classes
                  </span>
                </div>
                <Progress value={attendedClasses} max={totalClasses} variant="success" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Absent</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {absentClasses} classes
                  </span>
                </div>
                <Progress value={absentClasses} max={totalClasses} variant="danger" />
              </div>
            </div>

            {attendancePercentage >= 90 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg"
              >
                <Award className="w-5 h-5 text-success-600 dark:text-success-400" />
                <p className="text-sm font-medium text-success-700 dark:text-success-400">
                  Excellent Attendance!
                </p>
              </motion.div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent classes */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Recent Classes
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentClasses.map((classItem, index) => (
                  <motion.tr
                    key={classItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {classItem.subject}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {classItem.teacher}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{classItem.date}</span>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{classItem.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={classItem.status === 'present' ? 'success' : 'danger'}
                        className="capitalize"
                      >
                        {classItem.status}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
                {recentClasses.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400" colSpan={4}>
                      No attendance records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default StudentDashboard;
