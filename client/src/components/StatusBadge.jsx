export default function StatusBadge({ status }) {
  const map = {
    idle:     { label: 'Ready',    cls: 'status-idle' },
    playing:  { label: 'Playing',  cls: 'status-playing' },
    paused:   { label: 'Paused',   cls: 'status-paused' },
    finished: { label: 'Finished', cls: 'status-finished' },
  };

  const { label, cls } = map[status] || map.idle;

  return (
    <span className={`status-badge ${cls}`} aria-live="polite" aria-label={`Status: ${label}`}>
      <span className="dot" />
      {label}
    </span>
  );
}
