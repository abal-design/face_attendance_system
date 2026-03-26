import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import AdminStudentSections from './pages/admin/AdminStudentSections';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

const RoleHomeRedirect = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  return <Navigate to={`/${role}/dashboard`} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                    path="admin/student-sections"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminStudentSections />
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
                    path="admin/reports"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminReports />
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
                  <Route index element={<RoleHomeRedirect />} />
                </Route>

                {/* 404 */}
                

                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
                      <div className="text-center max-w-md">
                        
                        {/* Big 404 */}
                        <h1 className="text-8xl font-extrabold text-primary-600 mb-4">
                          404
                        </h1>
                  
                        {/* Message */}
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                          Oops! Page not found
                        </h2>
                  
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                          The page you’re looking for doesn’t exist or has been moved.
                        </p>
                  
                        {/* Button */}
                        <Link
                          to="/"
                          className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg shadow hover:bg-primary-700 transition-all duration-200"
                        >
                          Go to Home
                        </Link>
                  
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
