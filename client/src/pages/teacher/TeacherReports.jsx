import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, Plus, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { generateReports } from '@/utils/mockData';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/contexts/ToastContext';

const TeacherReports = () => {
  const [reports, setReports] = useState(generateReports('monthly'));
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const toast = useToast();

  const handleGenerateReport = () => {
    const newReport = {
      id: reports.length + 1,
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Attendance Report`,
      type: reportType,
      generatedBy: 'Teacher',
      date: new Date().toISOString().split('T')[0],
      status: 'generating',
      fileSize: '0 KB',
    };
    setReports([newReport, ...reports]);
    setShowModal(false);
    toast.info('Generating report...');
    
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.id === newReport.id 
          ? { ...r, status: 'completed', fileSize: `${Math.floor(Math.random() * 500 + 100)} KB` }
          : r
      ));
      toast.success('Report generated successfully');
    }, 2000);
  };

  const handleDownload = (report) => {
    toast.success(`Downloading ${report.title}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
              Reports 📄
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Generate and download attendance reports
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Generate Report
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, icon: FileText, gradient: 'from-primary-500 to-primary-600' },
          { label: 'Completed', value: reports.filter(r => r.status === 'completed').length, icon: CheckCircle2, gradient: 'from-success-500 to-success-600' },
          { label: 'Generating', value: reports.filter(r => r.status === 'generating').length, icon: Clock, gradient: 'from-warning-500 to-warning-600' },
          { label: 'This Month', value: reports.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length, icon: BarChart3, gradient: 'from-purple-500 to-purple-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardBody>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              </CardBody>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            </Card>
          );
        })}
      </div>

      {/* Reports list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Generated Reports
            </h2>
            <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Generated on {formatDate(report.date)}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {report.fileSize}
                        </span>
                        <Badge
                          variant={report.status === 'completed' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {report.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(report)}
                        icon={<Download className="w-4 h-4" />}
                      >
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Generate report modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Generate New Report"
      >
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Report Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['daily', 'weekly', 'monthly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all capitalize text-sm font-medium
                      ${reportType === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Report Name"
              placeholder="e.g., March 2024 Attendance Report"
              icon={<FileText className="w-5 h-5" />}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                icon={<Calendar className="w-5 h-5" />}
              />
              <Input
                label="End Date"
                type="date"
                icon={<Calendar className="w-5 h-5" />}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerateReport}>
            Generate Report
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default TeacherReports;
