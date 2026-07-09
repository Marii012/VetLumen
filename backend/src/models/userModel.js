// backend/src/models/userModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database-remote');

const User = sequelize.define('User', {
  id_user: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_user'
  },

  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'first_name'
  },

  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'last_name'
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'email'
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password'
  },

  id_role: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_role'
  }

}, {
  tableName: 'USER',
  timestamps: false,
  id: false
});

module.exports = User;