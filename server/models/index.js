const sequelize = require('../config/database');
const User = require('./User');
const Person = require('./Person');
const AuditLog = require('./AuditLog');

// Define Relationships

// Person Parents (Self Referencing)
Person.belongsTo(Person, { as: 'Father', foreignKey: 'fatherId' });
Person.belongsTo(Person, { as: 'Mother', foreignKey: 'motherId' });
Person.hasMany(Person, { as: 'ChildrenAsFather', foreignKey: 'fatherId' });
Person.hasMany(Person, { as: 'ChildrenAsMother', foreignKey: 'motherId' });

// Audit Logs Relationships
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'Actor' });
AuditLog.belongsTo(Person, { foreignKey: 'targetPersonId', as: 'TargetPerson' });

const db = {
  sequelize,
  User,
  Person,
  AuditLog
};

module.exports = db;
