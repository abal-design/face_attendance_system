import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Users, BookOpen, Search, AlertTriangle, GraduationCap, BarChart3 } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import api from '@/utils/api';
import { useToast } from '@/contexts/ToastContext';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ students: 0, teachers: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/departments'),
      api.get('/dashboard'),
    ]).then(([dRes, statsRes]) => {
      setDepartments(dRes.data.departments || []);
      const s = statsRes.data.stats || {};
      setStats({ students: s.students || 0, teachers: s.teachers || 0 });
    }).catch(() => {
      toast.error('Failed to load departments');
    }).finally(() => setLoadingData(false));
  }, []);

  const handleAddDepartment = () => {
    setSelectedDept({ name: '', code: '', description: '' });
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEditDepartment = (dept) => {
    setSelectedDept({ ...dept });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDeleteDepartment = (deptId) => {
    setDeleteTarget(departments.find(d => d.id === deptId));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/departments/${deleteTarget.id}`);
      setDepartments(departments.filter(d => d.id !== deleteTarget.id));
      toast.success('Department deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSaveDepartment = async () => {
    if (!selectedDept.name || !selectedDept.code) {
      toast.error('Please fill in department name and code');
      return;
    }
    try {
      if (isEditMode) {
        const res = await api.put(`/departments/${selectedDept.id}`, {
          name: selectedDept.name,
          code: selectedDept.code,
          description: selectedDept.description,
          status: selectedDept.status || 'active',
        });
        setDepartments(departments.map(d => d.id === selectedDept.id ? res.data.department : d));
        toast.success('Department updated successfully');
      } else {
        const res = await api.post('/departments', {
          name: selectedDept.name,
          code: selectedDept.code,
          description: selectedDept.description,
        });
        setDepartments([res.data.department, ...departments]);
        toast.success('Department added successfully');
      }
      setShowModal(false);
      setSelectedDept(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
              Department Management 
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage all departments and their information
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleAddDepartment}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Department
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Departments', value: departments.length, icon: Building2, gradient: 'from-primary-500 to-primary-700' },
          { label: 'Total Students', value: stats.students, icon: Users, gradient: 'from-success-500 to-success-700' },
          { label: 'Total Teachers', value: stats.teachers, icon: GraduationCap, gradient: 'from-warning-500 to-warning-700' },
          { label: 'Avg Students/Dept', value: departments.length ? Math.round(stats.students / departments.length) : 0, icon: BarChart3, gradient: 'from-blue-500 to-blue-700' },
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

      {/* Search */}
      <Card>
        <CardBody>
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="md:w-96"
          />
        </CardBody>
      </Card>

      {/* Departments grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept, index) => {
          const stats = getDepartmentStats(dept.name);
          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <CardBody>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {dept.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {dept.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditDepartment(dept)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        <Edit className="w-4 h-4 text-primary-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {dept.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>Students</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {stats.students}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" />
                        <span>Teachers</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {stats.teachers}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Department Head: <span className="font-medium text-slate-700 dark:text-slate-300">{dept.head}</span>
                    </p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add/Edit department modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditMode ? 'Edit Department' : 'Add New Department'}
      >
        {selectedDept && (
          <>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Department Name *"
                  value={selectedDept.name}
                  onChange={(e) => setSelectedDept({ ...selectedDept, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                  icon={<Building2 className="w-4 h-4" />}
                />
                <Input
                  label="Department Code *"
                  value={selectedDept.code}
                  onChange={(e) => setSelectedDept({ ...selectedDept, code: e.target.value })}
                  placeholder="e.g., CS"
                />
                <Input
                  label="Department Head"
                  value={selectedDept.head}
                  onChange={(e) => setSelectedDept({ ...selectedDept, head: e.target.value })}
                  placeholder="e.g., Dr. John Doe"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedDept.description}
                    onChange={(e) => setSelectedDept({ ...selectedDept, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    rows="3"
                    placeholder="Brief description of the department"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">* Required fields</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveDepartment}>
                {isEditMode ? 'Update' : 'Add'} Department
              </Button>
            </ModalFooter>
          </>
        )}
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
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Department</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong>? All associated data may be affected.
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
    </div>
  );
};

export default AdminDepartments;
