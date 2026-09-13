require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

const analysisRoutes = require('./routes/analysisRoutes');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', analysisRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'FarmLink AI Backend'
  });
});

// Get all buyers
app.get('/buyers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM buyers');

    res.json({
      success: true,
      buyers: rows
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);

    res.status(500).json({
      success: false,
      error: 'Unable to fetch buyers'
    });
  }
});

// Test MySQL connection
db.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();
  })
  .catch(error => {
    console.error('❌ MySQL connection failed:', error.message);
  });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FarmLink Server running on http://localhost:${PORT}`);
});