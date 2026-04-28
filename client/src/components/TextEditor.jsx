import { useEffect, useRef } from 'react';

export default function TextEditor({ text, onChange, onOffsetChange, tokens, activeWordIdx, status }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const isReading = status === 'playing' || status === 'paused';

  const handleCursorMove = (e) => {
    if (onOffsetChange) {
      onOffsetChange(e.target.selectionStart);
    }
  };

  // Auto-scroll highlighted word into view — center alignment avoids jumpy feel
  useEffect(() => {
    if (activeWordIdx < 0 || !highlightRef.current) return;
    const el = highlightRef.current.querySelector(`[data-widx="${activeWordIdx}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeWordIdx]);

  // Sync textarea scroll with highlight overlay
  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
      {/* Text editor container */}
      <div
        className="relative flex-1 rounded-lg border border-gray-700 bg-gray-900/50"
        style={{
          minHeight: '400px',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* ── Overlay for word highlighting when reading ── */}
        {isReading && tokens.length > 0 && (
          <div
            ref={highlightRef}
            className="absolute inset-0 overflow-auto pointer-events-none select-none"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '1rem',
              lineHeight: '2',
              padding: '1.25rem 1.5rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)',
              zIndex: 2,
            }}
            aria-hidden="true"
          >
            {tokens.map((tok, i) =>
              tok.isWord ? (
                <span
                  key={i}
                  data-widx={tok.index}
                  className={`word-span transition-colors duration-150${
                    tok.index === activeWordIdx ? ' active' : ''
                  }`}
                  style={{
                    backgroundColor:
                      tok.index === activeWordIdx ? 'rgba(59, 130, 246, 0.4)' : 'transparent',
                    borderRadius: '2px',
                    padding: '1px 0',
                  }}
                >
                  {tok.text}
                </span>
              ) : (
                <span key={i}>{tok.text}</span>
              )
            )}
          </div>
        )}

        {/* ── Textarea ── */}
        <textarea
          ref={textareaRef}
          id="tts-textarea"
          value={text}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          onSelect={handleCursorMove}
          placeholder="Paste or type text here, or upload a file below…"
          spellCheck={false}
          className="absolute inset-0 w-full h-full resize-none outline-none overflow-auto"
          style={{
            zIndex: isReading && tokens.length > 0 ? 1 : 2,
            color: isReading && tokens.length > 0 ? 'transparent' : 'var(--text-primary)',
            caretColor: 'var(--text-primary)',
            padding: '1.25rem 1.5rem',
            background: 'transparent',
            fontSize: '1rem',
            lineHeight: '2',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          aria-label="Text to speak"
        />
      </div>
    </div>
  );
}