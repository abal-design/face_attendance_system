import { DataTypes } from 'sequelize';

const defineAttendance = (sequelize) => {
  const Attendance = sequelize.define(
    'Attendance',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      classId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      attendanceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'excused', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
      },
      markedBy: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      markedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'attendance',
      indexes: [
        {
          unique: true,
          fields: ['student_id', 'class_id', 'attendance_date'],
        },
      ],
    }
  );

  return Attendance;
};

export default defineAttendance;
