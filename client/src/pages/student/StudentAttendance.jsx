import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, Bell, BookOpen, Camera } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { buildStableDescriptorFromVideo, loadFaceModels } from '@/utils/faceRecognition';

const todayClassTemplate = [
  { 
    id: 1, 
    subject: 'Computer Science', 
    time: '09:00 AM - 10:30 AM', 
    teacher: 'Dr. Smith',
    room: 'Lab 101',
    status: 'completed',
    attended: true
  },
  { 
    id: 2, 
    subject: 'Mathematics', 
    time: '11:00 AM - 12:30 PM', 
    teacher: 'Prof. Johnson',
    room: 'Room 205',
    status: 'completed',
    attended: true
  },
  { 
    id: 3, 
    subject: 'Physics', 
    time: '02:00 PM - 03:30 PM', 
    teacher: 'Dr. Williams',
    room: 'Lab 203',
    status: 'ongoing',
    attended: null
  },
  { 
    id: 4, 
    subject: 'Chemistry', 
    time: '04:00 PM - 05:30 PM', 
    teacher: 'Prof. Brown',
    room: 'Lab 105',
    status: 'upcoming',
    attended: null
  },
];

const StudentAttendance = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateUser } = useAuth();
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState(todayClassTemplate);
  const [studentProfile, setStudentProfile] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  
  const completedToday = classes.filter(c => c.status === 'completed' && c.attended).length;
  const totalToday = classes.filter(c => c.status !== 'upcoming').length;
  const upcomingClasses = classes.filter(c => c.status === 'upcoming').length;

  useEffect(() => {
    let mounted = true;

    const loadLiveStudentAttendance = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const currentUserId = meRes.data.user?.id;

        const studentsRes = await api.get('/students');
        const students = studentsRes.data.students || [];
        const student = students.find((entry) => entry.user?.id === currentUserId) || null;

        if (!mounted) return;
        setStudentProfile(student);

        if (!student?.id) {
          setClasses(todayClassTemplate);
          return;
        }

        const attendanceRes = await api.get('/attendance', {
          params: { studentId: student.id },
        });

        const todayIso = new Date().toISOString().slice(0, 10);
        const todayRecords = (attendanceRes.data.attendance || []).filter(
          (record) => record.attendanceDate === todayIso
        );

        const byClassName = new Map(
          todayRecords.map((record) => [String(record.class?.name || '').toLowerCase(), record])
        );

        const merged = todayClassTemplate.map((classItem) => {
          const dbRecord = byClassName.get(classItem.subject.toLowerCase());
          if (!dbRecord) return classItem;

          return {
            ...classItem,
            status: 'completed',
            attended: dbRecord.status === 'present',
            teacher: dbRecord.markedBy || classItem.teacher,
          };
        });

        if (!mounted) return;
        setClasses(merged);
      } catch {
        if (!mounted) return;
        setClasses(todayClassTemplate);
      }
    };

    loadLiveStudentAttendance();
    const intervalId = setInterval(loadLiveStudentAttendance, 20000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadRegistrationStatus = async () => {
      try {
        const response = await api.get('/settings/avatar');
        if (!mounted) return;

        const avatar = response.data.avatar || '';
        const hasRegisteredFace = avatar.includes('/uploads/avatars/');
        setFaceRegistered(hasRegisteredFace);
      } catch (error) {
        if (mounted) {
          const saved = localStorage.getItem('studentFaceRegistered') === 'true';
          setFaceRegistered(saved);
        }
      }
    };

    loadRegistrationStatus();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!showFaceModal) {
      stopCamera();
      return;
    }

    let streamInstance;

    const startCamera = async () => {
      try {
        await loadFaceModels();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });

        streamInstance = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (error) {
        setCameraReady(false);
        toast.error('Camera/model failed to initialize. Please allow permission and check internet for model download.');
      }
    };

    startCamera();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraReady(false);
    };
  }, [showFaceModal, toast]);

  const handleMarkPresent = (classId) => {
    setClasses(prevClasses => 
      prevClasses.map(c => 
        c.id === classId ? { ...c, attended: true, status: 'completed' } : c
      )
    );
    toast.success('Attendance marked as present successfully!');
    setSelectedClass(null);
  };

  const handleViewDetails = (classItem) => {
    toast.info(`Viewing details for ${classItem.subject}`);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks ? stream.getTracks() : [];
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const handleRegisterFace = async () => {
    if (!videoRef.current || !cameraReady) {
      toast.error('Camera is not ready. Please try again.');
      return;
    }

    setIsRegisteringFace(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas not supported in this browser');
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const stableDescriptorResult = await buildStableDescriptorFromVideo(videoRef.current, {
        frames: 6,
        minValidFrames: 4,
        delayMs: 220,
      });

      if (!stableDescriptorResult.descriptor) {
        const reason = stableDescriptorResult.qualityFailure?.reasons?.[0] || 'Face quality is too low. Improve lighting and hold still.';
        throw new Error(reason);
      }

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (fileBlob) => {
            if (!fileBlob) {
              reject(new Error('Failed to capture face image'));
              return;
            }
            resolve(fileBlob);
          },
          'image/jpeg',
          0.9
        );
      });

      const formData = new FormData();
      formData.append('image', blob, 'student-face.jpg');
      formData.append('faceDescriptor', JSON.stringify(stableDescriptorResult.descriptor));
      formData.append('faceSamples', JSON.stringify(stableDescriptorResult.descriptors || []));

      const response = await api.post('/students/face-registration', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const faceImageUrl = response.data.faceImageUrl;
      if (faceImageUrl) {
        updateUser({ avatar: faceImageUrl });
      }

      localStorage.setItem('studentFaceRegistered', 'true');
      setFaceRegistered(true);
      setShowFaceModal(false);
      stopCamera();
      toast.success(`Face scanned and saved with ${stableDescriptorResult.validFrames} high-quality frames. Profile was enriched for better attendance matching.`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to register face. Please try again.';
      toast.error(message);
    } finally {
      setIsRegisteringFace(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'ongoing': return 'warning';
      case 'upcoming': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status, attended) => {
    if (status === 'completed') {
      return attended ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />;
    }
    if (status === 'ongoing') {
      return <Clock className="w-5 h-5 animate-pulse" />;
    }
    return <Bell className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          My Attendance Today
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {formatDate(new Date())} - Department: {studentProfile?.department?.name || 'Not assigned'} • Live attendance sync enabled
        </p>
      </motion.div>

      {/* Face registration reminder */}
      <Card className={`border-2 ${faceRegistered ? 'border-success-200 dark:border-success-800' : 'border-warning-200 dark:border-warning-800'}`}>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${faceRegistered ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' : 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400'}`}>
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {faceRegistered ? 'Face Registration Completed' : 'Reminder: Register Your Face'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {faceRegistered
                    ? 'Your face profile is saved. You can update it anytime from this portal.'
                    : 'Students can register their face from the student portal for faster attendance marking.'}
                </p>
              </div>
            </div>
            <Button
              variant={faceRegistered ? 'secondary' : 'primary'}
              onClick={() => setShowFaceModal(true)}
              icon={<Camera className="w-4 h-4" />}
            >
              {faceRegistered ? 'Update Face' : 'Register Face'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Classes Attended', value: `${completedToday}/${totalToday}`, icon: CheckCircle2, gradient: 'from-success-500 to-success-700' },
          { label: 'Current Class', value: classes.find(c => c.status === 'ongoing')?.subject || 'None', icon: Clock, gradient: 'from-warning-500 to-warning-700', small: true },
          { label: 'Upcoming Classes', value: upcomingClasses, icon: Calendar, gradient: 'from-primary-500 to-primary-700' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="relative overflow-hidden">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className={`${stat.small ? 'text-lg' : 'text-2xl'} font-bold text-slate-900 dark:text-slate-100 mt-1`}>{stat.value}</p>
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

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Today's Schedule
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Your classes for today
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          {classes.map((classItem, index) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedClass === classItem.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setSelectedClass(classItem.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {classItem.subject}
                    </h3>
                    <Badge variant={getStatusColor(classItem.status)} className="capitalize">
                      {classItem.status}
                    </Badge>
                    {classItem.attended && (
                      <Badge variant="success">
                        Attended
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{classItem.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{classItem.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{classItem.room}</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  {getStatusIcon(classItem.status, classItem.attended)}
                </div>
              </div>

              {/* Action buttons for ongoing class */}
              {classItem.status === 'ongoing' && selectedClass === classItem.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="flex gap-2">
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkPresent(classItem.id);
                      }}
                    >
                      Mark as Present
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(classItem);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Quick Actions
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => setShowScheduleModal(true)}
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Full Schedule
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/student/history')}
            >
              <Clock className="w-5 h-5 mr-2" />
              View Attendance History
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setShowFaceModal(true)}
            >
              <Camera className="w-5 h-5 mr-2" />
              {faceRegistered ? 'Update Face Registration' : 'Register Face'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Schedule Modal */}
      <Modal
        isOpen={showFaceModal}
        onClose={() => {
          if (isRegisteringFace) return;
          setShowFaceModal(false);
          stopCamera();
        }}
        title="Face Registration"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Register your face from the student portal to speed up attendance verification.
          </p>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <li>1. Sit in a well-lit place and face the camera.</li>
              <li>2. Keep your face centered and avoid covering your eyes.</li>
              <li>3. Click Register Face to scan and save your face in database.</li>
            </ul>
          </div>

          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 w-7 h-7 border-l-2 border-t-2 border-primary-500" />
            <div className="absolute top-3 right-3 w-7 h-7 border-r-2 border-t-2 border-primary-500" />
            <div className="absolute bottom-3 left-3 w-7 h-7 border-l-2 border-b-2 border-primary-500" />
            <div className="absolute bottom-3 right-3 w-7 h-7 border-r-2 border-b-2 border-primary-500" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-28 h-16 border-2 border-success-500/90 rounded-lg bg-success-900/20" />
            </div>
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-slate-200 text-sm font-medium">
                Waiting for camera...
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowFaceModal(false);
                stopCamera();
              }}
              disabled={isRegisteringFace}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleRegisterFace}
              loading={isRegisteringFace}
              disabled={isRegisteringFace}
              icon={<Camera className="w-5 h-5" />}
            >
              Register Face
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Weekly Schedule"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your complete schedule for this week
          </p>
          
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
            <div key={day} className="border-l-4 border-l-primary-500 pl-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{day}</h3>
              <div className="space-y-2">
                {classes.slice(0, index % 2 + 2).map((classItem) => (
                  <div key={`${day}-${classItem.id}`} className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-primary-500" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{classItem.subject}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 dark:text-slate-400">{classItem.time}</span>
                      <span className="text-slate-500 dark:text-slate-500">{classItem.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => {
              setShowScheduleModal(false);
              toast.success('Schedule downloaded successfully!');
            }}>
              Download Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentAttendance;
