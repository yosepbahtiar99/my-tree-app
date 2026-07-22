const express = require('express');
const { register, login, getPendingUsers, approveUser, logout, getAllUsers, deleteUser, changePassword } = require('../controllers/authController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/change-password', authenticateToken, changePassword);

// Rute khusus Super Admin
router.get('/pending-users', authenticateToken, authorizeAdmin, getPendingUsers);
router.put('/approve/:id', authenticateToken, authorizeAdmin, approveUser);

router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);
router.delete('/users/:id', authenticateToken, authorizeAdmin, deleteUser);

module.exports = router;
