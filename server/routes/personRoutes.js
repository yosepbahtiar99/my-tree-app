const express = require('express');
const multer = require('multer');
const path = require('path');
const { getAllPersons, createPerson, updatePerson, deletePerson, getTreeData, uploadPhoto } = require('../controllers/personController');
const { authenticateToken, requireActive } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Public Routes (Bisa diakses siapa saja untuk melihat Tree)
router.get('/', getAllPersons);
router.get('/tree', getTreeData);

// Protected Routes (Hanya Editor yang sudah aktif)
router.post('/', authenticateToken, requireActive, createPerson);
router.put('/:id', authenticateToken, requireActive, updatePerson);
router.delete('/:id', authenticateToken, requireActive, deletePerson);
router.post('/upload', authenticateToken, requireActive, upload.single('photo'), uploadPhoto);

module.exports = router;
