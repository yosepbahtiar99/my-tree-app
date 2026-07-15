require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function seed() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const editorPassword = await bcrypt.hash('editor123', 10);
    const pendingPassword = await bcrypt.hash('pending123', 10);

    await User.bulkCreate([
      {
        email: 'admin@silsilahku.com',
        password: adminPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      {
        email: 'editor@silsilahku.com',
        password: editorPassword,
        role: 'EDITOR',
        isActive: true,
      },
      {
        email: 'pending@silsilahku.com',
        password: pendingPassword,
        role: 'EDITOR',
        isActive: false, // Menunggu persetujuan Admin
      },
    ]);

    console.log('Akun dummy berhasil dibuat!');
    process.exit(0);
  } catch (err) {
    console.error('Gagal membuat akun:', err);
    process.exit(1);
  }
}

seed();
