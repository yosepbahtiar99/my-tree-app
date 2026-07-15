require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const personRoutes = require('./routes/personRoutes');
const marriageRoutes = require('./routes/marriageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Allow fallback Vite ports
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/marriages', marriageRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Silsilahku API is running...');
});

// Sync Database and Start Server
db.sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected and synced');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to sync database:', error);
});
