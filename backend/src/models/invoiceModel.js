const { DataTypes } = require('sequelize');
const sequelize = require('../database/database-remote');

const Invoice = sequelize.define('Invoice', {

  id_invoice: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_invoice'
  },

  num_fatura: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'num_fatura'
  },

  data_emissao: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_emissao'
  },

  total_bruto: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    field: 'total_bruto'
  },

  total_impostos: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    field: 'total_impostos'
  },

  total_liquido: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    field: 'total_liquido'
  },

  estado_pagamento: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'estado_pagamento'
  },

  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_user'
  },

  id_appointment: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_appointment'
  }

}, {
  tableName: 'INVOICE',
  timestamps: false
});

module.exports = Invoice;