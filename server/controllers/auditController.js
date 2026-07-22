const { AuditLog, User, Person } = require('../models');

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [
        {
          model: User,
          as: 'Actor',
          attributes: ['email', 'role']
        },
        {
          model: Person,
          as: 'TargetPerson',
          attributes: ['fullName']
        }
      ]
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
};

module.exports = { getAuditLogs };
