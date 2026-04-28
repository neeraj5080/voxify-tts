const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadRoute = require('./routes/upload');
const ttsRoute = require('./routes/tts');

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
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
