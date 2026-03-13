import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, Bell, BookOpen } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/contexts/ToastContext';

// Mock data for today's classes
const todayClasses = [
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
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState(todayClasses);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const completedToday = classes.filter(c => c.status === 'completed' && c.attended).length;
  const totalToday = classes.filter(c => c.status !== 'upcoming').length;
  const upcomingClasses = classes.filter(c => c.status === 'upcoming').length;

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
          {formatDate(new Date())} - Track your attendance for today's classes
        </p>
      </motion.div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Classes Attended', value: `${completedToday}/${totalToday}`, icon: CheckCircle2, gradient: 'from-success-500 to-success-700' },
          { label: 'Current Class', value: todayClasses.find(c => c.status === 'ongoing')?.subject || 'None', icon: Clock, gradient: 'from-warning-500 to-warning-700', small: true },
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
          </div>
        </CardBody>
      </Card>

      {/* Schedule Modal */}
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
