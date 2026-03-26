import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import StatCard from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/utils/api';

const COLORS = ['#22c55e', '#ef4444'];
const REFRESH_INTERVAL_MS = 5000;

const TeacherDashboard = () => {
  const [loadingData, setLoadingData] = useState(true);
  const [classData, setClassData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadTeacherDashboard = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const currentUserId = meRes.data.user?.id;

        const teachersRes = await api.get('/teachers');
        const teachers = teachersRes.data.teachers || [];
        const teacherProfile = teachers.find((teacher) => teacher.user?.id === currentUserId);

        if (!teacherProfile) {
          if (!mounted) return;
          setClassData([]);
          setAttendanceRecords([]);
          return;
        }

        const [classesRes, studentsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/students'),
        ]);
        const teacherClasses = (classesRes.data.classes || []).filter((classItem) => classItem.teacher?.id === teacherProfile.id);
        const allStudents = studentsRes.data.students || [];

        const classDepartmentIds = new Set(
          teacherClasses
            .map((classItem) => Number(classItem.department?.id))
            .filter((id) => Number.isFinite(id) && id > 0)
        );

        const scopedStudents = classDepartmentIds.size > 0
          ? allStudents.filter((student) => classDepartmentIds.has(Number(student.departmentId)))
          : allStudents;

        const classIds = teacherClasses.map((classItem) => classItem.id);
        const classIdSet = new Set(classIds);

        const attendanceRes = await api.get('/attendance');
        const allAttendance = (attendanceRes.data.attendance || []).filter((record) => classIdSet.has(record.classId));

        const classRows = teacherClasses.map((classItem) => {
          const classAttendance = allAttendance.filter((record) => record.classId === classItem.id);
          const departmentId = Number(classItem.department?.id);
          const uniqueStudents = Number.isFinite(departmentId) && departmentId > 0
            ? scopedStudents.filter((student) => Number(student.departmentId) === departmentId).length
            : new Set(classAttendance.map((record) => record.studentId)).size;
          const present = classAttendance.filter((record) => record.status === 'present').length;
          const avg = classAttendance.length ? Math.round((present / classAttendance.length) * 100) : 0;

          return {
            id: classItem.id,
            name: classItem.name,
            students: uniqueStudents,
            avgAttendance: avg,
          };
        });

        if (!mounted) return;
        setClassData(classRows);
        setAttendanceRecords(allAttendance);
        setStudentsList(scopedStudents);
        setLastUpdated(new Date());
      } catch {
        if (!mounted) return;
        setClassData([]);
        setAttendanceRecords([]);
        setStudentsList([]);
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    };

    let pollingTimer;

    const startPolling = async () => {
      if (!mounted) return;
      await loadTeacherDashboard();
      if (!mounted) return;
      pollingTimer = setTimeout(startPolling, REFRESH_INTERVAL_MS);
    };

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        loadTeacherDashboard();
      }
    };

    startPolling();
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      mounted = false;
      clearTimeout(pollingTimer);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendanceRecords.filter((record) => record.attendanceDate === todayIso);
  const totalStudents = studentsList.length;
  const presentToday = todayAttendance.filter((record) => record.status === 'present').length;
  const absentToday = todayAttendance.filter((record) => record.status === 'absent').length;
  const avgAttendance = attendanceRecords.length
    ? Math.round((attendanceRecords.filter((record) => record.status === 'present').length / attendanceRecords.length) * 1000) / 10
    : 0;

  const weeklyData = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 4; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      days.push({
        key,
        day: date.toLocaleString('en-US', { weekday: 'short' }),
        present: 0,
        absent: 0,
      });
    }

    const byKey = new Map(days.map((item) => [item.key, item]));
    attendanceRecords.forEach((record) => {
      const entry = byKey.get(record.attendanceDate);
      if (!entry) return;
      if (record.status === 'present') entry.present += 1;
      if (record.status === 'absent') entry.absent += 1;
    });

    return days;
  }, [attendanceRecords]);

  const attendanceData = [
    { name: 'Present', value: presentToday },
    { name: 'Absent', value: absentToday },
  ];

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
          Teacher Dashboard 📊
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your classes and track student attendance from live database data
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
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
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Active Classes"
          value={classData.length}
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
                  {presentToday} ({totalStudents ? Math.round((presentToday / totalStudents) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Absent</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {absentToday} ({totalStudents ? Math.round((absentToday / totalStudents) * 100) : 0}%)
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
                    key={classItem.id}
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
                {classData.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400" colSpan={4}>
                      No classes assigned yet.
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

export default TeacherDashboard;
