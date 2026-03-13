import { DataTypes } from 'sequelize';

const defineTeacher = (sequelize) => {
  const Teacher = sequelize.define(
    'Teacher',
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
      teacherId: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      departmentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      experience: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      qualification: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'teachers',
    }
  );

  return Teacher;
};

export default defineTeacher;
