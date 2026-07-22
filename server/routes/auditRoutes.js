const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Hanya Super Admin yang bisa melihat log audit
router.get('/', authenticateToken, authorizeAdmin, getAuditLogs);

module.exports = router;
