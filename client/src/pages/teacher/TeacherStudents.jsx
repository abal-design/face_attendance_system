import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Users, Mail, Phone, MoreVertical, GraduationCap, TrendingUp, Building2 } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import api from '@/utils/api';

const normalizeStudent = (s) => ({
  id: s.id,
  name: s.user?.name ?? '',
  email: s.user?.email ?? '',
  avatar: s.user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.user?.email ?? '')}`,
  department: s.department?.name ?? '',
  year: s.year ?? 1,
  attendance: parseFloat(s.attendancePercentage) || 0,
  status: s.status ?? 'active',
  studentId: s.studentId ?? '',
});

const TeacherStudents = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/students').then(res => {
      setAllStudents((res.data.students || []).map(normalizeStudent));
    }).catch(() => {});
  }, []);

  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          My Students 👨‍🎓
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage and view student information
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: allStudents.length, icon: Users, gradient: 'from-primary-500 to-primary-600' },
          { label: 'Active', value: allStudents.filter(s => s.status === 'active').length, icon: GraduationCap, gradient: 'from-success-500 to-success-600' },
          { label: 'Avg Attendance', value: `${allStudents.length ? Math.round(allStudents.reduce((sum, s) => sum + s.attendance, 0) / allStudents.length) : 0}%`, icon: TrendingUp, gradient: 'from-warning-500 to-warning-600' },
          { label: 'Departments', value: [...new Set(allStudents.map(s => s.department))].length, icon: Building2, gradient: 'from-purple-500 to-purple-600' },
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

      {/* Search and filter */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              className="md:w-96"
            />
            <div className="flex gap-2">
              <Button variant="ghost" icon={<Filter className="w-4 h-4" />}>
                Filter
              </Button>
              <Button variant="secondary" icon={<Users className="w-4 h-4" />}>
                Export List
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Students grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-600"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {student.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400 truncate">
                      {student.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {student.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Attendance</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            student.attendance >= 90 ? 'bg-success-500' :
                            student.attendance >= 75 ? 'bg-warning-500' : 'bg-danger-500'
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {student.attendance}%
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(student)}
                  >
                    View Details
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Student details modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Student Details"
      >
        {selectedStudent && (
          <>
            <ModalBody>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="w-20 h-20 rounded-full border-4 border-primary-100 dark:border-primary-900 shadow-md"
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">{selectedStudent.email}</p>
                  <Badge variant={selectedStudent.status === 'active' ? 'success' : 'danger'} className="mt-1">
                    {selectedStudent.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Email</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Department</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedStudent.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Year</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedStudent.year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Attendance</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedStudent.attendance}%</p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button variant="primary">
                View Full Profile
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
};

export default TeacherStudents;
