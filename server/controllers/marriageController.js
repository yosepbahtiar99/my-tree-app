const { Marriage, Person, AuditLog } = require('../models');

const getAllMarriages = async (req, res) => {
  try {
    const marriages = await Marriage.findAll({
      include: [
        { model: Person, as: 'Husband', attributes: ['id', 'fullName'] },
        { model: Person, as: 'Wife', attributes: ['id', 'fullName'] },
      ]
    });
    res.json(marriages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marriages', error: error.message });
  }
};

const createMarriage = async (req, res) => {
  try {
    const { husbandId, wifeId, marriageDate } = req.body;
    
    // Validasi input minimal ada salah satu pasangan
    if (!husbandId && !wifeId) {
      return res.status(400).json({ message: 'Harus menyertakan setidaknya Suami atau Istri' });
    }

    const marriage = await Marriage.create({ husbandId: husbandId || null, wifeId: wifeId || null, marriageDate: marriageDate || null });
    
    // Log Activity
    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE',
      targetPersonId: husbandId || wifeId, // Mengambil salah satu ID person
      details: { message: `Menambahkan data pernikahan baru.` }
    });

    res.status(201).json({ message: 'Data pernikahan berhasil ditambahkan', marriage });
  } catch (error) {
    res.status(500).json({ message: 'Error creating marriage', error: error.message });
  }
};

const deleteMarriage = async (req, res) => {
  try {
    const { id } = req.params;
    const marriage = await Marriage.findByPk(id);
    if (!marriage) return res.status(404).json({ message: 'Data pernikahan tidak ditemukan' });

    await marriage.destroy();

    // Log Activity
    await AuditLog.create({
      userId: req.user.id,
      action: 'DELETE',
      targetPersonId: marriage.husbandId || marriage.wifeId,
      details: { message: `Menghapus data pernikahan.` }
    });

    res.json({ message: 'Data pernikahan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting marriage', error: error.message });
  }
};

module.exports = { getAllMarriages, createMarriage, deleteMarriage };
