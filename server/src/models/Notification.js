import { DataTypes } from 'sequelize';

const defineNotification = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
        allowNull: false,
        defaultValue: 'info',
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'notifications',
    }
  );

  return Notification;
};

export default defineNotification;
