import { DataTypes } from 'sequelize';

const defineSchedule = (sequelize) => {
  const Schedule = sequelize.define(
    'Schedule',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      classId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      dayOfWeek: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      room: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
    },
    {
      tableName: 'schedules',
    }
  );

  return Schedule;
};

export default defineSchedule;
