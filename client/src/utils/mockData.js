// Mock data for the application

export const mockStudents = [
  { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Computer Science', year: 3, attendance: 92, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Computer Science', year: 3, attendance: 88, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane', status: 'active' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', department: 'Engineering', year: 2, attendance: 95, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', status: 'active' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', department: 'Computer Science', year: 3, attendance: 85, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'active' },
  { id: 5, name: 'Tom Brown', email: 'tom@example.com', department: 'Business', year: 1, attendance: 78, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', status: 'active' },
  { id: 6, name: 'Emily Davis', email: 'emily@example.com', department: 'Computer Science', year: 3, attendance: 91, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', status: 'active' },
  { id: 7, name: 'David Wilson', email: 'david@example.com', department: 'Engineering', year: 2, attendance: 87, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', status: 'active' },
  { id: 8, name: 'Lisa Anderson', email: 'lisa@example.com', department: 'Arts', year: 1, attendance: 82, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', status: 'active' },
];

export const mockTeachers = [
  { id: 1, name: 'Dr. Robert Smith', email: 'robert.smith@example.com', employeeId: 'T001', department: 'Computer Science', subject: 'Data Structures', experience: 15, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert', status: 'active' },
  { id: 2, name: 'Prof. Mary Johnson', email: 'mary.johnson@example.com', employeeId: 'T002', department: 'Computer Science', subject: 'Algorithms', experience: 12, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary', status: 'active' },
  { id: 3, name: 'Dr. James Williams', email: 'james.williams@example.com', employeeId: 'T003', department: 'Engineering', subject: 'Thermodynamics', experience: 10, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', status: 'active' },
  { id: 4, name: 'Prof. Patricia Brown', email: 'patricia.brown@example.com', employeeId: 'T004', department: 'Business', subject: 'Marketing', experience: 8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia', status: 'active' },
];

export const mockDepartments = [
  { id: 1, name: 'Computer Science', code: 'CS', head: 'Dr. Robert Smith', students: 250, teachers: 18, established: 2010 },
  { id: 2, name: 'Engineering', code: 'ENG', head: 'Dr. James Williams', students: 180, teachers: 15, established: 2008 },
  { id: 3, name: 'Business Administration', code: 'BUS', head: 'Prof. Patricia Brown', students: 120, teachers: 10, established: 2012 },
  { id: 4, name: 'Arts & Humanities', code: 'ART', head: 'Dr. Linda Garcia', students: 95, teachers: 8, established: 2015 },
];

export const mockClasses = [
  { id: 1, name: 'Data Structures', code: 'CS301', teacher: 'Dr. Robert Smith', department: 'Computer Science', schedule: 'Mon, Wed, Fri - 9:00 AM', students: 50 },
  { id: 2, name: 'Algorithms', code: 'CS302', teacher: 'Prof. Mary Johnson', department: 'Computer Science', schedule: 'Tue, Thu - 11:00 AM', students: 45 },
  { id: 3, name: 'Thermodynamics', code: 'ENG201', teacher: 'Dr. James Williams', department: 'Engineering', schedule: 'Mon, Wed - 2:00 PM', students: 48 },
  { id: 4, name: 'Marketing Fundamentals', code: 'BUS101', teacher: 'Prof. Patricia Brown', department: 'Business', schedule: 'Tue, Thu - 10:00 AM', students: 40 },
];

export const generateAttendanceHistory = (studentId, months = 6) => {
  const history = [];
  const today = new Date();
  
  for (let i = 0; i < months * 20; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    history.push({
      id: i + 1,
      date: date.toISOString().split('T')[0],
      subject: mockClasses[Math.floor(Math.random() * mockClasses.length)].name,
      status: Math.random() > 0.1 ? 'present' : 'absent',
      time: '09:00 AM',
      markedBy: 'Face Recognition',
    });
  }
  
  return history.slice(0, 100);
};

export const generateReports = (type = 'monthly') => {
  const reports = [];
  const types = ['monthly', 'weekly', 'custom'];
  
  for (let i = 1; i <= 10; i++) {
    reports.push({
      id: i,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Attendance Report ${i}`,
      type,
      generatedBy: 'System',
      date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed',
      fileSize: `${Math.floor(Math.random() * 500 + 100)} KB`,
    });
  }
  
  return reports;
};

export const mockSchedule = [
  { id: 1, day: 'Monday', time: '09:00 AM - 10:30 AM', subject: 'Data Structures', room: 'Room 301', class: 'CS-3A' },
  { id: 2, day: 'Monday', time: '02:00 PM - 03:30 PM', subject: 'Algorithms', room: 'Room 302', class: 'CS-3B' },
  { id: 3, day: 'Tuesday', time: '11:00 AM - 12:30 PM', subject: 'Database Systems', room: 'Lab 101', class: 'CS-3A' },
  { id: 4, day: 'Wednesday', time: '09:00 AM - 10:30 AM', subject: 'Data Structures', room: 'Room 301', class: 'CS-3A' },
  { id: 5, day: 'Wednesday', time: '02:00 PM - 03:30 PM', subject: 'Software Engineering', room: 'Room 303', class: 'CS-4A' },
  { id: 6, day: 'Thursday', time: '11:00 AM - 12:30 PM', subject: 'Database Systems', room: 'Lab 101', class: 'CS-3A' },
  { id: 7, day: 'Friday', time: '09:00 AM - 10:30 AM', subject: 'Data Structures', room: 'Room 301', class: 'CS-3A' },
];
