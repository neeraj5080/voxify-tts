import { useState, useEffect, useRef, useCallback } from 'react';

// Use backend URL - in production on Vercel, use the Render backend
const API_URL = import.meta.env.VITE_API_URL || 'https://voxify-backend-5ayx.onrender.com';

console.log('[TTS] Using API_URL:', API_URL);

// Split text into word/whitespace tokens
function tokenize(text) {
  const tokens = [];
  const regex = /(\s+|\S+)/gu;
  let charPos = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const isWord = /\S/u.test(raw);
    tokens.push({
      text: raw,
      isWord,
      index: tokens.length,
      charStart: charPos,
      charEnd: charPos + raw.length
    });
    charPos += raw.length;
  }
  return tokens;
}

// Token-aware chunking
function chunkTokensList(tokens, maxLen = 200) {
  if (!tokens || tokens.length === 0) return [];
  const chunks = [];
  let currentWords = [];
  let currentLen = 0;
  let chunkStartTokenIdx = 0;
  let chunkCharStart = tokens[0].charStart;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    currentWords.push(tok.text);
    currentLen += tok.text.length;
    const isSentenceEnd = /[.!?।॥\n]/.test(tok.text);
    const isTooLong = currentLen > maxLen;
    if ((isSentenceEnd && currentLen > 40) || isTooLong || i === tokens.length - 1) {
      const chunkText = currentWords.join('');
      chunks.push({
        text: chunkText,
        tokenIndex: chunkStartTokenIdx,
        charStart: chunkCharStart,
        length: chunkText.length
      });
      currentWords = [];
      currentLen = 0;
      if (i < tokens.length - 1) {
        chunkStartTokenIdx = i + 1;
        chunkCharStart = tokens[i + 1].charStart;
      }
    }
  }
  return chunks;
}

const VOICE_MAP = {
  "Hindi (Google)": "browser",
  "Hindi (Edge Female)": "hi-IN-SwaraNeural",
  "Hindi (Edge Male)": "hi-IN-MadhurNeural",
  "English (US)": "en-US-JennyNeural",
  "English (UK)": "en-GB-SoniaNeural",
  "English Male": "en-US-GuyNeural"
};

