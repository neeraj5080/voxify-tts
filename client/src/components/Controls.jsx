import { Play, Pause, Square, SkipBack } from 'lucide-react';

export default function Controls({ status, onPlay, onPause, onStop, disabled }) {
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isActive = isPlaying || isPaused;

  return (
    <div className="flex items-center gap-2">
      {/* Stop / Reset */}
<button
  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md disabled:opacity-40"
  onClick={onStop}
  disabled={!isActive}
  aria-label="Stop"
>
  <Square size={16} fill="currentColor" />
  <span className="text-sm font-medium">Stop</span>
</button>

      {/* Play / Pause */}
      <button
        className={`btn btn-primary`}
        style={{ width: 80 }}
        onClick={isPlaying ? onPause : isPaused ? onPause : onPlay}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
        id="btn-play-pause"
      >
        {isPlaying ? (
          <><Pause size={15} strokeWidth={2} /> Pause</>
        ) : isPaused ? (
          <><Play size={15} strokeWidth={2} fill="currentColor" /> Resume</>
        ) : (
          <><Play size={15} strokeWidth={2} fill="currentColor" /> Play</>
        )}
      </button>
      
    </div>
  );
}
