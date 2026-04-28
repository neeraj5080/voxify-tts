import { Download } from 'lucide-react';

export default function DownloadButton({ text, disabled }) {
  const handleDownload = () => {
    if (!text?.trim()) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voxify-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleDownload}
      disabled={disabled}
      data-tooltip="Download text"
      aria-label="Download text"
      id="btn-download"
    >
      <Download size={14} strokeWidth={2} />
      Save
    </button>
  );
}
