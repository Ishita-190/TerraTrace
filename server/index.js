const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const damRoutes = require('./routes/dams.js');
const complaintRoutes = require('./routes/complaints.js');
const documentRoutes = require('./routes/documents.js');
const forestRoutes = require('./routes/forests.js');
const authRoutes = require('./routes/auth.js');

dotenv.config({ path: path.join(__dirname, '../.env') });
const { initDb } = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/dams', damRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/forests', forestRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TerraTrace backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[TerraTrace Backend Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

(async () => {
  const HOST = process.env.HOST || '0.0.0.0';
  try {
    await initDb();
    console.log('[TerraTrace Backend] Database initialized');
  } catch (err) {
    console.warn('[TerraTrace Backend] Database initialization failed, continuing without DB:', err.message);
  }
  app.listen(PORT, HOST, () => {
    console.log(`[TerraTrace Backend] Server running on http://${HOST}:${PORT}`);
  });
})();
