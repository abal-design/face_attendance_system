import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  Zap,
  Volume2,
  Lock,
  BookOpen,
  Upload,
  FileText,
  Download,
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import api from '@/utils/api';
import Progress from '@/components/ui/Progress';

const TeacherAttendance = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [students, setStudents] = useState([]);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const videoRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    api.get('/classes').then(res => {
      const raw = res.data.classes || [];
      setClasses(raw.map(c => ({
        id: c.id,
        name: `${c.name} - ${c.code}`,
        section: c.section || '',
        semester: c.academicYear || '',
        students: 0,
      })));
    }).catch(() => {});
  }, []);

  // Authentication state
  const [attendanceActive, setAttendanceActive] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [teacherId, setTeacherId] = useState('');
  const [showActivationModal, setShowActivationModal] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // File import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedStudents, setImportedStudents] = useState([]);
  const fileInputRef = useRef(null);

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;

  const handleActivateAttendance = () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    if (!teacherId.trim()) {
      toast.error('Please enter your Teacher ID');
      return;
    }

    setIsVerifying(true);
    
    // Simulate API call to verify teacher ID
    setTimeout(() => {
      // Mock verification - in real app, verify against backend
      if (teacherId.length >= 3) {
        setAttendanceActive(true);
        setShowActivationModal(false);
        toast.success(`Attendance activated for ${selectedClass.name}`);
      } else {
        toast.error('Invalid Teacher ID');
      }
      setIsVerifying(false);
    }, 1000);
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

        // Parse CSV (assuming format: name,email or name only)
        const students = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const columns = line.split(',').map(col => col.trim());
          
          if (columns.length >= 1) {
            const student = {
              id: Date.now() + i,
              name: columns[0],
              email: columns[1] || '',
              status: 'pending',
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
    setStudents(prevStudents => {
      // Avoid duplicates by checking names
      const existingNames = new Set(prevStudents.map(s => s.name.toLowerCase()));
      const newStudents = importedStudents.filter(s => !existingNames.has(s.name.toLowerCase()));
      return [...prevStudents, ...newStudents];
    });
    
    toast.success(`${importedStudents.length} students added to attendance list`);
    setShowImportModal(false);
    setImportedStudents([]);
  };

  const downloadSampleCSV = () => {
    const csvContent = 'Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com\nMike Johnson,mike@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_list_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      toast.success('Camera activated successfully');
    } catch (error) {
      toast.error('Failed to access camera');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanning(false);
    toast.info('Camera stopped');
  };

  const startScanning = () => {
    setScanning(true);
    toast.info('Face recognition started');
    
    // Simulate face detection
    const interval = setInterval(() => {
      const pendingStudents = students.filter(s => s.status === 'pending');
      if (pendingStudents.length > 0) {
        const randomStudent = pendingStudents[Math.floor(Math.random() * pendingStudents.length)];
        
        // Simulate face detection with bounding box
        setDetectedFaces([{
          id: randomStudent.id,
          x: Math.random() * 60 + 20,
          y: Math.random() * 60 + 20,
          width: 20,
          height: 25,
        }]);

        setTimeout(() => {
          setStudents(prev =>
            prev.map(s =>
              s.id === randomStudent.id ? { ...s, status: 'present' } : s
            )
          );
          toast.success(`${randomStudent.name} marked present`);
          setDetectedFaces([]);
        }, 1500);
      } else {
        clearInterval(interval);
        setScanning(false);
        toast.success('All students processed');
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const markManually = (studentId, status) => {
    setStudents(prev =>
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );
    const student = students.find(s => s.id === studentId);
    toast.success(`${student.name} marked ${status}`);
  };

  const completeAttendance = () => {
    // Mark all remaining pending as absent
    setStudents(prev =>
      prev.map(s => s.status === 'pending' ? { ...s, status: 'absent' } : s)
    );
    stopCamera();
    toast.success('Attendance completed and saved');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Activation Modal */}
      <Modal
        isOpen={showActivationModal && !attendanceActive}
        onClose={() => {}}
        title="Activate Attendance Session"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full text-white shadow-lg">
              <Lock className="w-12 h-12" />
            </div>
          </div>

          <div>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
              Select your class and enter your Teacher ID to activate attendance marking
            </p>

            {/* Class Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Class
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {classes.map((classItem) => (
                    <motion.button
                      key={classItem.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedClass(classItem)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedClass?.id === classItem.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <BookOpen className={`w-5 h-5 mt-0.5 ${
                            selectedClass?.id === classItem.id 
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-slate-400'
                          }`} />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {classItem.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Section {classItem.section} • {classItem.semester}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{classItem.students} students</Badge>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Teacher ID Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teacher ID
                </label>
                <Input
                  type="text"
                  placeholder="Enter your Teacher ID"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  icon={<Lock className="w-5 h-5" />}
                  disabled={isVerifying}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleActivateAttendance}
              disabled={!selectedClass || !teacherId || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Activate Attendance'}
            </Button>
          </div>

          {selectedClass && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Selected:</span> {selectedClass.name} - Section {selectedClass.section}
              </p>
            </motion.div>
          )}
        </div>
      </Modal>

      {/* Main Attendance Interface - Only shown when activated */}
      {attendanceActive && (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
                  Mark Attendance 📸
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedClass?.name} - Section {selectedClass?.section}
                </p>
              </div>
              <Badge variant="success" className="text-base px-4 py-2">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Session Active
              </Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Use AI-powered face recognition to mark attendance automatically
            </p>
          </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Students</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{students.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </CardBody>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600" />
        </Card>
        <Card className="relative overflow-hidden">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Present</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{presentCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-success-500 to-success-600 text-white shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardBody>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-success-500 to-success-600" />
        </Card>
        <Card className="relative overflow-hidden">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Absent</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{absentCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 text-white shadow-sm">
              <XCircle className="w-5 h-5" />
            </div>
          </CardBody>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-danger-500 to-danger-600" />
        </Card>
        <Card className="relative overflow-hidden">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 text-white shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
          </CardBody>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 to-warning-600" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Live Camera Feed
                  </h2>
                  {scanning && (
                    <div className="flex items-center gap-2 mt-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 bg-danger-500 rounded-full"
                      />
                      <span className="text-sm text-danger-600 dark:text-danger-400 font-medium">
                        Scanning...
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!cameraActive ? (
                  <Button onClick={startCamera} icon={<Camera className="w-4 h-4" />}>
                    Start Camera
                  </Button>
                ) : (
                  <>
                    {!scanning ? (
                      <Button
                        onClick={startScanning}
                        variant="success"
                        icon={<Zap className="w-4 h-4" />}
                      >
                        Start Detection
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setScanning(false)}
                        variant="warning"
                        icon={<Pause className="w-4 h-4" />}
                      >
                        Pause
                      </Button>
                    )}
                    <Button
                      onClick={stopCamera}
                      variant="danger"
                      icon={<CameraOff className="w-4 h-4" />}
                    >
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody className="relative">
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Scanning overlay */}
                  {scanning && (
                    <motion.div
                      animate={{ y: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-70"
                      style={{ top: 0 }}
                    />
                  )}

                  {/* Face detection boxes */}
                  <AnimatePresence>
                    {detectedFaces.map((face) => (
                      <motion.div
                        key={face.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute border-4 border-success-500 rounded-lg shadow-glow"
                        style={{
                          left: `${face.x}%`,
                          top: `${face.y}%`,
                          width: `${face.width}%`,
                          height: `${face.height}%`,
                        }}
                      >
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="absolute inset-0 bg-success-500/20 rounded-lg"
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Corner guides */}
                  {cameraActive && (
                    <div className="absolute inset-4 pointer-events-none">
                      {/* Top-left */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary-500" />
                      {/* Top-right */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary-500" />
                      {/* Bottom-left */}
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary-500" />
                      {/* Bottom-right */}
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary-500" />
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <CameraOff className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">Camera is off</p>
                  <p className="text-slate-500 text-sm">Click "Start Camera" to begin</p>
                </div>
              )}
            </div>

            {scanning && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Recognition Progress
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {presentCount + absentCount} / {students.length}
                  </span>
                </div>
                <Progress
                  value={presentCount + absentCount}
                  max={students.length}
                  variant="primary"
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Student list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Students
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {pendingCount} pending
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-4 h-4" />}
              >
                Import
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
              {students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {student.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {student.email}
                      </p>
                    </div>
                    <div>
                      {student.status === 'pending' ? (
                        <div className="flex gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => markManually(student.id, 'present')}
                            className="p-1.5 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => markManually(student.id, 'absent')}
                            className="p-1.5 rounded-lg bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 hover:bg-danger-200 dark:hover:bg-danger-900/50"
                          >
                            <XCircle className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ) : (
                        <Badge
                          variant={student.status === 'present' ? 'success' : 'danger'}
                          className="capitalize"
                        >
                          {student.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Complete button */}
      {(presentCount > 0 || absentCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button
            onClick={completeAttendance}
            variant="primary"
            size="lg"
            icon={<CheckCircle2 className="w-5 h-5" />}
          >
            Complete & Save Attendance
          </Button>
        </motion.div>
      )}
        </>
      )}

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
          <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            {importedStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {student.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {student.email}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-success-500" />
              </div>
            ))}
          </div>

          {/* Format Help */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              <strong>CSV Format:</strong> Name, Email (comma separated)
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

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowImportModal(false);
                setImportedStudents([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleAddImportedStudents}
              icon={<CheckCircle2 className="w-5 h-5" />}
            >
              Add Students
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherAttendance;
