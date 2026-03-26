import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import Progress from '@/components/ui/Progress';
import { detectFaceWithDescriptor, evaluateFrameQuality, findBestFaceMatch, loadFaceModels } from '@/utils/faceRecognition';

const parseTimeToMinutes = (time = '00:00:00') => {
  const [hours = 0, minutes = 0] = String(time).split(':').map(Number);
  return (hours * 60) + minutes;
};

const formatTimeShort = (time = '00:00:00') => String(time).slice(0, 5);

const FACE_MATCH_THRESHOLD = 0.56;
const MATCH_CONFIRMATION_FRAMES = 3;
const normalizeSection = (value) => String(value || '').trim().toLowerCase();

const getRequestErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallback;
};

const TeacherAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [trackingMeta, setTrackingMeta] = useState({
    status: 'idle',
    confidence: null,
    matchedName: '',
  });
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [hasAutoSelectedClass, setHasAutoSelectedClass] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const studentsRef = useRef([]);
  const confirmedMatchIdsRef = useRef(new Set());
  const scanningIntervalRef = useRef(null);
  const lastFacePromptAtRef = useRef(0);
  const pendingMatchRef = useRef({ studentId: null, frames: 0 });
  const toast = useToast();

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    let isMounted = true;

    const loadActivationData = async () => {
      const [classesResult, schedulesResult, departmentsResult, studentsResult] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/schedule'),
        api.get('/departments'),
        api.get('/students'),
      ]);

      if (!isMounted) return;

      if (classesResult.status === 'fulfilled') {
        const raw = classesResult.value.data.classes || [];
        const rawStudents = studentsResult.status === 'fulfilled' ? (studentsResult.value.data.students || []) : [];
        setAllStudents(rawStudents);
        setClasses(
          raw.map((c) => ({
            id: c.id,
            name: `${c.name} - ${c.code}`,
            section: c.section || '',
            semester: c.academicYear || '',
            departmentId: c.department?.id || null,
            students: rawStudents.filter((student) => {
              const sectionMatches = c.section
                ? normalizeSection(student.section) === normalizeSection(c.section)
                : true;
              const departmentMatches = c.department?.id
                ? Number(student.departmentId ?? student.department?.id) === Number(c.department.id)
                : true;
              return sectionMatches && departmentMatches;
            }).length,
          }))
        );
      } else {
        toast.error('Failed to load class list');
      }

      if (schedulesResult.status === 'fulfilled') {
        setSchedules(schedulesResult.value.data.schedules || []);
      }

      if (departmentsResult.status === 'fulfilled') {
        setDepartments(departmentsResult.value.data.departments || []);
      } else {
        const message = getRequestErrorMessage(
          departmentsResult.reason,
          'Failed to load departments. Please refresh and try again.'
        );
        toast.error(`Failed to load departments: ${message}`);
      }
    };

    loadActivationData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const refreshCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setCameraDevices(videoInputs);

      if (!videoInputs.length) {
        setSelectedCameraId('');
        return;
      }

      const hasSelected = videoInputs.some((device) => device.deviceId === selectedCameraId);
      if (!hasSelected) {
        setSelectedCameraId(videoInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate cameras:', error);
    }
  };

  useEffect(() => {
    refreshCameraDevices();

    if (!navigator.mediaDevices?.addEventListener) return undefined;

    const handleDeviceChange = () => {
      refreshCameraDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
  }, [selectedCameraId]);

  // Authentication state
  const [attendanceActive, setAttendanceActive] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [teacherId, setTeacherId] = useState('');
  const [showActivationModal, setShowActivationModal] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    code: '',
    section: '',
    semester: '',
    room: '',
    departmentId: '',
  });
  
  // File import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedStudents, setImportedStudents] = useState([]);
  const fileInputRef = useRef(null);

  const currentDayName = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTimeInMinutes = (currentDateTime.getHours() * 60) + currentDateTime.getMinutes();
  const activeScheduleEntries = schedules.filter((entry) => (
    entry.dayOfWeek === currentDayName &&
    parseTimeToMinutes(entry.startTime) <= currentTimeInMinutes &&
    currentTimeInMinutes < parseTimeToMinutes(entry.endTime)
  ));
  const activeClassIds = new Set(activeScheduleEntries.map((entry) => Number(entry.classId)));
  const suggestedClass = classes.find((classItem) => activeClassIds.has(Number(classItem.id))) || null;
  const sectionOptions = Array.from(new Set(classes.map((classItem) => classItem.section).filter(Boolean)));
  const filteredClasses = attendanceMode === 'manual' && selectedSection
    ? classes.filter((classItem) => classItem.section === selectedSection)
    : classes;

  const getClassStudentCount = (classItem) => allStudents.filter((student) => {
    const sectionMatches = classItem.section
      ? normalizeSection(student.section) === normalizeSection(classItem.section)
      : true;
    const departmentMatches = classItem.departmentId
      ? Number(student.departmentId ?? student.department?.id) === Number(classItem.departmentId)
      : true;
    return sectionMatches && departmentMatches;
  }).length;

  useEffect(() => {
    if (selectedClass || !suggestedClass || hasAutoSelectedClass) return;

    setSelectedClass(suggestedClass);
    setHasAutoSelectedClass(true);
    toast.info(`${suggestedClass.name} was auto-selected based on current time.`);
  }, [selectedClass, suggestedClass, hasAutoSelectedClass, toast]);

  useEffect(() => {
    if (attendanceMode !== 'manual') return;
    if (!selectedSection && sectionOptions.length > 0) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [attendanceMode, selectedSection, sectionOptions]);

  useEffect(() => {
    if (attendanceMode !== 'manual' || !selectedSection) return;
    if (selectedClass && selectedClass.section === selectedSection) return;

    const firstClassInSection = classes.find((classItem) => classItem.section === selectedSection) || null;
    setSelectedClass(firstClassInSection);
  }, [attendanceMode, selectedSection, classes, selectedClass]);

  useEffect(() => {
    if (!teacherId && user?.teacherId) {
      setTeacherId(user.teacherId);
    }
  }, [teacherId, user]);

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;

  const loadStudentsForAttendance = async (classItem = selectedClass, date = attendanceDate) => {
    if (!classItem?.id) return;

    try {
      setIsLoadingStudents(true);

      const [studentsRes, attendanceRes] = await Promise.all([
        api.get('/students'),
        api.get('/attendance', {
          params: {
            classId: classItem.id,
            date,
          },
        }),
      ]);

      const rawStudents = studentsRes.data.students || [];
      setAllStudents(rawStudents);
      const existingAttendance = attendanceRes.data.attendance || [];
      const existingByStudentId = new Map(
        existingAttendance.map((record) => [Number(record.studentId), record.status])
      );

      const filteredStudents = classItem.departmentId
        ? rawStudents.filter((student) => Number(student.department?.id) === Number(classItem.departmentId))
        : rawStudents;

      const sectionScopedStudents = classItem.section
        ? filteredStudents.filter((student) => normalizeSection(student.section) === normalizeSection(classItem.section))
        : filteredStudents;

      const mappedStudents = sectionScopedStudents.map((student) => ({
          id: student.id,
          name: student.user?.name || student.studentId,
          email: student.user?.email || '',
          status: existingByStudentId.get(Number(student.id)) || 'pending',
          faceDescriptor: (() => {
            if (!student.faceDescriptor) return null;
            try {
              const parsed = JSON.parse(student.faceDescriptor);
              return Array.isArray(parsed) ? parsed.map((value) => Number(value)) : null;
            } catch (error) {
              return null;
            }
          })(),
          faceSamples: (() => {
            if (!student.faceSamples) return [];
            try {
              const parsed = JSON.parse(student.faceSamples);
              if (!Array.isArray(parsed)) return [];
              return parsed
                .filter((sample) => Array.isArray(sample))
                .map((sample) => sample.map((value) => Number(value)))
                .filter((sample) => sample.length > 0 && !sample.some((value) => Number.isNaN(value)));
            } catch (error) {
              return [];
            }
          })(),
          avatar:
            student.user?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.studentId || String(student.id))}`,
        }));

      setStudents(mappedStudents);
      confirmedMatchIdsRef.current = new Set(
        mappedStudents
          .filter((student) => student.status === 'present')
          .map((student) => Number(student.id))
      );
    } catch (error) {
      toast.error('Unable to load students for attendance');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleActivateAttendance = () => {
    const resolvedTeacherId = teacherId.trim() || user?.teacherId || '';

    if (!attendanceMode) {
      toast.error('Please choose attendance mode: Manual or Face Recognition');
      return;
    }
    if (attendanceMode === 'manual' && !selectedSection) {
      toast.error('Please select a section');
      return;
    }
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    if (!resolvedTeacherId) {
      toast.error('Please enter your Teacher ID');
      return;
    }

    setIsVerifying(true);
    
    // Simulate API call to verify teacher ID
    setTimeout(() => {
      // Mock verification (accept any non-empty ID until backend validation is wired)
      setAttendanceActive(true);
      setShowActivationModal(false);
      loadStudentsForAttendance(selectedClass, attendanceDate);
      toast.success(`Attendance activated for ${selectedClass.name}`);
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

  const resetCreateClassForm = () => {
    setNewClassForm({
      name: '',
      code: '',
      section: selectedSection || '',
      semester: '',
      room: '',
      departmentId: '',
    });
  };

  const openCreateClassModal = () => {
    resetCreateClassForm();
    setShowCreateClassModal(true);
  };

  const handleCreateClass = async () => {
    if (!newClassForm.name.trim() || !newClassForm.code.trim()) {
      toast.error('Class name and class code are required');
      return;
    }

    setIsCreatingClass(true);

    try {
      const payload = {
        name: newClassForm.name.trim(),
        code: newClassForm.code.trim().toUpperCase(),
        section: newClassForm.section.trim() || null,
        semester: newClassForm.semester ? Number(newClassForm.semester) : null,
        room: newClassForm.room.trim() || null,
        departmentId: newClassForm.departmentId ? Number(newClassForm.departmentId) : null,
      };

      const response = await api.post('/classes', payload);
      const createdClass = response.data.class;
      const mappedClass = {
        id: createdClass.id,
        name: `${createdClass.name} - ${createdClass.code}`,
        section: createdClass.section || '',
        semester: createdClass.academicYear || '',
        departmentId: createdClass.departmentId || null,
        students: allStudents.filter((student) => {
          const sectionMatches = createdClass.section
            ? normalizeSection(student.section) === normalizeSection(createdClass.section)
            : true;
          const departmentMatches = createdClass.departmentId
            ? Number(student.departmentId ?? student.department?.id) === Number(createdClass.departmentId)
            : true;
          return sectionMatches && departmentMatches;
        }).length,
      };

      setClasses((prev) => [mappedClass, ...prev]);
      setSelectedClass(mappedClass);

      if (mappedClass.section) {
        setSelectedSection(mappedClass.section);
      }

      setShowCreateClassModal(false);
      toast.success('Class created successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create class';
      toast.error(message);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera API unavailable. Use HTTPS or localhost and a supported browser.');
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream = null;
      let lastStreamError = null;
      const preferredVideoConstraint = selectedCameraId
        ? {
            deviceId: { exact: selectedCameraId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          };
      const constraintsList = [
        {
          video: preferredVideoConstraint,
          audio: false,
        },
        { video: true, audio: false },
      ];

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (streamError) {
          lastStreamError = streamError;
          stream = null;

          // Permission rejection or blocked device should not keep retrying blindly.
          if (streamError?.name === 'NotAllowedError' || streamError?.name === 'SecurityError') {
            throw streamError;
          }
        }
      }

      if (!stream) {
        if (lastStreamError) throw lastStreamError;
        throw new Error('Unable to initialize camera stream');
      }

      if (!videoRef.current) {
        setCameraActive(true);
        for (let attempt = 0; attempt < 12 && !videoRef.current; attempt += 1) {
          // Wait briefly for React to render the preview element.
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
      }

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
        throw new Error('Camera preview element not ready');
      }

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await new Promise((resolve) => {
        if (video.readyState >= 2) {
          resolve();
          return;
        }
        const handleLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          resolve();
        };
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
      });

      try {
        await video.play();
      } catch {
        // Ignore transient autoplay rejections; stream remains attached.
      }

      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        if (videoTrack.getSettings) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) {
            setSelectedCameraId(settings.deviceId);
          }
        }

        videoTrack.onended = () => {
          streamRef.current = null;
          setCameraActive(false);
          setScanning(false);
          setDetectedFaces([]);
          toast.warning('Camera stream ended. Please start camera again.');
        };
      }

      setCameraActive(true);
      toast.success('Camera activated successfully');

      // Start tracking immediately once camera feed is ready.
      await startScanning();
    } catch (error) {
      const name = error?.name || '';
      if (name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access.');
      } else if (name === 'SecurityError') {
        toast.error('Camera blocked by browser security policy. Use HTTPS or localhost.');
      } else if (name === 'NotFoundError') {
        toast.error('No camera device found on this system.');
      } else if (name === 'NotReadableError') {
        toast.error('Camera is busy in another app. Close it and try again.');
      } else if (name === 'OverconstrainedError') {
        toast.error('Requested camera constraints are unsupported. Please retry.');
      } else if (name === 'AbortError') {
        toast.error('Camera startup was interrupted. Please retry.');
      } else {
        toast.error(error?.message || 'Failed to access camera');
      }
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }

    const activeStream = streamRef.current || videoRef.current?.srcObject;
    if (activeStream) {
      const tracks = activeStream.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setScanning(false);
    setDetectedFaces([]);
    setTrackingMeta({ status: 'idle', confidence: null, matchedName: '' });
    toast.info('Camera stopped');
  };

  const startScanning = async () => {
    if (!videoRef.current?.srcObject) {
      toast.error('Start the camera before running face recognition');
      return;
    }

    if (videoRef.current.readyState < 2 || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      toast.info('Camera is warming up. Please try again in a second.');
      return;
    }

    if (students.length === 0) {
      toast.error('No students loaded. Please load students before scanning.');
      return;
    }

    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }

    try {
      await loadFaceModels();
    } catch (error) {
      toast.error('Failed to load face recognition model. Check internet and retry.');
      return;
    }

    setScanning(true);
    setTrackingMeta({ status: 'searching', confidence: null, matchedName: '' });
    confirmedMatchIdsRef.current = new Set(
      studentsRef.current
        .filter((student) => student.status === 'present')
        .map((student) => Number(student.id))
    );
    toast.info('Face recognition started');

    scanningIntervalRef.current = setInterval(() => {
      const runRecognition = async () => {
        if (!videoRef.current) return;

        const detection = await detectFaceWithDescriptor(videoRef.current);
        if (!detection?.descriptor || !detection.box) {
          setDetectedFaces([]);
          setTrackingMeta({ status: 'no-face', confidence: null, matchedName: '' });
          pendingMatchRef.current = { studentId: null, frames: 0 };
          return;
        }

        const box = detection.box;
        const width = videoRef.current.videoWidth || 1;
        const height = videoRef.current.videoHeight || 1;
        setDetectedFaces([
          {
            id: `detected-${Date.now()}`,
            x: (box.x / width) * 100,
            y: (box.y / height) * 100,
            width: (box.width / width) * 100,
            height: (box.height / height) * 100,
          },
        ]);

        const quality = evaluateFrameQuality(videoRef.current, box);
        if (!quality.isValid) {
          setTrackingMeta({ status: 'low-quality', confidence: null, matchedName: '' });
          const now = Date.now();
          if (now - lastFacePromptAtRef.current > 7000) {
            toast.info(quality.reasons[0] || 'Improve face quality and try again.');
            lastFacePromptAtRef.current = now;
          }
          pendingMatchRef.current = { studentId: null, frames: 0 };
          return;
        }

        const candidateStudents = studentsRef.current.filter(
          (student) => student.status !== 'present' && Array.isArray(student.faceDescriptor) && student.faceDescriptor.length > 0
        );

        if (candidateStudents.length === 0) {
          const now = Date.now();
          if (now - lastFacePromptAtRef.current > 8000) {
            toast.warning('No registered face profiles found. Ask students to register face first.');
            lastFacePromptAtRef.current = now;
          }
          pendingMatchRef.current = { studentId: null, frames: 0 };
          return;
        }

        const { match, confidence } = findBestFaceMatch(detection.descriptor, candidateStudents, FACE_MATCH_THRESHOLD);
        if (!match) {
          setTrackingMeta({ status: 'face-detected', confidence: null, matchedName: '' });
          const now = Date.now();
          if (now - lastFacePromptAtRef.current > 7000) {
            toast.info('Face detected but no reliable match. Keep face centered and retry.');
            lastFacePromptAtRef.current = now;
          }
          pendingMatchRef.current = { studentId: null, frames: 0 };
          return;
        }

        const nextFrames = pendingMatchRef.current.studentId === match.id
          ? pendingMatchRef.current.frames + 1
          : 1;

        setTrackingMeta({
          status: 'matching',
          confidence,
          matchedName: match.name,
        });

        pendingMatchRef.current = { studentId: match.id, frames: nextFrames };

        if (nextFrames >= MATCH_CONFIRMATION_FRAMES) {
          if (confirmedMatchIdsRef.current.has(Number(match.id))) {
            pendingMatchRef.current = { studentId: null, frames: 0 };
            return;
          }

          setStudents((prev) =>
            prev.map((student) => (
              student.id === match.id && student.status !== 'present'
                ? { ...student, status: 'present' }
                : student
            ))
          );

          confirmedMatchIdsRef.current.add(Number(match.id));

          pendingMatchRef.current = { studentId: null, frames: 0 };
          setTrackingMeta({
            status: 'confirmed',
            confidence,
            matchedName: match.name,
          });
          toast.success(`${match.name} matched (${confidence}% confidence) and marked present.`);
        }
      };

      runRecognition().catch(() => {
        const now = Date.now();
        if (now - lastFacePromptAtRef.current > 8000) {
          toast.error('Recognition failed for this frame. Please keep camera stable.');
          lastFacePromptAtRef.current = now;
        }
      });
    }, 300);
  };

  const pauseScanning = () => {
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }
    setScanning(false);
    setDetectedFaces([]);
    setTrackingMeta({ status: 'paused', confidence: null, matchedName: '' });
    pendingMatchRef.current = { studentId: null, frames: 0 };
    toast.info('Face recognition paused');
  };

  const markManually = (studentId, status) => {
    const student = students.find((s) => s.id === studentId);
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
    if (student) {
      toast.success(`${student.name} marked ${status}`);
    }
  };

  const completeAttendance = async () => {
    if (!selectedClass?.id) {
      toast.error('No class selected');
      return;
    }

    const finalizedStudents = students.map((student) =>
      student.status === 'pending' ? { ...student, status: 'absent' } : student
    );

    if (finalizedStudents.length === 0) {
      toast.error('No students available to save attendance');
      return;
    }

    setStudents(finalizedStudents);
    setIsSavingAttendance(true);

    try {
      await Promise.all(
        finalizedStudents.map((student) =>
          api.post('/attendance', {
            studentId: student.id,
            classId: selectedClass.id,
            attendanceDate,
            status: student.status,
          })
        )
      );

      stopCamera();
      toast.success('Attendance completed and saved');
    } catch (error) {
      toast.error('Failed to save attendance records');
    } finally {
      setIsSavingAttendance(false);
    }
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
        onClose={() => navigate('/teacher/dashboard')}
        title="Activate Attendance Session"
      >
        {/* height is set to auto to fit content, so we can have a nice scroll if needed on smaller screens without cutting off content on larger screens */}
        <div className="space-y-6 px-4 sm:px-6 pb-6">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full text-white shadow-lg">
              <Lock className="w-12 h-12" />
            </div>
          </div>

          <div>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
              Select your class and enter your Teacher ID to activate attendance marking
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Attendance Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setAttendanceMode('manual')}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    attendanceMode === 'manual'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Manual Attendance</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Mark students as Present or Absent yourself.
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setAttendanceMode('face')}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    attendanceMode === 'face'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Face Recognition</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Use camera and AI detection for automatic marking.
                  </p>
                </motion.button>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                {' • '}
                {currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              {suggestedClass ? (
                <p className="text-xs mt-1 text-success-700 dark:text-success-300">
                  Suggested class is active now: {suggestedClass.name}
                </p>
              ) : (
                <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                  No active class at this time. You can still select a class manually.
                </p>
              )}
            </div>

            {/* Section + Class Selection */}
            <div className="space-y-4">
              {attendanceMode === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedClass(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Choose Section</option>
                    {sectionOptions.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Attendance Date
                </label>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  disabled={isVerifying}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Class
                </label>
                <div className="mb-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCreateClassModal}
                  >
                    Create Class
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {classes.length === 0 && (
                    <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        No classes available right now. Please create a class first, then try again.
                      </p>
                    </div>
                  )}
                  {attendanceMode === 'manual' && selectedSection && filteredClasses.length === 0 && (
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        No class found in section {selectedSection}.
                      </p>
                    </div>
                  )}
                  {filteredClasses.map((classItem) => (
                    (() => {
                      const activeEntry = activeScheduleEntries.find((entry) => Number(entry.classId) === Number(classItem.id));
                      return (
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
                              {activeEntry ? ` • ${formatTimeShort(activeEntry.startTime)}-${formatTimeShort(activeEntry.endTime)}` : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant={activeEntry ? 'success' : 'default'}>
                          {activeEntry ? 'Active now' : `${getClassStudentCount(classItem)} students`}
                        </Badge>
                      </div>
                    </motion.button>
                      );
                    })()
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
                  disabled={isVerifying || Boolean(user?.teacherId)}
                />
                {user?.teacherId && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Using your account Teacher ID: {user.teacherId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleActivateAttendance}
              disabled={isVerifying}
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCreateClassModal}
                >
                  Create Class
                </Button>
                <Badge variant="success" className="text-base px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Session Active
                </Badge>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {attendanceMode === 'face'
                ? 'AI face recognition is active with quality checks and multi-frame confirmation for better accuracy.'
                : `Manual attendance mode is active for ${attendanceDate}. Mark each student as present or absent.`}
            </p>
          </motion.div>

      {attendanceMode === 'manual' && (
        <Card>
          <CardBody className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-full md:w-64">
              <Input
                label="Filter Date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => loadStudentsForAttendance(selectedClass, attendanceDate)}
              loading={isLoadingStudents}
              disabled={isLoadingStudents || !selectedClass}
            >
              Load Attendance For Date
            </Button>
          </CardBody>
        </Card>
      )}

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
        {attendanceMode === 'face' && (
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
              <div className="flex items-center gap-2">
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  disabled={cameraActive}
                  className="w-56 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {cameraDevices.length === 0 && (
                    <option value="">Default Camera</option>
                  )}
                  {cameraDevices.map((device, index) => (
                    <option key={device.deviceId || `camera-${index}`} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCameraDevices}
                  disabled={cameraActive}
                >
                  Refresh
                </Button>
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
                        Resume Detection
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseScanning}
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
                    muted
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-3 left-3 z-20 rounded-lg bg-black/60 px-3 py-2 text-xs text-white backdrop-blur-sm">
                    <p className="font-semibold tracking-wide">LIVE TRACKING</p>
                    <p className="mt-1">
                      Status:{' '}
                      {trackingMeta.status === 'confirmed'
                        ? 'Matched'
                        : trackingMeta.status === 'matching'
                          ? 'Matching'
                          : trackingMeta.status === 'face-detected'
                            ? 'Face detected'
                            : trackingMeta.status === 'low-quality'
                              ? 'Low quality frame'
                              : trackingMeta.status === 'no-face'
                                ? 'No face'
                                : trackingMeta.status === 'paused'
                                  ? 'Paused'
                                  : trackingMeta.status === 'searching'
                                    ? 'Searching'
                                    : 'Idle'}
                    </p>
                    {trackingMeta.matchedName && (
                      <p className="mt-1">Student: {trackingMeta.matchedName}</p>
                    )}
                    {trackingMeta.confidence !== null && (
                      <p className="mt-1">Confidence: {trackingMeta.confidence}%</p>
                    )}
                  </div>
                  
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
        )}

        {/* Student list */}
        <Card className={attendanceMode === 'face' ? '' : 'lg:col-span-3'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Students
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isLoadingStudents
                    ? 'Loading students...'
                    : `${pendingCount} pending${attendanceMode === 'manual' ? ` • Manual mode • ${attendanceDate}` : ''}`}
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
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => markManually(student.id, 'present')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          student.status === 'present'
                            ? 'bg-success-500 text-white'
                            : 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50'
                        }`}
                        title="Mark Present"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => markManually(student.id, 'absent')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          student.status === 'absent'
                            ? 'bg-danger-500 text-white'
                            : 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 hover:bg-danger-200 dark:hover:bg-danger-900/50'
                        }`}
                        title="Mark Absent"
                      >
                        <XCircle className="w-4 h-4" />
                      </motion.button>
                      <Button
                        size="sm"
                        variant={student.status === 'pending' ? 'secondary' : 'ghost'}
                        className="!px-2 !py-1 text-xs"
                        onClick={() => markManually(student.id, 'pending')}
                        title="Mark Pending"
                      >
                        Pending
                      </Button>
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
            loading={isSavingAttendance}
            disabled={isSavingAttendance}
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

      <Modal
        isOpen={showCreateClassModal}
        onClose={() => !isCreatingClass && setShowCreateClassModal(false)}
        title="Create New Class"
      >
        <div className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g. Computer Science"
            value={newClassForm.name}
            onChange={(e) => setNewClassForm((prev) => ({ ...prev, name: e.target.value }))}
            disabled={isCreatingClass}
          />

          <Input
            label="Class Code"
            placeholder="e.g. CS101"
            value={newClassForm.code}
            onChange={(e) => setNewClassForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            disabled={isCreatingClass}
          />

          <Input
            label="Section"
            placeholder="e.g. A"
            value={newClassForm.section}
            onChange={(e) => setNewClassForm((prev) => ({ ...prev, section: e.target.value }))}
            disabled={isCreatingClass}
          />

          <Input
            label="Semester"
            type="number"
            min="1"
            max="12"
            placeholder="e.g. 1"
            value={newClassForm.semester}
            onChange={(e) => setNewClassForm((prev) => ({ ...prev, semester: e.target.value }))}
            disabled={isCreatingClass}
          />

          <Input
            label="Room"
            placeholder="e.g. B-204"
            value={newClassForm.room}
            onChange={(e) => setNewClassForm((prev) => ({ ...prev, room: e.target.value }))}
            disabled={isCreatingClass}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Department
            </label>
            <select
              value={newClassForm.departmentId}
              onChange={(e) => setNewClassForm((prev) => ({ ...prev, departmentId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isCreatingClass}
            >
              <option value="">No Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateClassModal(false)}
              disabled={isCreatingClass}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreateClass}
              loading={isCreatingClass}
              disabled={isCreatingClass}
            >
              Create Class
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherAttendance;
