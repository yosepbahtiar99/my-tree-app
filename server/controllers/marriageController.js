const { Marriage, Person, AuditLog } = require('../models');

const getAllMarriages = async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (page && limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await Marriage.findAndCountAll({
        limit: limitNum,
        offset: offset,
        include: [
          { model: Person, as: 'Husband', attributes: ['id', 'fullName'] },
          { model: Person, as: 'Wife', attributes: ['id', 'fullName'] },
        ],
        order: [[{ model: Person, as: 'Husband' }, 'fullName', 'ASC']]
      });

      return res.json({
        data: rows,
        total: count,
        page: pageNum,
        totalPages: Math.ceil(count / limitNum)
      });
    }

    const marriages = await Marriage.findAll({
      include: [
        { model: Person, as: 'Husband', attributes: ['id', 'fullName'] },
        { model: Person, as: 'Wife', attributes: ['id', 'fullName'] },
      ],
      order: [[{ model: Person, as: 'Husband' }, 'fullName', 'ASC']]
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

    // Cek apakah pernikahan yang sama sudah ada (untuk mencegah duplikasi)
    const existingMarriage = await Marriage.findOne({
      where: {
        husbandId: husbandId || null,
        wifeId: wifeId || null
      }
    });

    if (existingMarriage) {
      return res.status(400).json({ message: 'Data pernikahan antara Suami dan Istri ini sudah tercatat!' });
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

const updateMarriage = async (req, res) => {
  try {
    const { id } = req.params;
    const { husbandId, wifeId, marriageDate } = req.body;
    
    const marriage = await Marriage.findByPk(id);
    if (!marriage) return res.status(404).json({ message: 'Data pernikahan tidak ditemukan' });

    if (!husbandId && !wifeId) {
      return res.status(400).json({ message: 'Harus menyertakan setidaknya Suami atau Istri' });
    }

    if (husbandId !== marriage.husbandId || wifeId !== marriage.wifeId) {
      const existingMarriage = await Marriage.findOne({
        where: {
          husbandId: husbandId || null,
          wifeId: wifeId || null
        }
      });

      if (existingMarriage && existingMarriage.id !== id) {
        return res.status(400).json({ message: 'Data pernikahan antara Suami dan Istri ini sudah tercatat!' });
      }
    }

    await marriage.update({ husbandId: husbandId || null, wifeId: wifeId || null, marriageDate: marriageDate || null });

    await AuditLog.create({
      userId: req.user.id,
      action: 'UPDATE',
      targetPersonId: husbandId || wifeId,
      details: { message: `Mengubah data pernikahan.` }
    });

    res.json({ message: 'Data pernikahan berhasil diupdate', marriage });
  } catch (error) {
    res.status(500).json({ message: 'Error updating marriage', error: error.message });
  }
};

module.exports = {
  getAllMarriages,
  createMarriage,
  deleteMarriage,
  updateMarriage
};
