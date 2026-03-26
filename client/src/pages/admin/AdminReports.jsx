import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Filter, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import api from '@/utils/api';
import { useToast } from '@/contexts/ToastContext';

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const toDateInput = (date) => new Date(date).toISOString().slice(0, 10);

const AdminReports = () => {
  const toast = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(toDateInput(new Date(new Date().setDate(new Date().getDate() - 30))));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [statusFilter, setStatusFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [reportsRes, studentsRes, attendanceRes] = await Promise.all([
          api.get('/reports'),
          api.get('/students'),
          api.get('/attendance'),
        ]);

        if (!mounted) return;
        setReports(reportsRes.data.reports || []);
        setStudents(studentsRes.data.students || []);
        setAttendance(attendanceRes.data.attendance || []);
      } catch (error) {
        if (!mounted) return;
        toast.error(getErrorMessage(error, 'Failed to load reports data'));
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 20000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [toast]);

  const reportRows = useMemo(() => {
    return attendance.map((row) => {
      const student = students.find((s) => s.id === row.studentId);
      return {
        id: row.id,
        date: row.attendanceDate,
        className: row.class?.name || row.class?.code || 'Class',
        department: student?.department?.name || 'Unassigned',
        studentName: student?.user?.name || row.student?.user?.name || 'Student',
        studentId: student?.studentId || row.student?.studentId || '-',
        status: row.status,
        markedBy: row.markedBy || 'System',
      };
    });
  }, [attendance, students]);

  const filteredRows = useMemo(() => {
    const from = new Date(startDate);
    const to = new Date(endDate);

    return reportRows.filter((row) => {
      const d = new Date(row.date);
      if (Number.isNaN(d.getTime())) return false;

      const inRange = d >= from && d <= to;
      const statusOk = statusFilter === 'all' || row.status === statusFilter;
      return inRange && statusOk;
    });
  }, [reportRows, startDate, endDate, statusFilter]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const present = filteredRows.filter((r) => r.status === 'present').length;
    const absent = filteredRows.filter((r) => r.status === 'absent').length;
    const attendanceRate = total ? Math.round((present / total) * 1000) / 10 : 0;

    const lowAttendanceStudents = new Map();
    filteredRows.forEach((row) => {
      const key = row.studentId;
      const current = lowAttendanceStudents.get(key) || {
        studentId: row.studentId,
        studentName: row.studentName,
        department: row.department,
        total: 0,
        present: 0,
      };
      current.total += 1;
      if (row.status === 'present') current.present += 1;
      lowAttendanceStudents.set(key, current);
    });

    const lowRisk = Array.from(lowAttendanceStudents.values())
      .map((row) => ({
        ...row,
        attendanceRate: row.total ? Math.round((row.present / row.total) * 100) : 0,
      }))
      .filter((row) => row.attendanceRate < 75)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 8);

    return {
      total,
      present,
      absent,
      attendanceRate,
      lowRisk,
    };
  }, [filteredRows]);

  const persistedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reports]);

  const exportCsv = () => {
    if (filteredRows.length === 0) {
      toast.info('No rows available for export in selected filters');
      return;
    }

    const lines = [
      ['Date', 'Class', 'Department', 'Student Name', 'Student ID', 'Status', 'Marked By'].join(','),
      ...filteredRows.map((r) =>
        [r.date, r.className, r.department, r.studentName, r.studentId, r.status, r.markedBy]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-attendance-report-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    if (!title.trim()) {
      toast.error('Please enter report title');
      return;
    }

    setIsGenerating(true);
    try {
      const estimateKb = Math.max(1, Math.round((filteredRows.length * 0.2) + 8));
      const res = await api.post('/reports', {
        type: reportType,
        title: title.trim(),
        status: 'completed',
        fileSize: `${estimateKb} KB`,
      });

      setReports((prev) => [res.data.report, ...prev]);
      setShowGenerateModal(false);
      setTitle('');
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to generate report'));
    } finally {
      setIsGenerating(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">Admin Reports</h1>
            <p className="text-slate-600 dark:text-slate-400">Generate live attendance reports from database data</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={exportCsv}>Export CSV</Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowGenerateModal(true)}>Generate Report</Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardBody><p className="text-sm text-slate-500 dark:text-slate-400">Filtered Records</p><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.total}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500 dark:text-slate-400">Present</p><p className="text-2xl font-bold text-success-600">{summary.present}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500 dark:text-slate-400">Absent</p><p className="text-2xl font-bold text-danger-600">{summary.absent}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500 dark:text-slate-400">Attendance Rate</p><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.attendanceRate}%</p></CardBody></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold"><Filter className="w-4 h-4" /> Report Filters</div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Low Attendance Risk (Below 75%)</h2></CardHeader>
          <CardBody className="space-y-3">
            {summary.lowRisk.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No students below threshold in selected range.</p>}
            {summary.lowRisk.map((row) => (
              <div key={row.studentId} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{row.studentName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{row.studentId} • {row.department}</p>
                </div>
                <Badge variant="danger">{row.attendanceRate}%</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Generated Reports</h2></CardHeader>
          <CardBody className="space-y-3">
            {persistedReports.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No generated reports yet.</p>}
            {persistedReports.slice(0, 8).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{report.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(report.createdAt).toLocaleString()} • {report.fileSize || '-'} </p>
                </div>
                <Badge variant={report.status === 'completed' ? 'success' : report.status === 'failed' ? 'danger' : 'warning'}>
                  {report.status}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={showGenerateModal} onClose={() => !isGenerating && setShowGenerateModal(false)} title="Generate Admin Report">
        <ModalBody>
          <div className="space-y-4">
            <Input label="Report Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monthly Attendance Summary" icon={<FileText className="w-4 h-4" />} />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Report Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['daily', 'weekly', 'monthly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                      reportType === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <p>This generates a report entry and you can export current filtered records as CSV.</p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowGenerateModal(false)} disabled={isGenerating}>Cancel</Button>
          <Button variant="primary" onClick={handleGenerateReport} loading={isGenerating} disabled={isGenerating} icon={<CheckCircle2 className="w-4 h-4" />}>
            Generate
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AdminReports;
