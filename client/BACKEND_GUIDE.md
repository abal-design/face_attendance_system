# FaceAttend — Complete Backend Development Guide (Beginner Friendly)

> **What is this?** Your React frontend (the website) is 100% done visually, but ALL data is fake.
> When you add a student, it disappears on page reload. When you login, any email/password works.
> This guide tells you EXACTLY what to build on the backend to make everything real.

---

## TABLE OF CONTENTS
1. [Understanding the Current Situation](#1-understanding-the-current-situation)
2. [What You Need to Install](#2-what-you-need-to-install)
3. [Backend Folder Structure](#3-backend-folder-structure)
4. [Database Tables (Schema)](#4-database-tables-schema)
5. [API Endpoints — Full List with Examples](#5-api-endpoints--full-list-with-examples)
6. [How to Connect Frontend to Backend](#6-how-to-connect-frontend-to-backend)
7. [Frontend Files That Need Changes](#7-frontend-files-that-need-changes)
8. [3 Missing Pages to Build](#8-3-missing-pages-to-build)
9. [Face Recognition Setup](#9-face-recognition-setup)
10. [Email Service Setup](#10-email-service-setup)
11. [File Upload Setup](#11-file-upload-setup)
12. [Step-by-Step Build Order](#12-step-by-step-build-order)

---

## 1. UNDERSTANDING THE CURRENT SITUATION

### What is WORKING (Real):
- ✅ All pages look beautiful (UI is done)
- ✅ Dark/light theme toggle (saves to browser)
- ✅ Toast notifications (pop-up messages)
- ✅ Form validation (checks if email is valid, etc.)
- ✅ CSV file import (reads the file)
- ✅ Camera opens (for face attendance)
- ✅ Charts render (but with fake numbers)

### What is FAKE (Needs Backend):
- ❌ **Login** — Any email/password works. Role is decided by email text (if email contains "admin" → admin role)
- ❌ **Register** — Saves nothing. Just puts data in browser memory
- ❌ **All student/teacher/department data** — Hardcoded arrays in `src/utils/mockData.js`. Lost on page reload
- ❌ **Add/Edit/Delete** — Only changes React state (temporary memory). Refresh = data gone
- ❌ **Dashboard numbers** — All hardcoded (545 students, 53 teachers — just static numbers)
- ❌ **Attendance records** — Randomly generated fake data
- ❌ **Face recognition** — Camera opens but NO face detection logic exists
- ❌ **Email sending** — Just prints to console, no real email sent
- ❌ **Password change** — Shows success toast but changes nothing
- ❌ **Settings** — Shows success toast but saves nothing
- ❌ **Reports** — Fake file names with random sizes

### Key File to Know:
Your frontend already has an API file ready: `src/utils/api.js`
```javascript
// This file exists but NOTHING in the app uses it yet!
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // ← Your backend will run here
});
```
This means your **frontend is already set up to talk to `http://localhost:5000/api`**.
You just need to BUILD that backend server.

---

## 2. WHAT YOU NEED TO INSTALL

### Option A: Node.js Backend (Recommended for beginners — same language as frontend)
```bash
# You already have Node.js installed (you use it for React)
# Create a new folder for backend:
mkdir backend
cd backend
npm init -y

# Install these packages:
npm install express          # Web server framework (like Flask for Python)
npm install mongoose          # Talk to MongoDB database
npm install bcryptjs          # Hash passwords (never store plain text passwords!)
npm install jsonwebtoken      # Create JWT tokens for login sessions
npm install cors              # Allow frontend to talk to backend
npm install dotenv            # Store secret keys safely
npm install multer            # Handle file uploads (photos, CSV)
npm install nodemailer        # Send real emails
npm install express-validator # Validate data on server side

# Install dev tools:
npm install -D nodemon        # Auto-restart server when you save files
```

### Option B: Python Backend (If you know Python better)
```bash
pip install flask flask-cors flask-jwt-extended pymongo bcrypt python-dotenv
```

### Database: MongoDB
```
Why MongoDB? It stores data as JSON objects — looks exactly like your JavaScript objects.
Your mockData.js has objects like { id: 1, name: "John", email: "john@..." }
MongoDB stores data the same way!

Install: Download MongoDB Community from https://www.mongodb.com/try/download/community
Or use MongoDB Atlas (free cloud database — no install needed)
```

---

## 3. BACKEND FOLDER STRUCTURE

Create this structure inside a `backend/` folder (OUTSIDE your React project, or inside — your choice):

```
backend/
├── server.js                  ← Entry point. Starts the server on port 5000
├── .env                       ← Secret keys (NEVER commit this to Git)
├── package.json
│
├── config/
│   └── db.js                  ← MongoDB connection setup
│
├── middleware/
│   ├── auth.js                ← Checks if user is logged in (JWT verify)
│   └── roleCheck.js           ← Checks if user has permission (admin/teacher/student)
│
├── models/                    ← Database table definitions (what columns each table has)
│   ├── User.js                ← id, name, email, password, role
│   ├── Student.js             ← studentId, userId, department, year, faceEncoding
│   ├── Teacher.js             ← teacherId, userId, department, subject, experience
│   ├── Department.js          ← name, code, head, established
│   ├── Class.js               ← name, code, teacherId, departmentId, schedule
│   ├── Attendance.js          ← studentId, classId, date, status, markedBy
│   ├── Schedule.js            ← classId, day, startTime, endTime, room
│   ├── Notification.js        ← userId, title, message, read
│   └── Report.js              ← generatedBy, type, fileUrl
│
├── routes/                    ← URL paths the frontend will call
│   ├── auth.js                ← /api/auth/login, /api/auth/register
│   ├── students.js            ← /api/students (GET, POST, PUT, DELETE)
│   ├── teachers.js            ← /api/teachers (GET, POST, PUT, DELETE)
│   ├── departments.js         ← /api/departments
│   ├── classes.js             ← /api/classes
│   ├── attendance.js          ← /api/attendance
│   ├── schedule.js            ← /api/schedule
│   ├── reports.js             ← /api/reports
│   ├── dashboard.js           ← /api/dashboard/stats
│   ├── notifications.js       ← /api/notifications
│   └── settings.js            ← /api/settings
│
├── controllers/               ← The actual logic (what happens when a URL is called)
│   ├── authController.js
│   ├── studentController.js
│   ├── teacherController.js
│   ├── departmentController.js
│   ├── classController.js
│   ├── attendanceController.js
│   ├── scheduleController.js
│   ├── reportController.js
│   ├── dashboardController.js
│   ├── notificationController.js
│   └── settingsController.js
│
├── utils/
│   ├── generateId.js          ← Generate STU-2026-XXXX / TCH-2026-XXXX IDs
│   ├── generatePassword.js    ← Generate random passwords
│   └── sendEmail.js           ← Send real emails via Nodemailer
│
└── uploads/                   ← Folder for uploaded files (photos, CSVs)
    ├── avatars/
    └── reports/
```

### What each folder does (simple explanation):
| Folder | Purpose | Real-life analogy |
|---|---|---|
| `models/` | Defines WHAT data looks like | Like a form template (name field, email field, etc.) |
| `routes/` | Defines WHICH URLs exist | Like a phone directory (call this number for this service) |
| `controllers/` | Defines WHAT HAPPENS when URL is called | Like the person who picks up the phone and does the work |
| `middleware/` | Runs BEFORE the controller | Like a security guard checking your ID before letting you in |
| `config/` | Setup/connection files | Like plugging in the cables before turning on the machine |
| `utils/` | Helper functions used everywhere | Like tools in a toolbox |

---

## 4. DATABASE TABLES (SCHEMA)

### What is a Schema?
A schema is like a blueprint. It says "every student MUST have a name, email, and department."
If someone tries to save a student without an email, the database will reject it.

### Table 1: Users (for login)
```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },                    // "John Doe"
  email:     { type: String, required: true, unique: true },      // "john@example.com" (no duplicates)
  password:  { type: String, required: true },                    // "$2b$10$..." (hashed, NOT plain text!)
  role:      { type: String, enum: ['admin', 'teacher', 'student'], required: true },  // only these 3 allowed
  avatar:    { type: String, default: '' },                       // profile photo URL
  isActive:  { type: Boolean, default: true },                    // can disable accounts without deleting
}, { timestamps: true });  // auto-adds createdAt, updatedAt

module.exports = mongoose.model('User', userSchema);
```

### Table 2: Students
```javascript
// models/Student.js
const studentSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // links to Users table
  studentId:     { type: String, unique: true, required: true },   // "STU-2026-4A7F" (auto-generated)
  department:    { type: String, required: true },                  // "Computer Science"
  year:          { type: Number, required: true },                  // 1, 2, 3, or 4
  semester:      { type: Number },                                  // 1-8
  phone:         { type: String },
  address:       { type: String },
  guardianName:  { type: String },
  guardianPhone: { type: String },
  faceEncoding:  { type: [Number] },                               // array of numbers from face recognition
  status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
```

### Table 3: Teachers
```javascript
// models/Teacher.js
const teacherSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId:   { type: String, unique: true, required: true },     // "TCH-2026-B3E1"
  department:  { type: String, required: true },
  subject:     { type: String, required: true },
  experience:  { type: Number, default: 0 },                       // years
  qualification: { type: String },                                  // "PhD", "M.Tech"
  phone:       { type: String },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
```

### Table 4: Departments
```javascript
// models/Department.js
const departmentSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },     // "Computer Science"
  code:        { type: String, required: true, unique: true },     // "CS"
  head:        { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },  // department HOD
  description: { type: String },
  established: { type: Number },                                    // year: 2010
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
```

### Table 5: Classes
```javascript
// models/Class.js
const classSchema = new mongoose.Schema({
  name:         { type: String, required: true },                  // "Data Structures"
  code:         { type: String, required: true, unique: true },    // "CS301"
  teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  students:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],  // array of student IDs
  semester:     { type: Number },
  schedule:     { type: String },                                   // "Mon, Wed, Fri - 9:00 AM"
}, { timestamps: true });
```

### Table 6: Attendance (most important table!)
```javascript
// models/Attendance.js
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date:      { type: Date, required: true },
  status:    { type: String, enum: ['present', 'absent', 'late'], required: true },
  markedBy:  { type: String, enum: ['face', 'manual', 'csv'], default: 'manual' },  // how was attendance taken
  markedAt:  { type: Date, default: Date.now },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },  // who marked it
}, { timestamps: true });

// ONE student can only have ONE attendance record per class per day
attendanceSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });
```

### Table 7: Schedule
```javascript
// models/Schedule.js
const scheduleSchema = new mongoose.Schema({
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
  startTime: { type: String, required: true },                     // "09:00"
  endTime:   { type: String, required: true },                     // "10:30"
  room:      { type: String, required: true },                     // "Room 301"
}, { timestamps: true });
```

### Table 8: Notifications
```javascript
// models/Notification.js
const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  read:    { type: Boolean, default: false },
}, { timestamps: true });
```

### Table 9: Reports
```javascript
// models/Report.js
const reportSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  type:        { type: String, enum: ['monthly', 'weekly', 'custom'], required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filters:     { type: Object },                                   // { department: "CS", month: "March" }
  fileUrl:     { type: String },                                   // path to generated PDF/Excel
  status:      { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true });
```

### Visual: How tables connect to each other
```
Users ─────┬──── Students ──── Attendance
           │         │              │
           │         └──── Classes ─┘
           │                  │
           ├──── Teachers ────┘
           │         │
           │    Departments
           │
           ├──── Notifications
           └──── Reports
```
- One User can be ONE Student OR ONE Teacher (based on role)
- One Teacher teaches MANY Classes
- One Class has MANY Students
- One Attendance record = ONE Student + ONE Class + ONE Date
- Notifications and Reports belong to ONE User

---

## 5. API ENDPOINTS — FULL LIST WITH EXAMPLES

### What is an API Endpoint?
Think of it like a restaurant menu:
- The **URL** is the dish name (`/api/students`)
- The **Method** is the action (`GET` = read, `POST` = create, `PUT` = update, `DELETE` = remove)
- The **Request** is your order (what data you send)
- The **Response** is the food you get back (what data the server returns)

---

### 5.1 AUTH ENDPOINTS (Login/Register)

#### `POST /api/auth/register`
**When is this called?** When admin creates a new student/teacher from AdminStudents or AdminTeachers page.
```
WHAT FRONTEND SENDS:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "auto-generated-password",    // from generatePassword()
  "role": "student"
}

WHAT BACKEND DOES:
  1. Check if email already exists in database → if yes, return error
  2. Hash the password: bcrypt.hash("plain-password") → "$2b$10$abc..."
  3. Save to Users table
  4. If role is "student" → also create entry in Students table with auto-generated STU-ID
  5. If role is "teacher" → also create entry in Teachers table with auto-generated TCH-ID
  6. Send welcome email with credentials
  7. Return the created user

WHAT BACKEND RETURNS:
{
  "success": true,
  "user": { "id": "abc123", "name": "John Doe", "email": "john@example.com", "role": "student" },
  "studentId": "STU-2026-4A7F",
  "generatedPassword": "xK9#mP2$vL7q"
}
```

#### `POST /api/auth/login`
**When is this called?** When user clicks "Sign In" on the Login page.
```
WHAT FRONTEND SENDS:
{
  "email": "john@example.com",
  "password": "xK9#mP2$vL7q"
}

WHAT BACKEND DOES:
  1. Find user by email in database → if not found, return "Invalid credentials"
  2. Compare password: bcrypt.compare("typed-password", "stored-hash") → true/false
  3. If false → return "Invalid credentials" (don't say "wrong password" — security reason)
  4. Create JWT token: jwt.sign({ userId: "abc123", role: "student" }, SECRET_KEY, { expiresIn: "7d" })
  5. Return user data + token

WHAT BACKEND RETURNS:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",    // real JWT token
  "user": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "avatar": "/uploads/avatars/abc123.jpg"
  }
}
```

#### `POST /api/auth/forgot-password`
**When is this called?** "Forgot password" link on Login page (you need to add this link to the frontend).
```
FRONTEND SENDS: { "email": "john@example.com" }
BACKEND DOES:
  1. Find user by email
  2. Generate a random reset token
  3. Save token to database with 1-hour expiry
  4. Send email with reset link: "https://yourapp.com/reset-password?token=xyz123"
BACKEND RETURNS: { "success": true, "message": "Reset link sent to email" }
```

#### `POST /api/auth/reset-password`
```
FRONTEND SENDS: { "token": "xyz123", "newPassword": "newSecurePass123" }
BACKEND DOES:
  1. Find the reset token in database, check if not expired
  2. Hash the new password
  3. Update user's password in database
  4. Delete the reset token
BACKEND RETURNS: { "success": true, "message": "Password updated" }
```

#### `PUT /api/auth/change-password`  🔒 (needs login)
**When is this called?** StudentSettings, TeacherSettings — "Change Password" form.
```
FRONTEND SENDS: { "currentPassword": "oldPass", "newPassword": "newPass" }
BACKEND DOES:
  1. Get user from JWT token
  2. Compare currentPassword with stored hash → if wrong, return error
  3. Hash newPassword, save to database
BACKEND RETURNS: { "success": true, "message": "Password changed" }
```

---

### 5.2 STUDENT ENDPOINTS

#### `GET /api/students` 🔒 (admin, teacher)
**When is this called?** AdminStudents page loads, TeacherStudents page loads.
```
FRONTEND CALLS: GET /api/students?page=1&limit=10&search=john&department=Computer Science&status=active

WHAT THOSE PARAMETERS MEAN:
  ?page=1          → Show first page (for pagination — 10 per page)
  &limit=10        → 10 students per page
  &search=john     → Filter by name or email containing "john"
  &department=CS   → Only students from Computer Science
  &status=active   → Only active students

BACKEND DOES:
  1. Verify JWT token (is user logged in?)
  2. Check role is admin or teacher
  3. Query database with filters
  4. Return paginated results

BACKEND RETURNS:
{
  "success": true,
  "students": [
    {
      "id": "abc123",
      "studentId": "STU-2026-4A7F",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Computer Science",
      "year": 3,
      "attendance": 92,              // calculated from Attendance table
      "status": "active",
      "avatar": "/uploads/avatars/abc123.jpg"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalStudents": 48
  }
}
```

#### `GET /api/students/:id` 🔒 (admin, teacher, own student)
**When is this called?** When clicking "View" on a student row.
```
FRONTEND CALLS: GET /api/students/abc123
BACKEND RETURNS: Full student object with all details
```

#### `POST /api/students` 🔒 (admin only)
**When is this called?** AdminStudents → "Add Student" → Save button.
```
FRONTEND SENDS:
{
  "name": "New Student",
  "email": "newstudent@example.com",
  "department": "Computer Science",
  "year": 1,
  "phone": "1234567890"
}

BACKEND DOES:
  1. Verify admin role
  2. Check email doesn't already exist
  3. Generate studentId: "STU-2026-XXXX"
  4. Generate random password
  5. Hash password, create User (role: student)
  6. Create Student linked to that User
  7. Send email with studentId + password
  8. Return created student + credentials

BACKEND RETURNS:
{
  "success": true,
  "student": { ... },
  "credentials": {
    "studentId": "STU-2026-4A7F",
    "password": "xK9#mP2$vL7q"
  }
}
```

#### `PUT /api/students/:id` 🔒 (admin only)
**When is this called?** AdminStudents → Edit student → Save button.
```
FRONTEND SENDS: { "name": "Updated Name", "department": "Engineering", "year": 2 }
BACKEND DOES: Find student, update fields, save
BACKEND RETURNS: { "success": true, "student": { updated student object } }
```

#### `DELETE /api/students/:id` 🔒 (admin only)
**When is this called?** AdminStudents → Delete student → Confirm.
```
FRONTEND CALLS: DELETE /api/students/abc123
BACKEND DOES:
  1. Find student
  2. Mark as inactive (soft delete) OR actually remove from database
  3. Also deactivate their User account
BACKEND RETURNS: { "success": true, "message": "Student removed" }
```

#### `POST /api/students/import-csv` 🔒 (admin only)
**When is this called?** AdminStudents → Import CSV button.
```
FRONTEND SENDS: FormData with CSV file
BACKEND DOES:
  1. Parse CSV file
  2. Validate each row (name, email required, no duplicate emails)
  3. For each valid row: create User + Student + generate credentials
  4. Send emails to all new students
  5. Return success/failure count
BACKEND RETURNS: { "success": true, "imported": 25, "failed": 3, "errors": ["Row 5: duplicate email"] }
```

---

### 5.3 TEACHER ENDPOINTS (Same pattern as Students)

| Method | URL | Who can call | Purpose |
|---|---|---|---|
| `GET` | `/api/teachers` | admin | List all teachers (with search, filter, pagination) |
| `GET` | `/api/teachers/:id` | admin, own teacher | Get one teacher details |
| `POST` | `/api/teachers` | admin | Create teacher (auto-generate TCH-ID + password + email) |
| `PUT` | `/api/teachers/:id` | admin | Update teacher info |
| `DELETE` | `/api/teachers/:id` | admin | Deactivate teacher |
| `POST` | `/api/teachers/import-csv` | admin | Bulk import from CSV |

---

### 5.4 DEPARTMENT ENDPOINTS

| Method | URL | Who can call | Purpose |
|---|---|---|---|
| `GET` | `/api/departments` | admin, teacher | List all departments |
| `POST` | `/api/departments` | admin | Create department |
| `PUT` | `/api/departments/:id` | admin | Update department |
| `DELETE` | `/api/departments/:id` | admin | Deactivate department |

---

### 5.5 ATTENDANCE ENDPOINTS (Core Feature!)

#### `POST /api/attendance/mark` 🔒 (teacher)
**When is this called?** TeacherAttendance → manually marks students present/absent.
```
FRONTEND SENDS:
{
  "classId": "class123",
  "date": "2026-03-11",
  "records": [
    { "studentId": "stu1", "status": "present" },
    { "studentId": "stu2", "status": "absent" },
    { "studentId": "stu3", "status": "present" },
    { "studentId": "stu4", "status": "late" }
  ]
}

BACKEND DOES:
  1. Verify teacher role
  2. Verify teacher is assigned to this class
  3. For each record: create/update Attendance entry
  4. Send notification to absent students (optional)
BACKEND RETURNS: { "success": true, "marked": 4 }
```

#### `POST /api/attendance/mark-face` 🔒 (teacher)
**When is this called?** TeacherAttendance → face recognition camera detects a face.
```
FRONTEND SENDS:
{
  "classId": "class123",
  "image": "data:image/jpeg;base64,/9j/4AAQ..."    // webcam snapshot as base64
}

BACKEND DOES:
  1. Decode the base64 image
  2. Run face detection (find face in image)
  3. Run face comparison against all students in this class
  4. If match found → mark that student present
  5. Return matched student info
BACKEND RETURNS:
{
  "success": true,
  "matched": true,
  "student": { "name": "John Doe", "studentId": "STU-2026-4A7F" }
}
```

#### `GET /api/attendance/class/:classId` 🔒 (teacher, admin)
**When is this called?** View attendance for a specific class.
```
FRONTEND CALLS: GET /api/attendance/class/class123?date=2026-03-11
BACKEND RETURNS:
{
  "class": { "name": "Data Structures", "code": "CS301" },
  "date": "2026-03-11",
  "totalStudents": 50,
  "present": 45,
  "absent": 5,
  "records": [
    { "student": { "name": "John", "studentId": "STU-2026-4A7F" }, "status": "present", "markedBy": "face", "time": "09:05 AM" },
    ...
  ]
}
```

#### `GET /api/attendance/student/:studentId` 🔒 (student own, teacher, admin)
**When is this called?** StudentAttendance page, StudentHistory page.
```
FRONTEND CALLS: GET /api/attendance/student/stu123?month=2026-03
BACKEND RETURNS:
{
  "student": { "name": "John Doe" },
  "attendance": {
    "totalClasses": 60,
    "present": 55,
    "absent": 5,
    "percentage": 91.67
  },
  "records": [
    { "date": "2026-03-11", "class": "Data Structures", "status": "present", "markedBy": "face" },
    ...
  ]
}
```

#### `GET /api/attendance/today` 🔒 (admin)
**When is this called?** AdminDashboard to show today's attendance overview.
```
BACKEND RETURNS:
{
  "date": "2026-03-11",
  "totalStudents": 545,
  "presentToday": 478,
  "absentToday": 67,
  "attendanceRate": 87.7,
  "byDepartment": [
    { "department": "Computer Science", "present": 200, "total": 250, "rate": 80 },
    { "department": "Engineering", "present": 170, "total": 180, "rate": 94.4 }
  ]
}
```

#### `GET /api/attendance/stats` 🔒 (admin, teacher)
**When is this called?** Dashboard charts — weekly/monthly trends.
```
FRONTEND CALLS: GET /api/attendance/stats?range=monthly&months=6
BACKEND RETURNS:
{
  "monthly": [
    { "month": "Oct 2025", "attendance": 85 },
    { "month": "Nov 2025", "attendance": 88 },
    { "month": "Dec 2025", "attendance": 82 },
    ...
  ]
}
```
This data feeds directly into the Recharts graphs on dashboards.

---

### 5.6 CLASS ENDPOINTS

| Method | URL | Who can call | Purpose |
|---|---|---|---|
| `GET` | `/api/classes` | admin, teacher | List classes (teacher sees only their own) |
| `GET` | `/api/classes/:id` | admin, teacher | Get class details + student list |
| `POST` | `/api/classes` | admin | Create a class |
| `PUT` | `/api/classes/:id` | admin | Update class |
| `DELETE` | `/api/classes/:id` | admin | Delete class |

---

### 5.7 SCHEDULE ENDPOINTS

| Method | URL | Who can call | Purpose |
|---|---|---|---|
| `GET` | `/api/schedule/teacher/:teacherId` | teacher (own) | TeacherSchedule page |
| `GET` | `/api/schedule/student/:studentId` | student (own) | StudentDashboard |
| `GET` | `/api/schedule/class/:classId` | admin, teacher | View class schedule |
| `POST` | `/api/schedule` | admin | Create schedule entry |
| `PUT` | `/api/schedule/:id` | admin | Update schedule |
| `DELETE` | `/api/schedule/:id` | admin | Delete schedule |

---

### 5.8 DASHBOARD ENDPOINTS

#### `GET /api/dashboard/admin` 🔒 (admin only)
**Returns all numbers shown on AdminDashboard page:**
```
{
  "totalStudents": 545,         // COUNT of Students table where status=active
  "totalTeachers": 53,          // COUNT of Teachers table where status=active
  "totalDepartments": 12,       // COUNT of Departments table
  "todayAttendance": 87.7,      // calculated from today's Attendance records
  "recentActivities": [         // latest 10 entries from Attendance/User creation
    { "type": "attendance", "message": "CS301 attendance marked", "time": "2 hours ago" },
    { "type": "student_added", "message": "New student John Doe added", "time": "3 hours ago" }
  ],
  "attendanceTrend": [          // for the chart
    { "month": "Oct", "rate": 85 },
    { "month": "Nov", "rate": 88 }
  ],
  "departmentWise": [           // for the pie chart
    { "name": "Computer Science", "students": 250 },
    { "name": "Engineering", "students": 180 }
  ]
}
```

#### `GET /api/dashboard/teacher` 🔒 (teacher only)
**Returns numbers for TeacherDashboard:**
```
{
  "totalStudents": 143,         // students in teacher's classes
  "todayPresent": 128,
  "todayAbsent": 15,
  "classes": 4,
  "attendanceTrend": [...],     // for chart
  "upcomingClasses": [...]      // today's remaining classes
}
```

#### `GET /api/dashboard/student` 🔒 (student only)
**Returns numbers for StudentDashboard:**
```
{
  "attendancePercentage": 92,
  "totalClasses": 120,
  "present": 110,
  "absent": 10,
  "todayClasses": [             // what classes student has today
    { "name": "Data Structures", "time": "9:00 AM", "room": "301", "status": "upcoming" }
  ],
  "monthlyTrend": [...]         // for chart
}
```

---

### 5.9 REPORT ENDPOINTS

| Method | URL | Purpose |
|---|---|---|
| `GET /api/reports` | List previously generated reports |
| `POST /api/reports/generate` | Generate a new report (PDF/Excel) from attendance data |
| `GET /api/reports/download/:id` | Download a generated report file |

---

### 5.10 NOTIFICATION ENDPOINTS

| Method | URL | Purpose |
|---|---|---|
| `GET /api/notifications` | Get all notifications for logged-in user |
| `PUT /api/notifications/:id/read` | Mark one notification as read |
| `PUT /api/notifications/read-all` | Mark all as read |

---

### 5.11 SETTINGS ENDPOINTS

| Method | URL | Purpose |
|---|---|---|
| `GET /api/settings` | Get system settings (admin) or user preferences |
| `PUT /api/settings` | Save settings |

---

### 5.12 USER PROFILE ENDPOINT

#### `GET /api/users/me` 🔒
**Returns the current logged-in user's full profile.**

#### `PUT /api/users/me` 🔒
**When is this called?** StudentProfile → Save, ProfileModal → Save.
```
FRONTEND SENDS: { "name": "Updated Name", "phone": "123...", "address": "..." }
BACKEND DOES: Update user + student/teacher record
BACKEND RETURNS: { "success": true, "user": { updated user } }
```

#### `POST /api/users/me/avatar` 🔒
**When is this called?** Profile photo upload.
```
FRONTEND SENDS: FormData with image file
BACKEND DOES: Save image to uploads/avatars/, update user.avatar field
BACKEND RETURNS: { "success": true, "avatarUrl": "/uploads/avatars/abc123.jpg" }
```

---

## 6. HOW TO CONNECT FRONTEND TO BACKEND

### Step 1: Your frontend already has the API client ready!
File: `src/utils/api.js` — already configured:
- Base URL: `http://localhost:5000/api`
- Automatically adds JWT token to every request
- Automatically redirects to login if token expires (401 error)

### Step 2: Example — Replacing mock students with real API call

**CURRENT CODE (in AdminStudents.jsx):**
```javascript
import { mockStudents } from '../../utils/mockData';

// Inside the component:
const [students, setStudents] = useState(mockStudents);  // ← FAKE data
```

**WHAT IT SHOULD BECOME:**
```javascript
import api from '../../utils/api';  // ← import the API client

// Inside the component:
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(true);

// Fetch real data when page loads
useEffect(() => {
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students', {
        params: { page, limit: 10, search: searchQuery, department: filterDepartment }
      });
      setStudents(response.data.students);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };
  fetchStudents();
}, [page, searchQuery, filterDepartment]);
```

**Save student (current: just adds to local array):**
```javascript
// CURRENT (fake):
setStudents([...students, newStudent]);

// SHOULD BECOME (real):
const response = await api.post('/students', studentData);
if (response.data.success) {
  toast.success('Student created!');
  fetchStudents();  // re-fetch the list from API
}
```

**Delete student:**
```javascript
// CURRENT (fake):
setStudents(students.filter(s => s.id !== studentId));

// SHOULD BECOME (real):
await api.delete(`/students/${studentId}`);
toast.success('Student deleted');
fetchStudents();  // re-fetch
```

### Step 3: Example — Replacing mock login with real login

**CURRENT CODE (in AuthContext.jsx):**
```javascript
const login = async (email, password) => {
  // Fake — accepts anything, role from email text
  const mockUser = {
    role: email.includes('admin') ? 'admin' : 'student',
  };
  const mockToken = 'mock-jwt-token-' + Date.now();
};
```

**WHAT IT SHOULD BECOME:**
```javascript
import api from '../utils/api';

const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    setUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);  // real JWT token

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Login failed'
    };
  }
};
```

---

## 7. FRONTEND FILES THAT NEED CHANGES

Here is EVERY file that needs to be modified, and WHAT to change:

### Contexts (the brain of the app):
| File | What to change |
|---|---|
| `src/contexts/AuthContext.jsx` | Replace mock login/register/logout with real API calls. Add token refresh. |
| `src/contexts/NotificationContext.jsx` | Replace hardcoded notifications with `GET /api/notifications`. |

### Admin Pages:
| File | What to change |
|---|---|
| `src/pages/admin/AdminDashboard.jsx` | Replace hardcoded stats with `GET /api/dashboard/admin`. |
| `src/pages/admin/AdminStudents.jsx` | Replace `mockStudents` with `GET/POST/PUT/DELETE /api/students`. |
| `src/pages/admin/AdminTeachers.jsx` | Replace `mockTeachers` with `GET/POST/PUT/DELETE /api/teachers`. |
| `src/pages/admin/AdminDepartments.jsx` | Replace `mockDepartments` with `GET/POST/PUT/DELETE /api/departments`. |
| `src/pages/admin/AdminSettings.jsx` | Replace local state with `GET/PUT /api/settings`. |

### Teacher Pages:
| File | What to change |
|---|---|
| `src/pages/teacher/TeacherDashboard.jsx` | Replace hardcoded stats with `GET /api/dashboard/teacher`. |
| `src/pages/teacher/TeacherAttendance.jsx` | Connect to `POST /api/attendance/mark` + face recognition API. |
| `src/pages/teacher/TeacherStudents.jsx` | Replace `mockStudents` with `GET /api/students` (filtered by teacher's classes). |
| `src/pages/teacher/TeacherReports.jsx` | Replace `generateReports()` with `GET/POST /api/reports`. |
| `src/pages/teacher/TeacherSchedule.jsx` | Replace `mockSchedule` with `GET /api/schedule/teacher/:id`. |
| `src/pages/teacher/TeacherSettings.jsx` | Connect password change to `PUT /api/auth/change-password`. |

### Student Pages:
| File | What to change |
|---|---|
| `src/pages/student/StudentDashboard.jsx` | Replace hardcoded stats with `GET /api/dashboard/student`. |
| `src/pages/student/StudentAttendance.jsx` | Replace hardcoded classes with `GET /api/attendance/student/:id`. |
| `src/pages/student/StudentProfile.jsx` | Connect to `GET/PUT /api/users/me`. |
| `src/pages/student/StudentSettings.jsx` | Connect password change + notification preferences. |

### Files that can be DELETED after backend is ready:
| File | Why |
|---|---|
| `src/utils/mockData.js` | All data will come from database |

### Files that need UPDATING:
| File | Why |
|---|---|
| `src/utils/helpers.js` | `sendCredentialsEmail()` — remove the fake setTimeout, email will be sent by backend now |

---

## 8. 3 MISSING PAGES TO BUILD

These routes exist in `src/App.jsx` but show placeholder text:

### Page 1: `src/pages/admin/AdminAnalytics.jsx`
**What it should show:**
- Attendance trends (line chart) — filterable by date range, department
- Department comparison (bar chart)
- Top performing students
- At-risk students (below 75% attendance)
- Export charts to PDF

**API it needs:** `GET /api/attendance/stats?range=custom&from=2025-01-01&to=2026-03-11&department=CS`

### Page 2: `src/pages/admin/AdminAttendance.jsx`
**What it should show:**
- Searchable table of ALL attendance records across all classes
- Filter by date, department, class, teacher, status
- Pagination
- "Mark Override" — admin can fix attendance records

**API it needs:** `GET /api/attendance?page=1&date=2026-03-11&department=CS&status=absent`

### Page 3: `src/pages/admin/AdminReports.jsx`
**What it should show:**
- List of previously generated reports (table)
- "Generate Report" button with options: type (monthly/weekly/custom), date range, department
- Download button for each report

**API it needs:** `GET /api/reports`, `POST /api/reports/generate`, `GET /api/reports/download/:id`

---

## 9. FACE RECOGNITION SETUP

### What you need to understand:
Face recognition has 3 steps:
1. **Enrollment** — Take a student's photo and save a "face encoding" (array of 128 numbers that describe the face)
2. **Detection** — Find a face in a webcam image
3. **Matching** — Compare detected face with saved encodings to identify who it is

### Option A: face-api.js (runs in the browser — easiest to start)
```bash
npm install face-api.js
```
- Works entirely in the browser (no Python needed)
- Download model files (~6MB) from face-api.js GitHub
- Decent accuracy for small groups (< 100 students per class)
- Slower on weak computers

### Option B: Python backend with OpenCV + face_recognition (more accurate)
```bash
pip install flask face_recognition opencv-python numpy
```
- More accurate
- Faster (runs on server, not in browser)
- Frontend sends webcam image to backend → backend returns matched student
- This is the recommended approach for production

### What to add to the frontend:
```
src/components/
  FaceCapture.jsx              ← Webcam component that captures frames
  FaceEnrollment.jsx           ← Modal shown during student creation to capture face photo
```

### How it connects:
1. **During student creation (AdminStudents):**
   - After admin fills in student details → show FaceEnrollment modal
   - Capture 3-5 photos of the student
   - Send to backend: `POST /api/students/:id/enroll-face`
   - Backend calculates face encoding and saves to Students table

2. **During attendance (TeacherAttendance):**
   - Camera captures frame every 2 seconds
   - Send to backend: `POST /api/attendance/mark-face`
   - Backend detects face, compares with enrolled faces, returns match
   - Frontend marks student as present

---

## 10. EMAIL SERVICE SETUP

### What needs real email:
1. **When admin creates student/teacher** → Send their ID and password
2. **Forgot password** → Send reset link
3. **Low attendance alert** (optional) → Notify student when attendance < 75%

### How to set it up (using Nodemailer + Gmail):

```javascript
// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,        // your-app@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD  // NOT your Gmail password!
                                          // Generate "App Password" from Google Account settings
  }
});

const sendCredentialsEmail = async (to, name, userId, password) => {
  await transporter.sendMail({
    from: '"FaceAttend" <your-app@gmail.com>',
    to: to,
    subject: 'Your FaceAttend Login Credentials',
    html: `
      <h2>Welcome to FaceAttend, ${name}!</h2>
      <p>Your login credentials:</p>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please change your password after first login.</p>
    `
  });
};
```

### .env file (NEVER commit this to Git!):
```
EMAIL_USER=yourapp@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### For production: Use SendGrid or AWS SES instead of Gmail (Gmail has a 500 email/day limit).

---

## 11. FILE UPLOAD SETUP

### What needs file upload:
1. **Profile photos** — student/teacher avatars
2. **CSV import** — bulk student/teacher creation
3. **Report downloads** — generated PDF/Excel files

### Setup with Multer (Node.js):
```javascript
// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');          // save to this folder
  },
  filename: (req, file, cb) => {
    cb(null, req.user.id + path.extname(file.originalname));  // abc123.jpg
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG/PNG images allowed'));
  }
});
```

---

## 12. STEP-BY-STEP BUILD ORDER

Build in this order. Each step makes something NEW work:

### Step 1: Basic Server + Database Connection
**What you build:**
- `server.js` — Express app listening on port 5000
- `config/db.js` — MongoDB connection
- `.env` — Store MongoDB URL + JWT secret

**What starts working:** Server runs, connects to database
```
Test: Open http://localhost:5000/api → should return { message: "API running" }
```

### Step 2: User Registration + Login
**What you build:**
- `models/User.js`
- `routes/auth.js` + `controllers/authController.js`
- `middleware/auth.js` (JWT verify)

**What you change on frontend:**
- `src/contexts/AuthContext.jsx` — replace mock login/register

**What starts working:** Real login! Wrong password = error. Right password = success.

### Step 3: Student CRUD
**What you build:**
- `models/Student.js`
- `routes/students.js` + `controllers/studentController.js`
- `utils/generateId.js`

**What you change on frontend:**
- `src/pages/admin/AdminStudents.jsx` — replace mockStudents with API calls

**What starts working:** Add a student → refresh page → student still there!

### Step 4: Teacher CRUD
**Same pattern as Step 3 for teachers.**

### Step 5: Department CRUD
**Same pattern for departments.**

### Step 6: Email Service
**What you build:**
- `utils/sendEmail.js`
- Update student/teacher creation to send email

**What starts working:** Create student → real email arrives with credentials.

### Step 7: Classes + Schedule
**What you build:**
- `models/Class.js`, `models/Schedule.js`
- Routes + controllers for both

**What starts working:** TeacherSchedule shows real schedule.

### Step 8: Attendance Marking (Manual)
**What you build:**
- `models/Attendance.js`
- `routes/attendance.js` + `controllers/attendanceController.js`

**What you change on frontend:**
- `src/pages/teacher/TeacherAttendance.jsx` — send attendance to API

**What starts working:** Teacher marks attendance → it's saved → viewable next day.

### Step 9: Dashboard Stats
**What you build:**
- `routes/dashboard.js` + `controllers/dashboardController.js`
- Aggregation queries (COUNT students, CALCULATE attendance %)

**What you change on frontend:**
- All 3 dashboard pages — replace hardcoded numbers

**What starts working:** Dashboard shows REAL numbers from database.

### Step 10: Face Recognition
**What you build:**
- Face enrollment endpoint (save face encoding)
- Face matching endpoint (compare webcam frame)
- Python service OR face-api.js integration

**What starts working:** Camera recognizes faces and marks attendance automatically.

### Step 11: Reports + Missing Pages
**What you build:**
- Report generation (PDF/Excel from attendance data)
- 3 missing admin pages (Analytics, Attendance Records, Reports)

### Step 12: Notifications + Polish
**What you build:**
- Real notification system
- Password reset flow
- Profile photo upload
- Final testing

---

## QUICK REFERENCE: server.js Starter Template

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));  // your React dev server
app.use(express.json());                               // parse JSON bodies
app.use('/uploads', express.static('uploads'));         // serve uploaded files

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api', (req, res) => res.json({ message: 'FaceAttend API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## QUICK REFERENCE: .env Template
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/faceattend
JWT_SECRET=your-super-secret-key-change-this-to-random-string
JWT_EXPIRE=7d
EMAIL_USER=yourapp@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

## QUICK REFERENCE: config/db.js
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## QUICK REFERENCE: middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// This middleware checks: "Is the user logged in?"
const protect = async (req, res, next) => {
  try {
    // Get token from header: "Bearer eyJhbG..."
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    // Verify token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user and attach to request
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();  // continue to the actual route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// This middleware checks: "Does the user have the right role?"
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = { protect, authorize };
```

---

**TOTAL COUNT:**
- **9 Database Models** to create
- **12 Route files** to create
- **12 Controller files** to create
- **2 Middleware files** to create
- **3 Utility files** to create
- **16 Frontend pages** to update (replace mock data with API calls)
- **1 Context file** to update (AuthContext)
- **3 New admin pages** to build
- **1 File to delete** (mockData.js — after everything works)
