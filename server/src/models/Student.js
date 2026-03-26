import { DataTypes } from 'sequelize';

const defineStudent = (sequelize) => {
  const Student = sequelize.define(
    'Student',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
      },
      studentId: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      departmentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      year: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      semester: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      section: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      guardianName: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      guardianPhone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      faceDescriptor: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      faceSamples: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      attendancePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'students',
    }
  );

  return Student;
};

export default defineStudent;
