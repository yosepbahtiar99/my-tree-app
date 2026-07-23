const express = require('express');
const multer = require('multer');
const path = require('path');
const { getAllPersons, createPerson, updatePerson, deletePerson, getTreeData, uploadPhoto, addParent } = require('../controllers/personController');
const { authenticateToken, requireActive } = require('../middleware/authMiddleware');

const router = express.Router();

const fs = require('fs');

// Multer Config
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
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
router.post('/:id/add-parent', authenticateToken, requireActive, addParent);

module.exports = router;
