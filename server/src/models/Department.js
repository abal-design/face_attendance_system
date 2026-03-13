import { DataTypes } from 'sequelize';

const defineDepartment = (sequelize) => {
  const Department = sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      headTeacherId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      established: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'departments',
    }
  );

  return Department;
};

export default defineDepartment;
