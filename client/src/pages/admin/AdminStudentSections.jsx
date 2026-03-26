import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, Save, Users, Search } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import api from '@/utils/api';
import { useToast } from '@/contexts/ToastContext';

const AdminStudentSections = () => {
  const toast = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSection, setNewSection] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const loadStudents = async () => {
    const res = await api.get('/students');
    setStudents(res.data.students || []);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadStudents();
      } catch (error) {
        if (!mounted) return;
        toast.error(error.response?.data?.message || 'Failed to load students');
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const sections = useMemo(() => {
    const unique = new Set(
      students
        .map((student) => String(student.section || '').trim())
        .filter(Boolean)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return students.filter((student) => {
      const name = String(student.user?.name || '').toLowerCase();
      const email = String(student.user?.email || '').toLowerCase();
      const studentId = String(student.studentId || '').toLowerCase();
      const section = String(student.section || '').toLowerCase();
      return name.includes(term) || email.includes(term) || studentId.includes(term) || section.includes(term);
    });
  }, [students, searchQuery]);

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleCreateSection = () => {
    const value = newSection.trim();
    if (!value) {
      toast.error('Enter a section name first');
      return;
    }

    if (sections.some((section) => section.toLowerCase() === value.toLowerCase())) {
      toast.info('Section already exists');
      setSelectedSection(value);
      setNewSection('');
      return;
    }

    setSelectedSection(value);
    setNewSection('');
    toast.success(`Section ${value} is ready. Select students and click Save Changes.`);
  };

  const handleBulkAssign = async () => {
    const targetSection = selectedSection.trim();
    if (!targetSection) {
      toast.error('Choose or create a section first');
      return;
    }

    const ids = Array.from(selectedStudentIds);
    if (ids.length === 0) {
      toast.error('Select at least one student');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        ids.map((studentId) => api.put(`/students/${studentId}`, { section: targetSection }))
      );
      await loadStudents();
      setSelectedStudentIds(new Set());
      toast.success(`${ids.length} students moved to section ${targetSection}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student sections');
    } finally {
      setSaving(false);
    }
  };

  const handleSingleAssign = async (studentId, sectionValue) => {
    setSaving(true);
    try {
      await api.put(`/students/${studentId}`, { section: sectionValue ? String(sectionValue).trim() : null });
      await loadStudents();
      toast.success('Student section updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update section');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">Student Sections</h1>
        <p className="text-slate-600 dark:text-slate-400">Create sections and change student section assignments anytime.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{students.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Sections</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{sections.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 dark:text-slate-400">Selected Students</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedStudentIds.size}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Section Management</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Create New Section"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="e.g. A, B, C or IT-A"
              icon={<Layers className="w-4 h-4" />}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                <option value="">-- Select Section --</option>
                {sections.map((section) => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="secondary" icon={<Plus className="w-4 h-4" />} onClick={handleCreateSection}>Create Section</Button>
              <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleBulkAssign} disabled={saving} loading={saving}>Save Changes</Button>
            </div>
          </div>

          {sections.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => setSelectedSection(section)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    selectedSection === section
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Students</h2>
            <div className="w-full max-w-sm">
              <Input
                placeholder="Search by name, email, ID, section"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Select</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Current Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Quick Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{student.user?.name || '-'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{student.user?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{student.studentId}</td>
                    <td className="px-4 py-3">
                      <Badge variant={student.section ? 'success' : 'warning'}>{student.section || 'Unassigned'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={student.section || ''}
                          placeholder="Section"
                          className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSingleAssign(student.id, e.currentTarget.value);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input');
                            handleSingleAssign(student.id, input?.value || '');
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400" colSpan={5}>
                      No students found.
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

export default AdminStudentSections;
