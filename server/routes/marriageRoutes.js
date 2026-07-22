const express = require('express');
const router = express.Router();
const { getAllMarriages, createMarriage, deleteMarriage, updateMarriage } = require('../controllers/marriageController');
const { authenticateToken, requireActive } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, requireActive, getAllMarriages);
router.post('/', authenticateToken, requireActive, createMarriage);
router.put('/:id', authenticateToken, requireActive, updateMarriage);
router.delete('/:id', authenticateToken, requireActive, deleteMarriage);

module.exports = router;
