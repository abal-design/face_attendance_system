import { DataTypes } from 'sequelize';

const defineClass = (sequelize) => {
  const ClassModel = sequelize.define(
    'Class',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      teacherId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      departmentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      section: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      semester: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      academicYear: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      room: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'classes',
    }
  );

  return ClassModel;
};

export default defineClass;
