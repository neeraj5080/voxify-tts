import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import axios from 'axios';

// Use backend URL - in production on Vercel, use the Render backend
const API_URL = import.meta.env.VITE_API_URL || 'https://voxify-backend-5ayx.onrender.com';

export default function FileUpload({ onTextLoaded }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    setError('');
    setFileName(file.name);
    setLoading(true);

    try {
      if (ext === 'txt') {
        // Read TXT client-side
        const text = await file.text();
        onTextLoaded(text.trim());
      } else if (ext === 'pdf') {
        // Send to server for parsing
        const form = new FormData();
        form.append('file', file);
        const res = await axios.post(`${API_URL}/api/upload`, form);
        onTextLoaded(res.data.text);
      } else {
        setError('Only PDF and TXT files are supported.');
      }
    } catch (err) {
      setError('Failed to parse file. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };

  return (
    <div>
      <div
        className={`group panel flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all ${dragging ? 'drag-over' : ''
          } border border-dashed border-gray-600 hover:border-blue-500 hover:bg-white/5 rounded-md`}
        style={{ borderStyle: 'dashed' }}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF or TXT file"
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={onInputChange}
          id="file-input"
        />
        {loading ? (
          <div className="btn btn-secondary" style={{ color: 'var(--text-secondary)' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8125rem' }}>Parsing {fileName}…</span>
          </div>
        ) : fileName && !error ? (
          <div className="btn btn-secondary" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            <FileText size={14} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
            <button
              className="btn-ghost"
              style={{ padding: '0 4px', height: 20 }}
              onClick={e => { e.stopPropagation(); setFileName(''); }}
              aria-label="Clear file"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="btn btn-secondary" style={{ color: '--primary-foreground', fontSize: '0.8125rem' }}>
            <Upload size={16} />
            <span>Upload PDF or TXT</span>
          </div>
        )}
      </div>
      {error && (
        <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: 4 }}>{error}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
