import { Globe, Mic, Gauge, Music, Volume2, Loader2 } from 'lucide-react';

const LANGUAGES = [
  { value: '', label: 'Auto (voice default)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-US', label: 'Spanish (US)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ar-SA', label: 'Arabic' },
];

function LabelRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
        <Icon size={12} strokeWidth={2} />
        <span>{label}</span>
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export default function VoiceSettings({ voices, settings, onUpdate, previewStatus, onPreview }) {
  const filteredVoices = settings.lang
    ? voices.filter(v => v.lang.startsWith(settings.lang.split('-')[0]))
    : voices;

  const displayVoices = filteredVoices.length > 0 ? filteredVoices : voices;
  const currentVoice = voices.find(v => v.voiceURI === settings.voiceURI);
  const isNeural = currentVoice?.isEdge || false;

  return (
    <div className="flex flex-col gap-4">
      {/* Language */}
      <div>
        <LabelRow icon={Globe} label="Language" value="" />
        <select
          id="select-language"
          value={settings.lang}
          onChange={e => onUpdate({ lang: e.target.value, voiceURI: '' })}
          aria-label="Select language"
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Voice */}
      <div>
        <LabelRow icon={Mic} label="Voice" value={displayVoices.length > 0 ? `${displayVoices.length} available` : 'Loading…'} />
        <div className="flex gap-2 items-center">
          <select
            id="select-voice"
            className="flex-1"
            value={settings.voiceURI}
            onChange={e => onUpdate({ voiceURI: e.target.value })}
            aria-label="Select voice"
          >
            {displayVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} {v.isEdge ? ' (Neural)' : v.localService ? ' (Local)' : ' (Browser)'}
              </option>
            ))}
          </select>
          <button
            onClick={onPreview}
            disabled={previewStatus === 'loading' || previewStatus === 'playing'}
            className={`btn btn-secondary p-2 min-w-[40px] flex items-center justify-center ${previewStatus === 'playing' ? 'text-blue-400' : ''}`}
            aria-label="Preview voice"
            title="Preview voice"
          >
            {previewStatus === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Volume2 size={16} className={previewStatus === 'playing' ? 'animate-pulse' : ''} />
            )}
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 4 }}>
          Neural voices provide high-quality natural speech.
        </p>
      </div>

      {/* Speed */}
      <div>
        <LabelRow icon={Gauge} label="Speed" value={`${settings.rate.toFixed(1)}×`} />
        <input
          id="slider-speed"
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={settings.rate}
          onChange={e => onUpdate({ rate: parseFloat(e.target.value) })}
          aria-label="Speed"
          style={{ '--pct': `${((settings.rate - 0.5) / 1.5) * 100}%` }}
        />
        <div className="relative h-4 w-full" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 2 }}>
          <span className="absolute left-0">0.5×</span>
          <span className="absolute" style={{ left: '33.33%', transform: 'translateX(-50%)' }}>1×</span>
          <span className="absolute right-0">2×</span>
        </div>
      </div>

      {/* Pitch */}
      <div style={{ opacity: isNeural ? 0.4 : 1, pointerEvents: isNeural ? 'none' : 'auto' }}>
        <LabelRow icon={Music} label="Pitch" value={isNeural ? "Fixed" : settings.pitch.toFixed(1)} />
        <input
          id="slider-pitch"
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={settings.pitch}
          onChange={e => onUpdate({ pitch: parseFloat(e.target.value) })}
          disabled={isNeural}
          aria-label="Pitch"
        />
        <div className="relative h-4 w-full" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 2 }}>
          <span className="absolute left-0">Low</span>
          <span className="absolute" style={{ left: '33.33%', transform: 'translateX(-50%)' }}>Normal</span>
          <span className="absolute right-0">High</span>
        </div>
      </div>
    </div>
  );
}
