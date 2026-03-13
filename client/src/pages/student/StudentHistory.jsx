import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, Filter, Download, Search, TrendingUp, CalendarRange } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Progress from '@/components/ui/Progress';
import { generateAttendanceHistory } from '@/utils/mockData';
import { formatDate } from '@/utils/helpers';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StudentHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState('all'); // all, week, month, semester
  const itemsPerPage = 10;

  const attendanceHistory = generateAttendanceHistory(1);
  
  const filteredData = attendanceHistory.filter(record => {
    const matchesSearch = record.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: attendanceHistory.length,
    present: attendanceHistory.filter(r => r.status === 'present').length,
    absent: attendanceHistory.filter(r => r.status === 'absent').length,
  };

  const attendancePercentage = Math.round((stats.present / stats.total) * 100);

  // Mock data for charts
  const monthlyData = [
    { month: 'Sep', present: 18, absent: 2 },
    { month: 'Oct', present: 20, absent: 1 },
    { month: 'Nov', present: 17, absent: 3 },
    { month: 'Dec', present: 19, absent: 1 },
    { month: 'Jan', present: 21, absent: 0 },
    { month: 'Feb', present: 18, absent: 2 },
  ];

  const subjectWiseData = [
    { subject: 'Computer Science', attendance: 95 },
    { subject: 'Mathematics', attendance: 92 },
    { subject: 'Physics', attendance: 88 },
    { subject: 'Chemistry', attendance: 90 },
    { subject: 'English', attendance: 94 },
  ];

  const pieData = [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
  ];

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
          Complete attendance records and analytics
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
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {record.time}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={record.status === 'present' ? 'success' : 'danger'} className="capitalize">
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {record.markedBy}
                    </td>
                  </motion.tr>
                ))}
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
