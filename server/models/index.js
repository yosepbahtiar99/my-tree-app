const sequelize = require('../config/database');
const User = require('./User');
const Person = require('./Person');
const Marriage = require('./Marriage');
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

// Marriage Relationships
Marriage.belongsTo(Person, { as: 'Husband', foreignKey: 'husbandId' });
Marriage.belongsTo(Person, { as: 'Wife', foreignKey: 'wifeId' });
Person.hasMany(Marriage, { as: 'MarriagesAsHusband', foreignKey: 'husbandId' });
Person.hasMany(Marriage, { as: 'MarriagesAsWife', foreignKey: 'wifeId' });

const db = {
  sequelize,
  User,
  Person,
  Marriage,
  AuditLog
};

module.exports = db;
