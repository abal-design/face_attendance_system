import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Users, Mail, Filter, Upload, Download, FileText, Phone, MapPin, Eye, AlertTriangle, UserCheck, UserX, GraduationCap, Copy, KeyRound, Send, CheckCircle2 } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import api from '@/utils/api';
import { useToast } from '@/contexts/ToastContext';

// Flatten nested API response into the flat shape the UI expects
const normalizeStudent = (s) => ({
  id: s.id,
  name: s.user?.name ?? '',
  email: s.user?.email ?? '',
  avatar: s.user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.user?.email ?? '')}`,
  department: s.department?.name ?? '',
  departmentId: s.departmentId ?? null,
  year: s.year ?? 1,
  phone: s.phone ?? '',
  address: s.address ?? '',
  attendance: parseFloat(s.attendancePercentage) || 0,
  status: s.status ?? 'active',
  studentId: s.studentId ?? '',
});

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedStudents, setImportedStudents] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [showCredentials, setShowCredentials] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingStudentId, setDownloadingStudentId] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/students'),
      api.get('/departments'),
    ]).then(([sRes, dRes]) => {
      setStudents((sRes.data.students || []).map(normalizeStudent));
      setDepartments(dRes.data.departments || []);
    }).catch(() => {
      toast.error('Failed to load students');
    }).finally(() => setLoadingData(false));
  }, []);

  const itemsPerPage = 10;

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddStudent = () => {
    setSelectedStudent({
      name: '',
      email: '',
      phone: '',
      departmentId: null,
      year: 1,
      address: '',
      status: 'active',
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent({ ...student });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDeleteStudent = (studentId) => {
    setDeleteTarget(students.find(s => s.id === studentId));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/students/${deleteTarget.id}`);
      setStudents(students.filter(s => s.id !== deleteTarget.id));
      toast.success('Student deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSaveStudent = async () => {
    if (!selectedStudent.name || !selectedStudent.email) {
      toast.error('Please fill in all required fields (Name, Email)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedStudent.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (isEditMode) {
      try {
        const res = await api.put(`/students/${selectedStudent.id}`, {
          name: selectedStudent.name,
          email: selectedStudent.email,
          phone: selectedStudent.phone,
          departmentId: selectedStudent.departmentId || null,
          year: selectedStudent.year,
          address: selectedStudent.address,
          status: selectedStudent.status,
        });
        const updated = normalizeStudent(res.data.student);
        setStudents(students.map(s => s.id === updated.id ? updated : s));
        toast.success('Student updated successfully');
        setShowModal(false);
        setSelectedStudent(null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update student');
      }
    } else {
      try {
        const res = await api.post('/students', {
          name: selectedStudent.name,
          email: selectedStudent.email,
          phone: selectedStudent.phone,
          departmentId: selectedStudent.departmentId || null,
          year: selectedStudent.year || 1,
          address: selectedStudent.address,
        });
        const created = normalizeStudent(res.data.student);
        const generatedCredentials = res.data.credentials;
        setStudents([created, ...students]);
        setShowModal(false);
        setSelectedStudent(null);

        if (generatedCredentials?.studentId && generatedCredentials?.password) {
          setShowCredentials({
            name: generatedCredentials.name || created.name,
            email: generatedCredentials.email || created.email,
            userId: generatedCredentials.studentId,
            password: generatedCredentials.password,
          });

          const delivery = res.data.emailDelivery;
          if (delivery?.attempted) {
            if (delivery.sent) {
              toast.success(`Credentials sent to ${generatedCredentials.email || created.email}`);
            } else {
              toast.warning(`Account created, but email sending failed: ${delivery.error || 'Unknown error'}`);
            }
          } else {
            toast.info('Account created. Email sending is not configured in server env.');
          }

          setSendingEmail(false);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create student');
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!['csv', 'xlsx', 'xls', 'txt'].includes(fileExtension)) {
      toast.error('Please upload a CSV, Excel, or TXT file');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('File must contain at least a header and one student');
          return;
        }

        // Parse CSV (format: name,email,department,year,phone,address)
        const students = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const columns = line.split(',').map(col => col.trim());
          
          if (columns.length >= 2) {
            const student = {
              id: Date.now() + i,
              name: columns[0] || '',
              email: columns[1] || '',
              department: columns[2] || '',
              year: columns[3] || '',
              phone: columns[4] || '',
              address: columns[5] || '',
              status: 'active',
              attendance: 0,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${columns[0]}`
            };
            students.push(student);
          }
        }

        if (students.length === 0) {
          toast.error('No valid student data found in file');
          return;
        }

        setImportedStudents(students);
        setShowImportModal(true);
        toast.success(`${students.length} students imported successfully`);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to parse file. Please check the format.');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleAddImportedStudents = () => {
    // Filter out duplicates by email
    const existingEmails = new Set(students.map(s => s.email.toLowerCase()));
    const newStudents = importedStudents.filter(s => !existingEmails.has(s.email.toLowerCase()));
    
    if (newStudents.length === 0) {
      toast.warning('All students already exist in the system');
      setShowImportModal(false);
      return;
    }
    
    const resolveDepartmentId = (departmentText = '') => {
      const normalized = String(departmentText).trim().toLowerCase();
      if (!normalized) return null;

      const matchByCode = departments.find((d) => String(d.code || '').trim().toLowerCase() === normalized);
      if (matchByCode) return matchByCode.id;

      const matchByName = departments.find((d) => String(d.name || '').trim().toLowerCase() === normalized);
      return matchByName?.id || null;
    };

    const payload = newStudents.map((student) => ({
      name: student.name,
      email: student.email,
      departmentId: resolveDepartmentId(student.department),
      year: Number(student.year) || 1,
      phone: student.phone || null,
      address: student.address || null,
    }));

    const downloadCredentialsCsv = (credentials) => {
      if (!credentials?.length) return;

      const header = 'Name,Email,Student ID,Password';
      const rows = credentials.map((item) => (
        [item.name, item.email, item.studentId, item.password]
          .map((value) => `"${String(value || '').replace(/"/g, '""')}"`)
          .join(',')
      ));

      const csvContent = [header, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student_credentials_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    api.post('/students/bulk', { students: payload })
      .then(async (res) => {
        const createdStudents = (res.data.students || []).map(normalizeStudent);
        const credentials = res.data.credentials || [];
        const skipped = res.data.skipped || [];

        setStudents((prev) => [...createdStudents, ...prev]);
        downloadCredentialsCsv(credentials);

        if (credentials.length > 0) {
          const delivery = res.data.emailDelivery;
          if (delivery?.attempted) {
            toast.success(`${createdStudents.length} students created. Credentials emailed to ${delivery.sent || 0} students.`);
            if (delivery.failed > 0) {
              toast.warning(`${delivery.failed} credential emails failed to send.`);
            }
          } else {
            toast.info(`${createdStudents.length} students created. Email sending is not configured in server env.`);
          }
        } else {
          toast.success(`${createdStudents.length} students created successfully`);
        }

        if (skipped.length > 0) {
          toast.info(`${skipped.length} rows were skipped (duplicate or invalid data).`);
        }

        setShowImportModal(false);
        setImportedStudents([]);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to bulk create students');
      });
  };

  const downloadSampleCSV = () => {
    const csvContent = 'Name,Email,Department,Year,Phone,Address\nJohn Doe,john@example.com,Computer Science,2024,123-456-7890,123 Main St\nJane Smith,jane@example.com,Engineering,2023,098-765-4321,456 Oak Ave';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const handleDownloadStudentAttendance = async (student) => {
    if (!student?.id) return;

    setDownloadingStudentId(student.id);
    try {
      const response = await api.get('/attendance', {
        params: { studentId: student.id },
      });

      const records = response.data.attendance || [];
      const header = 'Date,Class,Status,Marked By,Marked At';
      const rows = records.map((record) => (
        [
          record.attendanceDate || '',
          record.class?.name || record.class?.code || '',
          record.status || '',
          record.markedBy || '',
          record.markedAt ? new Date(record.markedAt).toISOString() : '',
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      ));

      const csvContent = [header, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeStudentId = String(student.studentId || student.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeName = String(student.name || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.href = url;
      a.download = `${safeStudentId}_${safeName}_attendance.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      if (records.length === 0) {
        toast.info(`No attendance records found for ${student.name}. Empty CSV downloaded.`);
      } else {
        toast.success(`Attendance downloaded for ${student.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download student attendance');
    } finally {
      setDownloadingStudentId(null);
    }
  };

  const columns = [
    { key: 'avatar', label: 'Avatar' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'year', label: 'Year' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
              Student Management 
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage all students in the system
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleAddStudent}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Student
            </Button>
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-4 h-4" />}
            >
              Import
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length, icon: Users, gradient: 'from-primary-500 to-primary-700', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Active', value: students.filter(s => s.status === 'active').length, icon: UserCheck, gradient: 'from-success-500 to-success-700', bg: 'bg-success-50 dark:bg-success-900/20' },
          { label: 'Inactive', value: students.filter(s => s.status !== 'active').length, icon: UserX, gradient: 'from-danger-500 to-danger-700', bg: 'bg-danger-50 dark:bg-danger-900/20' },
          { label: 'Avg Attendance', value: `${Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length)}%`, icon: GraduationCap, gradient: 'from-warning-500 to-warning-700', bg: 'bg-warning-50 dark:bg-warning-900/20' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="relative overflow-hidden">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardBody>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            </Card>
          </motion.div>
        ))}
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
                Export
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Students table */}
      <Card>
        <CardBody className="p-0">
          <Table columns={columns}>
            {paginatedStudents.map((student, index) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-6 py-4">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full"
                  />
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                  {student.name}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {student.email}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {student.department}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {student.year}
                </td>
                <td className="px-6 py-4">
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
                    <span className="text-sm">{student.attendance}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={student.status === 'active' ? 'success' : 'danger'}>
                    {student.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownloadStudentAttendance(student)}
                      className="p-1.5 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Download Attendance"
                      disabled={downloadingStudentId === student.id}
                    >
                      <Download className="w-4 h-4 text-success-600" />
                    </button>
                    <button
                      onClick={() => setViewStudent(student)}
                      className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-primary-600" />
                    </button>
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-danger-600" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </Table>
        </CardBody>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredStudents.length / itemsPerPage)}
        onPageChange={setCurrentPage}
      />

      {/* Add/Edit student modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditMode ? 'Edit Student' : 'Add New Student'}
      >
        {selectedStudent && (
          <>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={selectedStudent.name}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, name: e.target.value })}
                  placeholder="Enter full name"
                />
                <Input
                  label="Email *"
                  type="email"
                  value={selectedStudent.email}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
                  placeholder="student@example.com"
                  icon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={selectedStudent.phone || ''}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, phone: e.target.value })}
                  placeholder="123-456-7890"
                  icon={<Phone className="w-4 h-4" />}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                  <select
                    value={selectedStudent.departmentId ?? ''}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, departmentId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Year"
                  value={selectedStudent.year}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, year: e.target.value })}
                  placeholder="e.g., 2024"
                />
                <div className="col-span-2">
                  <Input
                    label="Address"
                    value={selectedStudent.address || ''}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, address: e.target.value })}
                    placeholder="Enter address"
                    icon={<MapPin className="w-4 h-4" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStudent.status}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, status: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                * Required fields
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveStudent}>
                {isEditMode ? 'Update' : 'Add'} Student
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Import Preview Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Students"
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {importedStudents.length} Students Found
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Review the list below before adding
                  </p>
                </div>
              </div>
            </div>

            {/* Preview List */}
            <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              {importedStudents.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {student.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {student.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {student.department}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        Year: {student.year}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Format Help */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <strong>CSV Format:</strong> Name, Email, Department, Year, Phone, Address
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadSampleCSV}
                icon={<Download className="w-4 h-4" />}
              >
                Download Sample CSV
              </Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowImportModal(false);
              setImportedStudents([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddImportedStudents}
            icon={<Plus className="w-4 h-4" />}
          >
            Add All Students
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
            <ModalBody>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Delete Student
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete} icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
            </ModalFooter>
          </Modal>
        )}
      </AnimatePresence>

      {/* View Student Detail Modal */}
      <AnimatePresence>
        {viewStudent && (
          <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Details">
            <ModalBody>
              <div className="text-center mb-6">
                <img src={viewStudent.avatar} alt={viewStudent.name} className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-primary-100 dark:border-primary-900/30" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{viewStudent.name}</h3>
                <Badge variant={viewStudent.status === 'active' ? 'success' : 'danger'} className="mt-2 capitalize">{viewStudent.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Email', value: viewStudent.email },
                  { label: 'Department', value: viewStudent.department },
                  { label: 'Year', value: viewStudent.year },
                  { label: 'Attendance', value: `${viewStudent.attendance}%` },
                  { label: 'Phone', value: viewStudent.phone || 'N/A' },
                  { label: 'Address', value: viewStudent.address || 'N/A' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setViewStudent(null)}>Close</Button>
              <Button variant="primary" onClick={() => { handleEditStudent(viewStudent); setViewStudent(null); }} icon={<Edit className="w-4 h-4" />}>Edit</Button>
            </ModalFooter>
          </Modal>
        )}
      </AnimatePresence>

      {/* Credentials Modal */}
      <AnimatePresence>
        {showCredentials && (
          <Modal
            isOpen={!!showCredentials}
            onClose={() => setShowCredentials(null)}
            title="Account Created Successfully"
          >
            <ModalBody>
              <div className="space-y-5">
                {/* Success header */}
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-success-500 to-success-600 text-white shadow-lg mb-3">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Student Account Created!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Login credentials have been generated for <strong>{showCredentials.name}</strong>
                  </p>
                </div>

                {/* Credentials */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student ID</label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-primary-500" />
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{showCredentials.userId}</span>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(showCredentials.userId); toast.success('Student ID copied'); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{showCredentials.password}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(showCredentials.password); toast.success('Password copied'); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email status */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${sendingEmail ? 'bg-warning-50 dark:bg-warning-900/20' : 'bg-success-50 dark:bg-success-900/20'}`}>
                  {sendingEmail ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <Send className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                      </motion.div>
                      <p className="text-sm font-medium text-warning-700 dark:text-warning-300">
                        Sending credentials to {showCredentials.email}...
                      </p>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 text-success-600 dark:text-success-400" />
                      <p className="text-sm font-medium text-success-700 dark:text-success-300">
                        Credentials sent to <strong>{showCredentials.email}</strong>
                      </p>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                  The student can use these credentials to log in. They should change their password after first login.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onClick={() => setShowCredentials(null)}>
                Done
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStudents;
