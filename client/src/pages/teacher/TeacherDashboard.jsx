import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Clock,
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import StatCard from '@/components/dashboard/StatCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const weeklyData = [
  { day: 'Mon', present: 45, absent: 5 },
  { day: 'Tue', present: 42, absent: 8 },
  { day: 'Wed', present: 48, absent: 2 },
  { day: 'Thu', present: 46, absent: 4 },
  { day: 'Fri', present: 44, absent: 6 },
];

const classData = [
  { name: 'Computer Science', students: 50, avgAttendance: 92 },
  { name: 'Mathematics', students: 45, avgAttendance: 88 },
  { name: 'Physics', students: 48, avgAttendance: 85 },
];

const COLORS = ['#22c55e', '#ef4444'];

const TeacherDashboard = () => {
  const totalStudents = 143;
  const presentToday = 128;
  const absentToday = 15;
  const avgAttendance = 89.5;

  const attendanceData = [
    { name: 'Present', value: presentToday },
    { name: 'Absent', value: absentToday },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          Teacher Dashboard 📊
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your classes and track student attendance
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          change={5.2}
          trend="up"
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          change={2.1}
          trend="up"
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Active Classes"
          value={3}
          icon={BookOpen}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Weekly Attendance Overview
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="present" fill="#22c55e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Today's attendance */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Today's Attendance
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Present</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {presentToday} ({Math.round((presentToday / totalStudents) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Absent</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {absentToday} ({Math.round((absentToday / totalStudents) * 100)}%)
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Classes table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            My Classes
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Class Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Total Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Avg Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {classData.map((classItem, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {classItem.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 dark:text-slate-400">
                        {classItem.students}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[200px]">
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${classItem.avgAttendance}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-success-500 to-success-600"
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {classItem.avgAttendance}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
