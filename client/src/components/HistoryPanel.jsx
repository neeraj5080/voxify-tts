import { Clock, Trash2, X, RotateCcw } from 'lucide-react';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function HistoryPanel({ history, onSelect, onRemove, onClear, onClose }) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--bg)',
        borderLeft: '1px solid var(--border)',
        width: 280,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Clock size={14} strokeWidth={2} />
          <h2>History</h2>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={onClear}
              style={{ fontSize: '0.75rem', padding: '0 8px', height: 28 }}
              aria-label="Clear all history"
            >
              <Trash2 size={12} strokeWidth={2} />
              Clear
            </button>
          )}
          <button
            className="btn btn-icon"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
            aria-label="Close history"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {history.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: 'var(--text-muted)', padding: '32px 16px', textAlign: 'center' }}
          >
            <Clock size={28} strokeWidth={1.5} />
            <p style={{ fontSize: '0.8125rem' }}>No history yet.<br />Texts you speak will appear here.</p>
          </div>
        ) : (
          <ul style={{ padding: '8px 0' }}>
            {history.map(entry => (
              <li
                key={entry.id}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div
                  className="group"
                  style={{ padding: '10px 16px', cursor: 'pointer', transition: 'background var(--transition)' }}
                  onClick={() => onSelect(entry.text)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onSelect(entry.text)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.5,
                        flex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {entry.preview}
                    </p>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0 4px', height: 20, flexShrink: 0, opacity: 0.5 }}
                      onClick={e => { e.stopPropagation(); onRemove(entry.id); }}
                      aria-label="Remove entry"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </div>
                  <div
                    className="flex items-center gap-3 mt-1"
                    style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}
                  >
                    <span>{entry.wordCount} words</span>
                    <span>·</span>
                    <span>{timeAgo(entry.createdAt)}</span>
                    <RotateCcw size={10} strokeWidth={2} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
