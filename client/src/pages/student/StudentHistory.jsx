import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, Filter, Download, Search, TrendingUp, CalendarRange } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Progress from '@/components/ui/Progress';
import { formatDate } from '@/utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/utils/api';

const StudentHistory = () => {
  const [loadingData, setLoadingData] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState('all'); // all, week, month, semester
  const itemsPerPage = 10;

  useEffect(() => {
    let mounted = true;

    const loadHistoryData = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const currentUserId = meRes.data.user?.id;

        const studentsRes = await api.get('/students');
        const students = studentsRes.data.students || [];
        const student = students.find((entry) => entry.user?.id === currentUserId) || null;

        if (!mounted) return;
        setStudentProfile(student);

        if (!student?.id) {
          setAttendanceHistory([]);
          return;
        }

        const attendanceRes = await api.get('/attendance', {
          params: { studentId: student.id },
        });
        const records = attendanceRes.data.attendance || [];

        if (!mounted) return;
        setAttendanceHistory(records);
      } catch {
        if (!mounted) return;
        setAttendanceHistory([]);
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    };

    loadHistoryData();
    const intervalId = setInterval(loadHistoryData, 20000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const filteredByDateRange = useMemo(() => {
    const now = new Date();
    const daysByRange = {
      week: 7,
      month: 30,
      semester: 180,
    };

    if (dateRange === 'all') return attendanceHistory;

    const rangeDays = daysByRange[dateRange] || null;
    if (!rangeDays) return attendanceHistory;

    const from = new Date(now);
    from.setDate(now.getDate() - rangeDays);

    return attendanceHistory.filter((record) => {
      const date = new Date(record.attendanceDate);
      return !Number.isNaN(date.getTime()) && date >= from;
    });
  }, [attendanceHistory, dateRange]);
  
  const filteredData = filteredByDateRange.filter((record) => {
    const subject = (record.class?.name || record.class?.code || '').toLowerCase();
    const matchesSearch = subject.includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: filteredByDateRange.length,
    present: filteredByDateRange.filter((r) => r.status === 'present').length,
    absent: filteredByDateRange.filter((r) => r.status === 'absent').length,
  };

  const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  const monthlyData = useMemo(() => {
    const now = new Date();
    const buckets = [];

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        key,
        month: d.toLocaleString('en-US', { month: 'short' }),
        present: 0,
        absent: 0,
      });
    }

    const byKey = new Map(buckets.map((item) => [item.key, item]));

    filteredByDateRange.forEach((record) => {
      const d = new Date(record.attendanceDate);
      if (Number.isNaN(d.getTime())) return;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byKey.get(key);
      if (!bucket) return;

      if (record.status === 'present') {
        bucket.present += 1;
      } else {
        bucket.absent += 1;
      }
    });

    return buckets;
  }, [filteredByDateRange]);

  const subjectWiseData = useMemo(() => {
    const bySubject = new Map();

    filteredByDateRange.forEach((record) => {
      const subject = record.class?.name || record.class?.code || 'Unknown Class';
      const current = bySubject.get(subject) || { subject, present: 0, total: 0 };
      current.total += 1;
      if (record.status === 'present') current.present += 1;
      bySubject.set(subject, current);
    });

    return Array.from(bySubject.values())
      .map((item) => ({
        subject: item.subject,
        attendance: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 6);
  }, [filteredByDateRange]);

  const pieData = [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
  ];

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          Attendance History
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Department: {studentProfile?.department?.name || 'Not assigned'} • Live records from database
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Classes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-success-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Present</p>
                <p className="text-2xl font-bold text-success-600">{stats.present}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-danger-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Absent</p>
                <p className="text-2xl font-bold text-danger-600">{stats.absent}</p>
              </div>
              <XCircle className="w-8 h-8 text-danger-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-warning-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Attendance %</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{attendancePercentage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Monthly Attendance Trend
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Present vs Absent over the last 6 months
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
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
                <Bar dataKey="present" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Overall Distribution
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Subject-wise Attendance
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {subjectWiseData.map((subject, index) => (
            <motion.div
              key={subject.subject}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">{subject.subject}</span>
                <span className="text-slate-600 dark:text-slate-400">{subject.attendance}%</span>
              </div>
              <Progress 
                value={subject.attendance} 
                max={100} 
                variant={subject.attendance >= 90 ? 'success' : subject.attendance >= 75 ? 'warning' : 'danger'}
              />
            </motion.div>
          ))}
        </CardBody>
      </Card>

      {/* Filters and search */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Input
                placeholder="Search by subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                className="md:w-80"
              />
              <div className="flex gap-2 items-center flex-wrap">
                <CalendarRange className="w-5 h-5 text-slate-400" />
                <div className="flex gap-2">
                  {['all', 'week', 'month', 'semester'].map((range) => (
                    <Button
                      key={range}
                      variant={dateRange === range ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setDateRange(range)}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 items-center">
                <Filter className="w-5 h-5 text-slate-400" />
                <div className="flex gap-2">
                  {['all', 'present', 'absent'].map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
                Export Report
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Detailed Records
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View all your past attendance records
          </p>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Marked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedData.map((record, index) => (
                  <motion.tr
                    key={`${record.id}-${record.attendanceDate}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {formatDate(record.attendanceDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {record.class?.name || record.class?.code || 'Class'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {record.markedAt ? new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={record.status === 'present' ? 'success' : 'danger'} className="capitalize">
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {record.markedBy || 'System'}
                    </td>
                  </motion.tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400" colSpan={5}>
                      No attendance records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
