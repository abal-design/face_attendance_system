import { DataTypes } from 'sequelize';

const defineUser = (sequelize) => {
  const User = sequelize.define(
    'User',
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
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'teacher', 'student'),
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'users',
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
    }
  );

  return User;
};

export default defineUser;
