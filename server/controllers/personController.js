const { Person, AuditLog } = require('../models');

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
    // For React Flow, we'll send flat data and let frontend build the nodes/edges, 
    // or build a hierarchical structure here if preferred. 
    // Sending flat data is usually easier for React Flow to process edges.
    
    const nodes = persons.map(p => {
      const pData = p.toJSON();
      pData.age = calculateAge(p.birthDate, p.deathDate, p.isDeceased);
      return pData;
    });

    res.json(nodes);
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

module.exports = { getAllPersons, createPerson, updatePerson, deletePerson, getTreeData, uploadPhoto };
