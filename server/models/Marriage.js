const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Marriage = sequelize.define('Marriage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  husbandId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  wifeId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  marriageDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'marriages',
  timestamps: true,
});

module.exports = Marriage;
