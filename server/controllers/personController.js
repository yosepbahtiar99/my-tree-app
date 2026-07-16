const { Person, AuditLog, Marriage } = require('../models');

const calculateAge = (birthDate, deathDate, isDeceased) => {
  if (!birthDate) return null;
  const start = new Date(birthDate);
  const end = isDeceased && deathDate ? new Date(deathDate) : new Date();
  
  let age = end.getFullYear() - start.getFullYear();
  const m = end.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < start.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const getAllPersons = async (req, res) => {
  try {
    const persons = await Person.findAll();
    const data = persons.map(p => {
      const pData = p.toJSON();
      pData.age = calculateAge(p.birthDate, p.deathDate, p.isDeceased);
      return pData;
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching persons', error: error.message });
  }
};

const createPerson = async (req, res) => {
  try {
    const person = await Person.create(req.body);
    
    // Log Activity
    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE',
      targetPersonId: person.id,
      details: { message: `Menambahkan anggota keluarga baru: ${person.fullName}` }
    });

    res.status(201).json({ message: 'Person berhasil dibuat', person });
  } catch (error) {
    res.status(500).json({ message: 'Error creating person', error: error.message });
  }
};

const updatePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findByPk(id);
    if (!person) return res.status(404).json({ message: 'Person tidak ditemukan' });

    await person.update(req.body);

    // Log Activity
    await AuditLog.create({
      userId: req.user.id,
      action: 'UPDATE',
      targetPersonId: person.id,
      details: { message: `Mengubah data anggota keluarga: ${person.fullName}` }
    });

    res.json({ message: 'Person berhasil diupdate', person });
  } catch (error) {
    res.status(500).json({ message: 'Error updating person', error: error.message });
  }
};

const deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findByPk(id);
    if (!person) return res.status(404).json({ message: 'Person tidak ditemukan' });

    const name = person.fullName;
    await person.destroy();

    // Log Activity
    await AuditLog.create({
      userId: req.user.id,
      action: 'DELETE',
      targetPersonId: id,
      details: { message: `Menghapus anggota keluarga: ${name}` }
    });

    res.json({ message: 'Person berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting person', error: error.message });
  }
};

const getTreeData = async (req, res) => {
  try {
    const persons = await Person.findAll();
    const marriages = await Marriage.findAll();
    
    const nodes = persons.map(p => {
      const pData = p.toJSON();
      pData.age = calculateAge(p.birthDate, p.deathDate, p.isDeceased);
      return pData;
    });

    res.json({ persons: nodes, marriages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tree data', error: error.message });
  }
};

const uploadPhoto = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File tidak ditemukan' });
  }
  res.json({ photoId: req.file.filename });
};

const addParent = async (req, res) => {
  try {
    const { id } = req.params;
    const child = await Person.findByPk(id);
    if (!child) return res.status(404).json({ message: 'Anak tidak ditemukan' });

    // 1. Buat data orang tua baru
    const parent = await Person.create(req.body);

    let existingSpouseId = null;
    let husbandId = null;
    let wifeId = null;

    // 2. Update relasi anak
    if (parent.gender === 'MALE') {
      existingSpouseId = child.motherId;
      child.fatherId = parent.id;
      husbandId = parent.id;
      wifeId = existingSpouseId;
    } else {
      existingSpouseId = child.fatherId;
      child.motherId = parent.id;
      husbandId = existingSpouseId;
      wifeId = parent.id;
    }
    await child.save();

    // 3. Jika anak sudah punya orang tua lawan jenis, buatkan data pernikahan
    if (husbandId && wifeId) {
      const existingMarriage = await Marriage.findOne({
        where: { husbandId, wifeId }
      });
      
      if (!existingMarriage) {
        await Marriage.create({ husbandId, wifeId });
      }
    }

    // Log Activity
    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE',
      targetPersonId: parent.id,
      details: { message: `Menambahkan orang tua (${parent.gender === 'MALE' ? 'Ayah' : 'Ibu'}) untuk ${child.fullName}: ${parent.fullName}` }
    });

    res.status(201).json({ message: 'Orang tua berhasil ditambahkan', parent });
  } catch (error) {
    res.status(500).json({ message: 'Error adding parent', error: error.message });
  }
};

module.exports = { getAllPersons, createPerson, updatePerson, deletePerson, getTreeData, uploadPhoto, addParent };
