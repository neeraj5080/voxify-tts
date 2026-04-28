const express = require('express');
const { MsEdgeTTS } = require('msedge-tts');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    if (!text) return res.status(400).json({ error: 'No text provided' });

    console.log('[TTS] Generating audio for:', voice);

    const tts = new MsEdgeTTS();
    
    // API 2.x requires setting metadata (voice/pitch/rate) before calling toStream
    await tts.setMetadata(voice || "hi-IN-SwaraNeural", "audio-24khz-48kbitrate-mono-mp3");
    
    const streamObj = tts.toStream(text.trim());
    const audioStream = streamObj.audioStream;
    
    if (!audioStream || typeof audioStream.pipe !== 'function') {
      throw new Error('Could not initialize audio stream from TTS engine.');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    audioStream.pipe(res);

    audioStream.on('error', (err) => {
      console.error('[TTS Stream Error]:', err);
      if (!res.headersSent) res.status(500).end();
    });

  } catch (err) {
    console.error('[TTS Route Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'TTS Service Error: ' + err.message });
    }
  }
});

module.exports = router;
