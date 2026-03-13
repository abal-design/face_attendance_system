import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit, Trash2, Users as UsersIcon, Mail, Phone,
  Upload, Download, FileText, Briefcase, Building2, GraduationCap,
  BookOpen, Award, Eye, X, ChevronDown, UserCheck, UserX, Clock,
  CheckCircle2, AlertTriangle, MapPin, Copy, KeyRound, Send
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import api from '@/utils/api';
import { useToast } from '@/contexts/ToastContext';
import { generatePassword, sendCredentialsEmail } from '@/utils/helpers';

const normalizeTeacher = (t) => ({
  id: t.id,
  name: t.user?.name ?? '',
  email: t.user?.email ?? '',
  avatar: t.user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.user?.email ?? '')}`,
  department: t.department?.name ?? '',
  departmentId: t.departmentId ?? null,
  subject: t.subject ?? '',
  experience: t.experience ?? 0,
  qualification: t.qualification ?? '',
  phone: t.phone ?? '',
  status: t.status ?? 'active',
  employeeId: t.teacherId ?? '',
});

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTeacher, setDetailTeacher] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedTeachers, setImportedTeachers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCredentials, setShowCredentials] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/teachers'),
      api.get('/departments'),
    ]).then(([tRes, dRes]) => {
      setTeachers((tRes.data.teachers || []).map(normalizeTeacher));
      setDeptList(dRes.data.departments || []);
    }).catch(() => {
      toast.error('Failed to load teachers');
    }).finally(() => setLoadingData(false));
  }, []);

  const itemsPerPage = 10;

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  const departments = [...new Set(teachers.map(t => t.department))];

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || teacher.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeCount = teachers.filter(t => t.status === 'active').length;
  const onLeaveCount = teachers.filter(t => t.status === 'on-leave').length;
  const avgExperience = teachers.length > 0
    ? Math.round(teachers.reduce((sum, t) => sum + (t.experience || 0), 0) / teachers.length)
    : 0;

  const handleAddTeacher = () => {
    setSelectedTeacher({
      name: '',
      email: '',
      phone: '',
      departmentId: null,
      subject: '',
      experience: '',
      qualification: '',
      status: 'active',
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher({ ...teacher });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleViewTeacher = (teacher) => {
    setDetailTeacher(teacher);
    setShowDetailModal(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    try {
      await api.delete(`/teachers/${teacherId}`);
      setTeachers(teachers.filter(t => t.id !== teacherId));
      setShowDeleteConfirm(null);
      toast.success('Teacher removed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete teacher');
    }
  };

  const handleSaveTeacher = async () => {
    if (!selectedTeacher.name || !selectedTeacher.email) {
      toast.error('Please fill in all required fields (Name, Email)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedTeacher.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (isEditMode) {
      try {
        const res = await api.put(`/teachers/${selectedTeacher.id}`, {
          name: selectedTeacher.name,
          email: selectedTeacher.email,
          phone: selectedTeacher.phone,
          departmentId: selectedTeacher.departmentId || null,
          subject: selectedTeacher.subject,
          experience: selectedTeacher.experience,
          qualification: selectedTeacher.qualification,
          status: selectedTeacher.status,
        });
        const updated = normalizeTeacher(res.data.teacher);
        setTeachers(teachers.map(t => t.id === updated.id ? updated : t));
        toast.success('Teacher updated successfully');
        setShowModal(false);
        setSelectedTeacher(null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update teacher');
      }
    } else {
      const password = generatePassword();
      try {
        const res = await api.post('/teachers', {
          name: selectedTeacher.name,
          email: selectedTeacher.email,
          password,
          phone: selectedTeacher.phone,
          departmentId: selectedTeacher.departmentId || null,
          subject: selectedTeacher.subject,
          experience: selectedTeacher.experience || 0,
          qualification: selectedTeacher.qualification,
        });
        const created = normalizeTeacher(res.data.teacher);
        setTeachers([created, ...teachers]);
        setShowModal(false);
        setSelectedTeacher(null);
        setShowCredentials({ name: created.name, email: created.email, userId: created.employeeId, password });
        setSendingEmail(true);
        sendCredentialsEmail(created.email, created.employeeId, password, 'teacher').then(() => {
          setSendingEmail(false);
          toast.success(`Credentials sent to ${created.email}`);
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create teacher');
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'txt'].includes(ext)) {
      toast.error('Please upload a CSV, Excel, or TXT file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          toast.error('File must contain at least a header and one teacher');
          return;
        }

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].trim().split(',').map(c => c.trim());
          if (cols.length >= 2) {
            parsed.push({
              id: Date.now() + i,
              name: cols[0] || '',
              email: cols[1] || '',
              department: cols[2] || '',
              subject: cols[3] || '',
              phone: cols[4] || '',
              employeeId: cols[5] || '',
              experience: parseInt(cols[6]) || 0,
              status: 'active',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cols[0])}`
            });
          }
        }

        if (parsed.length === 0) {
          toast.error('No valid teacher data found in file');
          return;
        }

        setImportedTeachers(parsed);
        setShowImportModal(true);
      } catch {
        toast.error('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleAddImportedTeachers = () => {
    const existingEmails = new Set(teachers.map(t => t.email.toLowerCase()));
    const newTeachers = importedTeachers.filter(t => !existingEmails.has(t.email.toLowerCase()));

    if (newTeachers.length === 0) {
      toast.warning('All teachers already exist in the system');
      setShowImportModal(false);
      return;
    }

    setTeachers([...newTeachers, ...teachers]);
    toast.success(`${newTeachers.length} teacher${newTeachers.length > 1 ? 's' : ''} added successfully`);
    setShowImportModal(false);
    setImportedTeachers([]);
  };

  const downloadSampleCSV = () => {
    const csv = 'Name,Email,Department,Subject,Phone,Employee ID,Experience\nDr. John Smith,john.smith@school.com,Computer Science,Machine Learning,555-0101,T010,8\nProf. Sarah Lee,sarah.lee@school.com,Engineering,Fluid Dynamics,555-0102,T011,12';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const exportTeachers = () => {
    const header = 'Name,Email,Department,Subject,Phone,Employee ID,Experience,Status';
    const rows = teachers.map(t =>
      `${t.name},${t.email},${t.department},${t.subject || ''},${t.phone || ''},${t.employeeId || ''},${t.experience || ''},${t.status}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Teachers list exported');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'on-leave': return <Clock className="w-3.5 h-3.5" />;
      default: return <UserX className="w-3.5 h-3.5" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'on-leave': return 'warning';
      default: return 'danger';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
            Teacher Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage faculty, track departments, and organize your teaching staff
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-4 h-4" />}
          >
            Import
          </Button>
          <Button
            variant="primary"
            onClick={handleAddTeacher}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Teacher
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <CardBody className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Faculty</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{teachers.length}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All registered teachers</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </CardBody>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-400" />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <CardBody className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
                  <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">{activeCount}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {teachers.length > 0 ? Math.round((activeCount / teachers.length) * 100) : 0}% of total
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-success-600 dark:text-success-400" />
                </div>
              </div>
            </CardBody>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-success-500 to-success-400" />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <CardBody className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Departments</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">{departments.length}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Academic divisions</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardBody>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <CardBody className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Experience</p>
                  <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">{avgExperience}<span className="text-lg font-normal ml-1">yrs</span></p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Average teaching years</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                </div>
              </div>
            </CardBody>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 to-warning-400" />
          </Card>
        </motion.div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardBody>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:max-w-md">
                <Input
                  placeholder="Search by name, email, department, subject..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  icon={<Search className="w-5 h-5" />}
                />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="appearance-none pl-3 pr-9 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={departmentFilter}
                    onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                    className="appearance-none pl-3 pr-9 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <Button variant="secondary" size="sm" onClick={exportTeachers} icon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
              </div>
            </div>

            {/* Active filter chips */}
            {(statusFilter !== 'all' || departmentFilter !== 'all' || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-danger-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-danger-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {departmentFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    Dept: {departmentFilter}
                    <button onClick={() => setDepartmentFilter('all')} className="hover:text-danger-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDepartmentFilter('all'); }}
                  className="text-xs text-danger-600 dark:text-danger-400 hover:underline font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{paginatedTeachers.length}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredTeachers.length}</span> teacher{filteredTeachers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Teachers Grid / Cards for Mobile, Table for Desktop */}
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        <AnimatePresence mode="popLayout">
          {paginatedTeachers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Search className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">No teachers found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
            </motion.div>
          ) : paginatedTeachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="hover:shadow-md transition-all duration-200">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {teacher.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{teacher.email}</p>
                        </div>
                        <Badge variant={getStatusVariant(teacher.status)} size="sm">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(teacher.status)}
                            {teacher.status}
                          </span>
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {teacher.department && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded-md">
                            <Building2 className="w-3 h-3" /> {teacher.department}
                          </span>
                        )}
                        {teacher.subject && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md">
                            <BookOpen className="w-3 h-3" /> {teacher.subject}
                          </span>
                        )}
                        {teacher.experience > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 px-2 py-1 rounded-md">
                            <Award className="w-3 h-3" /> {teacher.experience} yrs
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <button
                          onClick={() => handleViewTeacher(teacher)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(teacher.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 hover:bg-danger-100 dark:hover:bg-danger-900/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Experience</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Search className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">No teachers found</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedTeachers.map((teacher, index) => (
                    <motion.tr
                      key={teacher.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={teacher.avatar}
                            alt={teacher.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {teacher.name}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {teacher.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {teacher.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {teacher.subject ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full">
                            <BookOpen className="w-3 h-3" />
                            {teacher.subject}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {teacher.experience ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-warning-400 to-warning-500 rounded-full"
                                style={{ width: `${Math.min(teacher.experience * 5, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{teacher.experience} yrs</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(teacher.status)} size="sm">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(teacher.status)}
                            <span className="capitalize">{teacher.status}</span>
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewTeacher(teacher)}
                            className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditTeacher(teacher)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Edit teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(teacher.id)}
                            className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-slate-500 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                            title="Delete teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {filteredTeachers.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredTeachers.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ========== MODALS ========== */}

      {/* Add/Edit Teacher Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
      >
        {selectedTeacher && (
          <>
            <ModalBody>
              <div className="space-y-5">
                {/* Avatar preview for edit mode */}
                {isEditMode && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <img
                      src={selectedTeacher.avatar}
                      alt={selectedTeacher.name || 'Teacher'}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedTeacher.name || 'New Teacher'}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTeacher.email || 'Enter email'}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    value={selectedTeacher.name}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, name: e.target.value })}
                    placeholder="Dr. John Smith"
                    icon={<GraduationCap className="w-4 h-4" />}
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={selectedTeacher.email}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, email: e.target.value })}
                    placeholder="teacher@school.com"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={selectedTeacher.phone || ''}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, phone: e.target.value })}
                    placeholder="+1 555-0100"
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <Input
                    label="Employee ID"
                    value={selectedTeacher.employeeId || ''}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, employeeId: e.target.value })}
                    placeholder="T001"
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                    <select
                      value={selectedTeacher.departmentId ?? ''}
                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, departmentId: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    >
                      <option value="">-- Select Department --</option>
                      {deptList.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Subject"
                    value={selectedTeacher.subject || ''}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, subject: e.target.value })}
                    placeholder="e.g., Data Structures"
                    icon={<BookOpen className="w-4 h-4" />}
                  />
                  <Input
                    label="Experience (years)"
                    type="number"
                    value={selectedTeacher.experience || ''}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, experience: parseInt(e.target.value) || '' })}
                    placeholder="e.g., 10"
                    icon={<Award className="w-4 h-4" />}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedTeacher.status}
                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on-leave">On Leave</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">* Required fields</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveTeacher} icon={isEditMode ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}>
                {isEditMode ? 'Update' : 'Add'} Teacher
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Teacher Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Teacher Profile"
      >
        {detailTeacher && (
          <ModalBody>
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-5 p-5 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-2xl">
                <img
                  src={detailTeacher.avatar}
                  alt={detailTeacher.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-700 shadow-lg"
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{detailTeacher.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{detailTeacher.department}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getStatusVariant(detailTeacher.status)} size="sm">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(detailTeacher.status)}
                        <span className="capitalize">{detailTeacher.status}</span>
                      </span>
                    </Badge>
                    {detailTeacher.employeeId && (
                      <Badge variant="default" size="sm">ID: {detailTeacher.employeeId}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{detailTeacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-success-600 dark:text-success-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{detailTeacher.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{detailTeacher.subject || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Experience</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{detailTeacher.experience ? `${detailTeacher.experience} years` : 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => { setShowDetailModal(false); handleEditTeacher(detailTeacher); }}
                  icon={<Edit className="w-4 h-4" />}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </ModalBody>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Deletion"
      >
        <ModalBody>
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Delete this teacher?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              This action cannot be undone. The teacher's profile and associated data will be permanently removed.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDeleteTeacher(showDeleteConfirm)}
            className="!bg-danger-600 hover:!bg-danger-700 !text-white"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete Teacher
          </Button>
        </ModalFooter>
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
        title="Import Teachers"
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {importedTeachers.length} Teacher{importedTeachers.length !== 1 ? 's' : ''} Found
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Review before adding to the system
                  </p>
                </div>
              </div>
            </div>

            {/* Preview List */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {importedTeachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{teacher.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{teacher.email} • {teacher.department}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
                </div>
              ))}
            </div>

            {/* Sample Download */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <strong>CSV Format:</strong> Name, Email, Department, Subject, Phone, Employee ID, Experience
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
            onClick={() => { setShowImportModal(false); setImportedTeachers([]); }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddImportedTeachers}
            icon={<Plus className="w-4 h-4" />}
          >
            Add All Teachers
          </Button>
        </ModalFooter>
      </Modal>

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
                    Teacher Account Created!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Login credentials have been generated for <strong>{showCredentials.name}</strong>
                  </p>
                </div>

                {/* Credentials */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User ID</label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-primary-500" />
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{showCredentials.userId}</span>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(showCredentials.userId); toast.success('User ID copied'); }}
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
                  The teacher can use these credentials to log in. They should change their password after first login.
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

export default AdminTeachers;
