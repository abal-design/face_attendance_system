import { sequelize } from '../config/db.js';
import defineUser from './User.js';
import defineDepartment from './Department.js';
import defineStudent from './Student.js';
import defineTeacher from './Teacher.js';
import defineClass from './Class.js';
import defineAttendance from './Attendance.js';
import defineSchedule from './Schedule.js';
import defineNotification from './Notification.js';
import defineReport from './Report.js';

export const User = defineUser(sequelize);
export const Department = defineDepartment(sequelize);
export const Student = defineStudent(sequelize);
export const Teacher = defineTeacher(sequelize);
export const ClassModel = defineClass(sequelize);
export const Attendance = defineAttendance(sequelize);
export const Schedule = defineSchedule(sequelize);
export const Notification = defineNotification(sequelize);
export const Report = defineReport(sequelize);

User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Department.hasMany(Student, { foreignKey: 'departmentId', as: 'students' });
Student.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Department.hasMany(Teacher, { foreignKey: 'departmentId', as: 'teachers' });
Teacher.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Teacher.hasMany(ClassModel, { foreignKey: 'teacherId', as: 'classes' });
ClassModel.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

Department.hasMany(ClassModel, { foreignKey: 'departmentId', as: 'classes' });
ClassModel.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Teacher.hasMany(Department, { foreignKey: 'headTeacherId', as: 'headedDepartments' });
Department.belongsTo(Teacher, { foreignKey: 'headTeacherId', as: 'head' });

Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendanceRecords' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

ClassModel.hasMany(Attendance, { foreignKey: 'classId', as: 'attendanceRecords' });
Attendance.belongsTo(ClassModel, { foreignKey: 'classId', as: 'class' });

ClassModel.hasMany(Schedule, { foreignKey: 'classId', as: 'scheduleEntries' });
Schedule.belongsTo(ClassModel, { foreignKey: 'classId', as: 'class' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Report, { foreignKey: 'generatedBy', as: 'generatedReports' });
Report.belongsTo(User, { foreignKey: 'generatedBy', as: 'generator' });

export default {
  sequelize,
  User,
  Department,
  Student,
  Teacher,
  ClassModel,
  Attendance,
  Schedule,
  Notification,
  Report,
};
