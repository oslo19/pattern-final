const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// CORS configuration
app.use(cors({
  origin: [
    'http://46.202.162.220',
    'http://46.202.162.220:5000',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Add these headers to all responses
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://46.202.162.220',
    'http://46.202.162.220:5000',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());

// Import routes
const userRoutes = require('./api/routes/userRoutes');
const patternRoutes = require('./api/routes/patternRoutes');
const aiRoutes = require('./api/routes/aiRoutes');

// Routes
app.use('/users', userRoutes);
app.use('/patterns', patternRoutes);
app.use('/ai', aiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