export function useSpeech() {
  const [status, setStatus] = useState('idle');
  const [previewStatus, setPreviewStatus] = useState('idle');
  const [tokens, setTokens] = useState([]);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState([]);
  const [settings, setSettings] = useState({
    voiceURI: '', rate: 1, pitch: 1, volume: 1, lang: '',
  });

  const statusRef = useRef('idle');
  const chunksRef = useRef([]);
  const chunkIndexRef = useRef(0);
  const wordTokensRef = useRef([]);
  const allTokensRef = useRef([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const lastBoundaryRef = useRef(Date.now());
  const activeWordIdxRef = useRef(-1);
  const textRef = useRef('');
  const watchdogRef = useRef(null);
  const currentCharIndexRef = useRef(0);

  const audioRef = useRef(new Audio());
  const audioUrlRef = useRef(null);
  const previewAudioRef = useRef(new Audio());
  const previewUrlRef = useRef(null);
  const wasPlayingRef = useRef(false);

  const updateStatus = useCallback((s) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // ── Load voices ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => {
      const browserVoices = window.speechSynthesis.getVoices();
      const edgeVoices = Object.keys(VOICE_MAP)
        .filter(name => VOICE_MAP[name] !== 'browser')
        .map(name => ({
          name,
          voiceURI: VOICE_MAP[name],
          lang: name.includes('Hindi') ? 'hi-IN' : 'en-US',
          localService: false,
          isEdge: true
        }));
      const all = [...edgeVoices, ...browserVoices];
      setVoices(all);
      setSettings(prev => {
        if (prev.voiceURI) return prev;
        const defaultVoice = all.find(x => x.isEdge && x.lang.startsWith('en')) || all[0];
        return { ...prev, voiceURI: defaultVoice?.voiceURI || '' };
      });
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const charToWordIndex = useCallback((charPos) => {
    const wt = wordTokensRef.current;
    if (!wt.length) return -1;
    let lo = 0, hi = wt.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (charPos < wt[mid].charStart) hi = mid - 1;
      else if (charPos > wt[mid].charEnd) lo = mid + 1;
      else return wt[mid].index;
    }
    return lo > 0 ? wt[lo - 1].index : 0;
  }, []);

  const stopWatchdog = useCallback(() => {
    if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null; }
  }, []);

  const startWatchdog = useCallback(() => {
    stopWatchdog();
    watchdogRef.current = setInterval(() => {
      if (statusRef.current !== 'playing' || audioUrlRef.current) return;
      const stale = (Date.now() - lastBoundaryRef.current) / 1000;
      if (stale > 12 && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setTimeout(() => window.speechSynthesis.resume(), 50);
        lastBoundaryRef.current = Date.now();
      }
    }, 5000);
  }, [stopWatchdog]);

  // ── Core Speech Logic ────────────────────────────────────────────────────
  const speakChunkRef = useRef(null);

  const speakBrowserChunk = useCallback((chunk, chunkCharStart, chunkIdx, voice) => {
    const utter = new SpeechSynthesisUtterance(chunk);
    const s = settingsRef.current;
    if (voice) utter.voice = voice;
    utter.rate = s.rate;
    utter.pitch = s.pitch;
    utter.volume = s.volume;
    let fakeInterval = null;
    let realBoundaryFired = false;
    utter.onstart = () => {
      const charsPerSec = 18 * s.rate;
      const charsPerTick = charsPerSec * 0.15;
      let simulatedCharIndex = 0;
      fakeInterval = setInterval(() => {
        if (statusRef.current !== 'playing' || realBoundaryFired) { clearInterval(fakeInterval); return; }
        simulatedCharIndex += charsPerTick;
        if (simulatedCharIndex >= chunk.length) simulatedCharIndex = chunk.length - 1;
        const charInFull = chunkCharStart + Math.floor(simulatedCharIndex);
        currentCharIndexRef.current = charInFull;
        const wordIdx = charToWordIndex(charInFull);
        setActiveWordIdx(wordIdx);
      }, 150);
    };
    utter.onboundary = (e) => {
      if (e.name === 'word') { realBoundaryFired = true; clearInterval(fakeInterval); }
      lastBoundaryRef.current = Date.now();
      const charInFull = chunkCharStart + e.charIndex;
      currentCharIndexRef.current = charInFull;
      const wordIdx = charToWordIndex(charInFull);
      setActiveWordIdx(wordIdx);
      const totalWords = wordTokensRef.current.length;
      const spokenWords = wordTokensRef.current.filter(w => w.charStart <= charInFull).length;
      setProgress(Math.min(100, Math.round((spokenWords / Math.max(totalWords, 1)) * 100)));
    };
    utter.onend = () => {
      clearInterval(fakeInterval);
      // Ensure all words in this chunk are highlighted on end
      const charInFull = chunkCharStart + chunk.length;
      currentCharIndexRef.current = charInFull;
      const wordIdx = charToWordIndex(charInFull);
      setActiveWordIdx(wordIdx);

      chunkIndexRef.current = chunkIdx + 1;
      if (statusRef.current === 'playing') speakChunkRef.current(chunkIdx + 1);
    };
    utter.onerror = () => utter.onend();
    window.speechSynthesis.speak(utter);
  }, [charToWordIndex]);

  speakChunkRef.current = async (idx) => {
    if (idx >= chunksRef.current.length) {
      stopWatchdog();
      updateStatus('finished');
      setProgress(100);
      setActiveWordIdx(-1);
      return;
    }
    if (statusRef.current !== 'playing') return;
    const chunkObj = chunksRef.current[idx];
    const chunkTextStr = chunkObj.text;
    const chunkCharStart = chunkObj.charStart;
    const s = settingsRef.current;
    const isEdge = Object.values(VOICE_MAP).includes(s.voiceURI) && s.voiceURI !== 'browser';
    if (isEdge) {
      try {
        const response = await fetch(`${API_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunkTextStr, voice: s.voiceURI })
        });
        if (!response.ok) throw new Error('TTS Service Error');
        const blob = await response.blob();
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(blob);
        const audio = audioRef.current;
        audio.src = audioUrlRef.current;
        audio.playbackRate = s.rate;
        audio.volume = s.volume;
        audio.onplay = () => { lastBoundaryRef.current = Date.now(); };
        audio.ontimeupdate = () => {
          if (!audio.duration || !isFinite(audio.duration)) return;
          const progressVal = Math.min(1, audio.currentTime / audio.duration);
          const estimatedChar = Math.round(chunkTextStr.length * progressVal);
          const charInFull = Math.min(chunkCharStart + estimatedChar, chunkCharStart + chunkTextStr.length);
          currentCharIndexRef.current = charInFull;
          const wordIdx = charToWordIndex(charInFull);
          setActiveWordIdx(wordIdx);
          activeWordIdxRef.current = wordIdx;
          const totalWords = wordTokensRef.current.length;
          const spokenWords = wordTokensRef.current.filter(w => w.charStart <= charInFull).length;
          setProgress(Math.min(100, Math.round((spokenWords / Math.max(totalWords, 1)) * 100)));
        };
        audio.onended = () => {
          // Ensure all words in this chunk are highlighted on end
          const charInFull = chunkCharStart + chunkTextStr.length;
          currentCharIndexRef.current = charInFull;
          const wordIdx = charToWordIndex(charInFull);
          setActiveWordIdx(wordIdx);
          activeWordIdxRef.current = wordIdx;

          chunkIndexRef.current = idx + 1;
          if (statusRef.current === 'playing') speakChunkRef.current(idx + 1);
        };
        audio.onerror = () => audio.onended();
        audio.play();
      } catch (err) {
        console.error('[TTS] Edge failed, falling back to local...', err);
        const fb = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(s.lang.split('-')[0]));
        speakBrowserChunk(chunkTextStr, chunkCharStart, idx, fb);
      }
    } else {
      const v = window.speechSynthesis.getVoices().find(v => v.voiceURI === s.voiceURI);
      speakBrowserChunk(chunkTextStr, chunkCharStart, idx, v);
    }
  };

  // ── Controls ─────────────────────────────────────────────────────────────
  const play = useCallback((text) => {
    if (!text?.trim()) return;
    window.speechSynthesis.cancel();
    audioRef.current.pause();
    textRef.current = text;
    const allTokens = tokenize(text);
    allTokensRef.current = allTokens;
    setTokens(allTokens);
    wordTokensRef.current = allTokens.filter(t => t.isWord);
    chunksRef.current = chunkTokensList(allTokens);
    chunkIndexRef.current = 0;
    updateStatus('playing');
    setActiveWordIdx(-1);
    setProgress(0);
    startWatchdog();
    setTimeout(() => speakChunkRef.current(0), 100);
  }, [updateStatus, startWatchdog]);

  const stop = useCallback(() => {
    stopWatchdog();
    window.speechSynthesis.cancel();
    audioRef.current.pause();
    updateStatus('idle');
    setActiveWordIdx(-1);
    setProgress(0);
  }, [updateStatus, stopWatchdog]);

  const pause = useCallback(() => {
    if (statusRef.current === 'playing') {
      const chunk = chunksRef.current[chunkIndexRef.current];
      if (chunk) {
        const currentPos = currentCharIndexRef.current - chunk.charStart;
        chunksRef.current[chunkIndexRef.current].text = chunk.text.substring(Math.max(0, currentPos));
        chunksRef.current[chunkIndexRef.current].charStart = currentCharIndexRef.current;
      }
      window.speechSynthesis.pause();
      audioRef.current.pause();
      updateStatus('paused');
    } else if (statusRef.current === 'paused') {
      updateStatus('playing');
      if (audioUrlRef.current) audioRef.current.play();
      else {
        window.speechSynthesis.resume();
        if (!window.speechSynthesis.speaking) speakChunkRef.current(chunkIndexRef.current);
      }
    }
  }, [updateStatus]);

  const jumpToOffset = useCallback((offset) => {
    if (!textRef.current || !allTokensRef.current.length) return;
    const allChunks = chunkTokensList(allTokensRef.current);
    let targetIdx = allChunks.findIndex(c => offset >= c.charStart && offset < c.charStart + c.length);
    if (targetIdx === -1) {
      targetIdx = allChunks.findIndex(c => c.charStart >= offset);
      if (targetIdx === -1) targetIdx = allChunks.length - 1;
    }
    const targetChunk = allChunks[targetIdx];
    const charInChunk = offset - targetChunk.charStart;
    const remainingChunks = JSON.parse(JSON.stringify(allChunks.slice(targetIdx)));
    remainingChunks[0].text = targetChunk.text.substring(Math.max(0, charInChunk));
    remainingChunks[0].charStart = offset;
    chunksRef.current = remainingChunks;
    chunkIndexRef.current = 0;
    const wordIdx = charToWordIndex(offset);
    setActiveWordIdx(wordIdx);
    activeWordIdxRef.current = wordIdx;
    currentCharIndexRef.current = offset;
    const totalWords = wordTokensRef.current.length;
    const spokenWords = wordTokensRef.current.filter(w => w.charStart <= offset).length;
    setProgress(Math.min(100, Math.round((spokenWords / Math.max(totalWords, 1)) * 100)));
    if (statusRef.current === 'playing' || statusRef.current === 'paused') {
      window.speechSynthesis.cancel();
      audioRef.current.pause();
      if (statusRef.current === 'playing') setTimeout(() => speakChunkRef.current(0), 100);
    }
  }, [charToWordIndex]);

  const previewVoice = useCallback(async () => {
    if (previewStatus === 'loading' || previewStatus === 'playing') return;
    const s = settingsRef.current;
    const previewText = "Hello, this is a sample voice.";
    const isEdge = Object.values(VOICE_MAP).includes(s.voiceURI) && s.voiceURI !== 'browser';

    if (statusRef.current === 'playing') {
      wasPlayingRef.current = true;
      pause();
    } else {
      wasPlayingRef.current = false;
    }

    setPreviewStatus('loading');
    const cleanup = () => {
      setPreviewStatus('idle');
      if (wasPlayingRef.current && statusRef.current === 'paused') pause();
    };

    if (isEdge) {
      try {
        const response = await fetch(`${API_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: previewText, voice: s.voiceURI })
        });
        if (!response.ok) throw new Error('Preview Failed');
        const blob = await response.blob();
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(blob);
        const audio = previewAudioRef.current;
        audio.src = previewUrlRef.current;
        audio.onplay = () => setPreviewStatus('playing');
        audio.onended = cleanup;
        audio.onerror = cleanup;
        audio.play();
      } catch (err) {
        console.error('Preview error:', err);
        cleanup();
      }
    } else {
      // Force clear any hung threads for browser voices
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const v = window.speechSynthesis.getVoices().find(v => v.voiceURI === s.voiceURI);
        const utter = new SpeechSynthesisUtterance(previewText);
        if (v) utter.voice = v;
        utter.rate = s.rate;
        utter.onstart = () => setPreviewStatus('playing');
        utter.onend = cleanup;
        utter.onerror = cleanup;
        window.speechSynthesis.speak(utter);
      }, 20);
    }
  }, [previewStatus, pause]);

  const updateSettings = useCallback((p) => {
    setSettings(s => ({ ...s, ...p }));
    if (p.rate !== undefined) audioRef.current.playbackRate = p.rate;
  }, []);

  return { status, tokens, activeWordIdx, progress, voices, settings, updateSettings, play, pause, stop, jumpToOffset, previewStatus, previewVoice };
}
