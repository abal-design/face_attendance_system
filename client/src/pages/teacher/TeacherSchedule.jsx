import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, BookOpen, GraduationCap } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { mockSchedule } from '@/utils/mockData';

const TeacherSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // week or day

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const getClassesForDay = (dayName) => {
    return mockSchedule.filter(item => item.day === dayName);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
          Class Schedule 🗓️
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          View your weekly teaching schedule
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'This Week', value: `${mockSchedule.length} Classes`, icon: Calendar, gradient: 'from-primary-500 to-primary-600' },
          { label: 'Teaching Hours', value: '24h', icon: Clock, gradient: 'from-success-500 to-success-600' },
          { label: 'Classes Today', value: getClassesForDay(daysOfWeek[new Date().getDay() - 1] || 'Monday').length, icon: BookOpen, gradient: 'from-warning-500 to-warning-600' },
          { label: 'Students', value: '120+', icon: GraduationCap, gradient: 'from-purple-500 to-purple-600' },
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

      {/* Calendar header */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateWeek('prev')}
                icon={<ChevronLeft className="w-4 h-4" />}
              />
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Week of {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateWeek('next')}
                icon={<ChevronRight className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'week' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Weekly schedule view */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {daysOfWeek.map((day, index) => {
            const classes = getClassesForDay(day);
            const isToday = index === new Date().getDay() - 1;
            
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={isToday ? 'ring-2 ring-primary-500' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {day}
                      </h3>
                      {isToday && <Badge variant="primary" size="sm">Today</Badge>}
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {classes.length > 0 ? (
                      classes.map((classItem) => (
                        <div
                          key={classItem.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {classItem.time}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            {classItem.subject}
                          </h4>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{classItem.room}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Users className="w-3 h-3" />
                              <span>{classItem.students}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No classes scheduled</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'day' && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Today's Schedule
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {mockSchedule
                .filter(item => item.day === daysOfWeek[new Date().getDay() - 1] || item.day === 'Monday')
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((classItem, index) => (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      {index < mockSchedule.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary-600">
                          {classItem.time}
                        </span>
                        <Badge variant="primary" size="sm">{classItem.type}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {classItem.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{classItem.room}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{classItem.students} students</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default TeacherSchedule;
