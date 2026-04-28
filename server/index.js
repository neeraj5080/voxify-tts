const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadRoute = require('./routes/upload');
const ttsRoute = require('./routes/tts');

dotenv.config();

const app = express();
const PORT = 3001;

// CORS configuration for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://voxify-backend-5ayx.onrender.com',
  // Add your Vercel frontend URL here once you get it
  // Example: 'https://voxify-frontend.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/upload', uploadRoute);
app.use('/api/tts', ttsRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TTS Server running on http://localhost:${PORT}`);
});
