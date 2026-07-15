const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Cek apakah user pertama (jadikan SUPER_ADMIN otomatis)
    const userCount = await User.count();
    const role = userCount === 0 ? 'SUPER_ADMIN' : 'EDITOR';
    const isActive = userCount === 0 ? true : false; // Admin pertama langsung aktif

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role, isActive });

    res.status(201).json({ message: 'Registrasi berhasil. Silakan tunggu persetujuan Admin.', user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error registrasi', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password salah' });

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akun belum disetujui. Hubungi Admin.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, isActive: user.isActive }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ message: 'Login berhasil', user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ message: 'Error login', error: error.message });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.findAll({ where: { isActive: false }, attributes: ['id', 'email', 'createdAt'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending users', error: error.message });
  }
};

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    user.isActive = true;
    await user.save();

    res.json({ message: 'User berhasil disetujui', user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error approve user', error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout berhasil' });
};

module.exports = { register, login, getPendingUsers, approveUser, logout };
