import { useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://voxify-backend-5ayx.onrender.com';

export default function AudioDownloadButton({ text, settings, voices, disabled }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!text?.trim() || loading) return;

    // Identify if the current voice is an Edge Neural voice
    const currentVoice = voices.find(v => v.voiceURI === settings.voiceURI);
    const isNeural = currentVoice?.isEdge || false;

    if (!isNeural) {
      alert("Download is not supported for Browser voices. Please select an 'Edge (Neural)' voice to download audio.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: settings.voiceURI
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voxify-audio-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate audio file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleDownload}
      disabled={disabled || loading}
      data-tooltip="Download as MP3"
      aria-label="Download audio"
      id="btn-download-audio"
      style={{ gap: '6px' }}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Headphones size={14} strokeWidth={2} />
      )}
      {loading ? 'Processing...' : 'Audio'}
    </button>
  );
}
