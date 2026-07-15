const express = require('express');
const { register, login, getPendingUsers, approveUser, logout } = require('../controllers/authController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Rute khusus Super Admin
router.get('/pending-users', authenticateToken, authorizeAdmin, getPendingUsers);
router.put('/approve/:id', authenticateToken, authorizeAdmin, approveUser);

module.exports = router;
