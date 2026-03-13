import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentHistory from './pages/student/StudentHistory';
import StudentProfile from './pages/student/StudentProfile';
import StudentSettings from './pages/student/StudentSettings';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import TeacherSettings from './pages/teacher/TeacherSettings';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Student routes */}
                  <Route
                    path="student/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="student/attendance"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentAttendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="student/history"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="student/profile"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="student/settings"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Teacher routes */}
                  <Route
                    path="teacher/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teacher/attendance"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherAttendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teacher/students"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherStudents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teacher/reports"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherReports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teacher/schedule"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherSchedule />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teacher/settings"
                    element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <TeacherSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin routes */}
                  <Route
                    path="admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/students"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminStudents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/teachers"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminTeachers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/departments"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDepartments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/analytics"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <div className="text-center py-20">
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            Analytics
                          </h2>
                          <p className="text-slate-600 dark:text-slate-400">
                            Detailed analytics will be displayed here
                          </p>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/attendance"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <div className="text-center py-20">
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            Attendance Records
                          </h2>
                          <p className="text-slate-600 dark:text-slate-400">
                            System-wide attendance records will be displayed here
                          </p>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/reports"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <div className="text-center py-20">
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            Reports
                          </h2>
                          <p className="text-slate-600 dark:text-slate-400">
                            System reports will be displayed here
                          </p>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/settings"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Route>

                {/* 404 */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                          404
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                          Page not found
                        </p>
                        <a
                          href="/login"
                          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Go to Login
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Router>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
