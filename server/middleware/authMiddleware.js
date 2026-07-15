const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Hanya Super Admin yang bisa melakukan ini.' });
  }
  next();
};

const requireActive = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({ message: 'Akun Anda belum disetujui. Harap tunggu persetujuan.' });
  }
  next();
};

module.exports = { authenticateToken, authorizeAdmin, requireActive };
