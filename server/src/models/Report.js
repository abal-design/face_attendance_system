import { DataTypes } from 'sequelize';

const defineReport = (sequelize) => {
  const Report = sequelize.define(
    'Report',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      generatedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      fileUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fileSize: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'completed',
      },
    },
    {
      tableName: 'reports',
    }
  );

  return Report;
};

export default defineReport;
