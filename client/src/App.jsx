import { useState, useEffect, useCallback } from 'react';
import { Volume2, History, Settings, ChevronRight, AlignLeft } from 'lucide-react';

import { useSpeech } from './hooks/useSpeech';
import { useHistory } from './hooks/useHistory';
import { useTheme } from './hooks/useTheme';

import TextEditor from './components/TextEditor';
import Controls from './components/Controls';
import StatusBadge from './components/StatusBadge';
import ProgressBar from './components/ProgressBar';
import VoiceSettings from './components/VoiceSettings';
import FileUpload from './components/FileUpload';
import HistoryPanel from './components/HistoryPanel';
import ThemeToggle from './components/ThemeToggle';
import DownloadButton from './components/DownloadButton';
import AudioDownloadButton from './components/AudioDownloadButton';
import logo from './assets/logo.png';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This is a sample text to demonstrate the Text-to-Speech engine. You can replace this with any content you'd like to hear spoken aloud — articles, notes, documents, or anything else.

Use the controls below to play, pause, or stop playback. Adjust the voice, speed, and pitch from the Settings panel on the right. You can also upload a PDF or TXT file using the upload button.`;

export default function App() {
  const [text, setText] = useState(() => {
    const saved = localStorage.getItem('voxify_text');
    return saved !== null ? saved : SAMPLE_TEXT;
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Persist text to local storage
  useEffect(() => {
    localStorage.setItem('voxify_text', text);
  }, [text]);

  const { theme, toggle: toggleTheme } = useTheme();
  const { history, addEntry, removeEntry, clearHistory } = useHistory();
  const {
    status, tokens, activeWordIdx, progress,
    voices, settings, updateSettings,
    play, pause, stop, jumpToOffset,
    previewStatus, previewVoice
  } = useSpeech();

  // Update counts
  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(text.trim() ? words.length : 0);
    setCharCount(text.length);
  }, [text]);

  // Handle keyboard play request from useSpeech
  useEffect(() => {
    const handler = () => {
      if (text.trim()) handlePlay();
    };
    document.addEventListener('tts:playrequest', handler);
    return () => document.removeEventListener('tts:playrequest', handler);
  }, [text]);

  const handlePlay = useCallback(() => {
    if (!text.trim()) return;
    addEntry(text);
    play(text);
  }, [text, play, addEntry]);

  const handleSelectHistory = (histText) => {
    stop();
    setText(histText);
  };

  const totalWords = tokens.filter(t => t.isWord).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 52,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          background: 'var(--bg)',
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Voxify Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.02em' }}>
            Voxify
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              padding: '1px 6px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              fontWeight: 500,
            }}
          >
            TTS
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <button
            className={`btn btn-icon${showHistory ? ' active' : ''}`}
            onClick={() => setShowHistory(v => !v)}
            data-tooltip="History"
            aria-label="Toggle history"
            id="btn-history"
          >
            <History size={15} strokeWidth={2} />
          </button>
          <button
            className={`btn btn-icon${showSettings ? ' active' : ''}`}
            onClick={() => setShowSettings(v => !v)}
            data-tooltip="Settings"
            aria-label="Toggle settings"
            id="btn-settings"
          >
            <Settings size={15} strokeWidth={2} />
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── Main Content ──────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Editor area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 28px 16px',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Meta row */}
            <div
              className="flex items-center justify-between mb-3"
              style={{ flexShrink: 0 }}
            >
              <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <AlignLeft size={12} strokeWidth={2} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
                </span>
              </div>
              <StatusBadge status={status} />
            </div>

            {/* Text editor */}
            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                minHeight: 0,
              }}
            >
              <TextEditor
                text={text}
                onChange={setText}
                onOffsetChange={jumpToOffset}
                tokens={tokens}
                activeWordIdx={activeWordIdx}
                status={status}
                progress={progress}
              />
            </div>
          </div>

          {/* ── Bottom Controls ─────────────────────────────── */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '14px 28px 18px',
              flexShrink: 0,
              background: 'var(--bg)',
            }}
          >
            {/* Progress bar */}
            <div style={{ marginBottom: 14 }}>
              <ProgressBar
                progress={progress}
                activeWordIdx={activeWordIdx}
                totalWords={totalWords}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Controls
                status={status}
                onPlay={handlePlay}
                onPause={pause}
                onStop={stop}
                disabled={!text.trim()}
              />

              <div className="flex items-center gap-2">
                <FileUpload onTextLoaded={setText} />
                <AudioDownloadButton 
                  text={text} 
                  settings={settings} 
                  voices={voices} 
                  disabled={!text.trim()} 
                />
                <DownloadButton text={text} disabled={!text.trim()} />
                {text.trim() && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => { stop(); setText(''); }}
                    aria-label="Clear text"
                    id="btn-clear-text"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Keyboard hint */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 10 }}>
              <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: '0.6875rem', fontFamily: 'inherit' }}>Space</kbd> play/pause
              {' · '}
              <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: '0.6875rem', fontFamily: 'inherit' }}>Esc</kbd> stop
            </p>
          </div>
        </main>

        {/* ── Settings Sidebar ──────────────────────────────── */}
        {showSettings && (
          <aside
            style={{
              width: 260,
              borderLeft: '1px solid var(--border)',
              background: 'var(--bg)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 16px 12px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <h2 style={{ color: 'var(--text-primary)' }}>Voice Settings</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                Customize speech output
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <VoiceSettings
                voices={voices}
                settings={settings}
                onUpdate={updateSettings}
                previewStatus={previewStatus}
                onPreview={previewVoice}
              />
            </div>
          </aside>
        )}

        {/* ── History Sidebar ───────────────────────────────── */}
        {showHistory && (
          <HistoryPanel
            history={history}
            onSelect={handleSelectHistory}
            onRemove={removeEntry}
            onClear={clearHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  );
}
