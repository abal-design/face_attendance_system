/**
 * Seed script — inserts 3 accounts for each role: admin, teacher, student.
 *
 * Run:  npm run seed   (from the server/ directory)
 *       or: node database/seed.js
 *
 * Existing accounts with the same e-mail are skipped (INSERT IGNORE).
 */

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import env from '../src/config/env.js';

const pool = mysql.createPool({
  host:               env.DB_HOST,
  port:               Number(env.DB_PORT),
  user:               env.DB_USER,
  password:           env.DB_PASSWORD,
  database:           env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    5,
});

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function seed() {
  const conn = await pool.getConnection();

  try {
    /* ------------------------------------------------------------------ */
    /* Admins — 3 accounts (users table only, no profile table for admins) */
    /* ------------------------------------------------------------------ */
    const admins = [
      { name: 'Admin One',   email: 'admin1@school.com', password: 'Admin@123' },
      { name: 'Admin Two',   email: 'admin2@school.com', password: 'Admin@123' },
      { name: 'Admin Three', email: 'admin3@school.com', password: 'Admin@123' },
    ];

    console.log('Seeding admins…');
    for (const a of admins) {
      const hashed = await hashPassword(a.password);
      await conn.query(
        `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
        [a.name, a.email, hashed]
      );
      console.log(`  ✓ ${a.email}  (password: ${a.password})`);
    }

    /* ------------------------------------------------------------------ */
    /* Teachers — 3 accounts (users + teachers)                            */
    /* ------------------------------------------------------------------ */
    const teachers = [
      {
        name: 'Teacher One',   email: 'teacher1@school.com', password: 'Teacher@123',
        teacherId: 'TCH-001', subject: 'Mathematics',  qualification: 'M.Sc Mathematics', experience: 5,
        phone: '555-0101',
      },
      {
        name: 'Teacher Two',   email: 'teacher2@school.com', password: 'Teacher@123',
        teacherId: 'TCH-002', subject: 'Physics',      qualification: 'M.Sc Physics',     experience: 3,
        phone: '555-0102',
      },
      {
        name: 'Teacher Three', email: 'teacher3@school.com', password: 'Teacher@123',
        teacherId: 'TCH-003', subject: 'Computer Science', qualification: 'M.Tech CS',   experience: 7,
        phone: '555-0103',
      },
    ];

    console.log('\nSeeding teachers…');
    for (const t of teachers) {
      const hashed = await hashPassword(t.password);

      // Insert user row
      const [userResult] = await conn.query(
        `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'teacher')`,
        [t.name, t.email, hashed]
      );

      // Fetch the user id (covers IGNORE case where insert was skipped)
      const [[userRow]] = await conn.query(
        `SELECT id FROM users WHERE email = ?`, [t.email]
      );
      const userId = userRow.id;

      // Insert teacher profile
      await conn.query(
        `INSERT IGNORE INTO teachers (user_id, teacher_id, subject, qualification, experience, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, t.teacherId, t.subject, t.qualification, t.experience, t.phone]
      );

      console.log(`  ✓ ${t.email}  (password: ${t.password})`);
    }

    /* ------------------------------------------------------------------ */
    /* Students — 3 accounts (users + students)                            */
    /* ------------------------------------------------------------------ */
    const students = [
      {
        name: 'Student One',   email: 'student1@school.com', password: 'Student@123',
        studentId: 'STU-001', year: 1, semester: 1,
        phone: '555-0201', address: '123 Main St', guardianName: 'Guardian One', guardianPhone: '555-0211',
      },
      {
        name: 'Student Two',   email: 'student2@school.com', password: 'Student@123',
        studentId: 'STU-002', year: 2, semester: 3,
        phone: '555-0202', address: '456 Oak Ave',  guardianName: 'Guardian Two',  guardianPhone: '555-0212',
      },
      {
        name: 'Student Three', email: 'student3@school.com', password: 'Student@123',
        studentId: 'STU-003', year: 3, semester: 5,
        phone: '555-0203', address: '789 Elm Blvd', guardianName: 'Guardian Three', guardianPhone: '555-0213',
      },
    ];

    console.log('\nSeeding students…');
    for (const s of students) {
      const hashed = await hashPassword(s.password);

      // Insert user row
      await conn.query(
        `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')`,
        [s.name, s.email, hashed]
      );

      // Fetch the user id
      const [[userRow]] = await conn.query(
        `SELECT id FROM users WHERE email = ?`, [s.email]
      );
      const userId = userRow.id;

      // Insert student profile
      await conn.query(
        `INSERT IGNORE INTO students
           (user_id, student_id, year, semester, phone, address, guardian_name, guardian_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, s.studentId, s.year, s.semester, s.phone, s.address, s.guardianName, s.guardianPhone]
      );

      console.log(`  ✓ ${s.email}  (password: ${s.password})`);
    }

    console.log('\nSeeding complete!\n');
    console.log('='.repeat(52));
    console.log('Role     | Email                  | Password');
    console.log('-'.repeat(52));
    console.log('admin    | admin1@school.com      | Admin@123');
    console.log('admin    | admin2@school.com      | Admin@123');
    console.log('admin    | admin3@school.com      | Admin@123');
    console.log('teacher  | teacher1@school.com    | Teacher@123');
    console.log('teacher  | teacher2@school.com    | Teacher@123');
    console.log('teacher  | teacher3@school.com    | Teacher@123');
    console.log('student  | student1@school.com    | Student@123');
    console.log('student  | student2@school.com    | Student@123');
    console.log('student  | student3@school.com    | Student@123');
    console.log('='.repeat(52));

  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
