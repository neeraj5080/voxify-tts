export default function ProgressBar({ progress, activeWordIdx, totalWords }) {
  const pct = Math.min(100, Math.max(0, progress));

  // By explicitly driving the word count from the percentage (which is based on character progress),
  // we guarantee 100% synchronization. The count will never lag behind or jump ahead of the percentage.
  let spokenWords = Math.floor((pct / 100) * totalWords);

  if (pct === 100) {
    spokenWords = totalWords;
  } else if (spokenWords >= totalWords && totalWords > 0) {
    // Prevent it from showing complete until the percentage is actually 100%
    spokenWords = totalWords - 1;
  }

  spokenWords = Math.max(0, Math.min(totalWords, spokenWords));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
      </div>
      <div className="flex justify-between items-center" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
        <span>{pct}%</span>
        {totalWords > 0 && (
          <span>
            {spokenWords} / {totalWords} words
          </span>
        )}
      </div>
    </div>
  );
}
