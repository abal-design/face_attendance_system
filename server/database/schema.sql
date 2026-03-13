-- ============================================================
-- Attendance Management System — Complete Database Schema
-- ============================================================
-- Manual run:  mysql -u root -p < database/schema.sql
-- Programmatic: server/database/db.js calls initializeDatabase()
--               which executes this file on every start (safe — IF NOT EXISTS).
-- ============================================================

CREATE DATABASE IF NOT EXISTS `attandance_management_system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `attandance_management_system`;

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED                      NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(120)                      NOT NULL,
  `email`      VARCHAR(160)                      NOT NULL,
  `password`   VARCHAR(255)                      NOT NULL,
  `role`       ENUM('admin','teacher','student') NOT NULL,
  `avatar`     VARCHAR(255)                      NOT NULL DEFAULT '',
  `is_active`  TINYINT(1)                        NOT NULL DEFAULT 1,
  `created_at` DATETIME                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME                          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. departments
-- NOTE: head_teacher_id FK is added after teachers table exists
--       to resolve the circular reference.
-- ============================================================
CREATE TABLE IF NOT EXISTS `departments` (
  `id`              INT UNSIGNED              NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(120)              NOT NULL,
  `code`            VARCHAR(20)               NOT NULL,
  `head_teacher_id` INT UNSIGNED              NULL,
  `description`     TEXT                      NULL,
  `established`     INT UNSIGNED              NULL,
  `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`      DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_departments_name` (`name`),
  UNIQUE KEY `uq_departments_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. teachers
-- ============================================================
CREATE TABLE IF NOT EXISTS `teachers` (
  `id`            INT UNSIGNED              NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED              NOT NULL,
  `teacher_id`    VARCHAR(40)               NOT NULL,
  `department_id` INT UNSIGNED              NULL,
  `subject`       VARCHAR(120)              NULL,
  `experience`    INT UNSIGNED              NOT NULL DEFAULT 0,
  `qualification` VARCHAR(120)              NULL,
  `phone`         VARCHAR(30)               NULL,
  `status`        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`    DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teachers_user_id`    (`user_id`),
  UNIQUE KEY `uq_teachers_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_teachers_user`       FOREIGN KEY (`user_id`)       REFERENCES `users`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teachers_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resolve circular reference: departments.head_teacher_id → teachers.id
-- initializeDatabase() in db.js skips this gracefully if FK already exists.
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_head_teacher`
    FOREIGN KEY (`head_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL;

-- ============================================================
-- 4. students
-- ============================================================
CREATE TABLE IF NOT EXISTS `students` (
  `id`                    INT UNSIGNED              NOT NULL AUTO_INCREMENT,
  `user_id`               INT UNSIGNED              NOT NULL,
  `student_id`            VARCHAR(40)               NOT NULL,
  `department_id`         INT UNSIGNED              NULL,
  `year`                  INT UNSIGNED              NOT NULL DEFAULT 1,
  `semester`              INT UNSIGNED              NULL,
  `phone`                 VARCHAR(30)               NULL,
  `address`               VARCHAR(255)              NULL,
  `guardian_name`         VARCHAR(120)              NULL,
  `guardian_phone`        VARCHAR(30)               NULL,
  `attendance_percentage` DECIMAL(5,2)              NOT NULL DEFAULT 0.00,
  `status`                ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`            DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_students_user_id`    (`user_id`),
  UNIQUE KEY `uq_students_student_id` (`student_id`),
  CONSTRAINT `fk_students_user`       FOREIGN KEY (`user_id`)       REFERENCES `users`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_students_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. classes
-- ============================================================
CREATE TABLE IF NOT EXISTS `classes` (
  `id`            INT UNSIGNED              NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120)              NOT NULL,
  `code`          VARCHAR(40)               NOT NULL,
  `teacher_id`    INT UNSIGNED              NULL,
  `department_id` INT UNSIGNED              NULL,
  `section`       VARCHAR(20)               NULL,
  `semester`      INT UNSIGNED              NULL,
  `academic_year` VARCHAR(20)               NULL,
  `room`          VARCHAR(60)               NULL,
  `status`        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`    DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_classes_code` (`code`),
  CONSTRAINT `fk_classes_teacher`    FOREIGN KEY (`teacher_id`)    REFERENCES `teachers`    (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_classes_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS `attendance` (
  `id`              INT UNSIGNED                                             NOT NULL AUTO_INCREMENT,
  `student_id`      INT UNSIGNED                                             NOT NULL,
  `class_id`        INT UNSIGNED                                             NOT NULL,
  `attendance_date` DATE                                                     NOT NULL,
  `status`          ENUM('present','absent','late','excused','pending')      NOT NULL DEFAULT 'pending',
  `marked_by`       VARCHAR(80)                                              NULL,
  `notes`           TEXT                                                     NULL,
  `marked_at`       DATETIME                                                 NULL,
  `created_at`      DATETIME                                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME                                                 NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_student_class_date` (`student_id`, `class_id`, `attendance_date`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_class`   FOREIGN KEY (`class_id`)   REFERENCES `classes`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS `schedules` (
  `id`          INT UNSIGNED                                                          NOT NULL AUTO_INCREMENT,
  `class_id`    INT UNSIGNED                                                          NOT NULL,
  `day_of_week` ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time`  TIME                                                                  NOT NULL,
  `end_time`    TIME                                                                  NOT NULL,
  `room`        VARCHAR(60)                                                           NULL,
  `created_at`  DATETIME                                                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME                                                              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_schedules_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT UNSIGNED                              NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED                              NOT NULL,
  `title`      VARCHAR(160)                              NOT NULL,
  `message`    TEXT                                      NOT NULL,
  `type`       ENUM('info','success','warning','error')  NOT NULL DEFAULT 'info',
  `link`       VARCHAR(255)                              NULL,
  `is_read`    TINYINT(1)                                NOT NULL DEFAULT 0,
  `created_at` DATETIME                                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME                                  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. reports
-- ============================================================
CREATE TABLE IF NOT EXISTS `reports` (
  `id`           INT UNSIGNED                         NOT NULL AUTO_INCREMENT,
  `generated_by` INT UNSIGNED                         NULL,
  `type`         VARCHAR(40)                          NOT NULL,
  `title`        VARCHAR(160)                         NOT NULL,
  `file_url`     VARCHAR(255)                         NULL,
  `file_size`    VARCHAR(40)                          NULL,
  `status`       ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed',
  `created_at`   DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reports_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
