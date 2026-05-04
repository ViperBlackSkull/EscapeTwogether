import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { audioService } from '../services/audioService.js';
import type { SoundCategory } from '../services/audioService.js';

export default function AudioToggle() {
  const [expanded, setExpanded] = useState(false);
  const [masterMuted, setMasterMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [ambientMuted, setAmbientMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);

  useEffect(() => {
    const prefs = audioService.getPreferences();
    setMasterMuted(prefs.masterMuted);
    setMasterVolume(prefs.masterVolume);
    setAmbientMuted(prefs.categories.ambient.muted);
    setSfxMuted(prefs.categories.sfx.muted);
  }, []);

  const toggleMasterMute = useCallback(() => {
    audioService.init();
    audioService.ensureResumed();
    const newMuted = !masterMuted;
    audioService.setMasterMuted(newMuted);
    setMasterMuted(newMuted);
  }, [masterMuted]);

  const handleMasterVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    audioService.init();
    audioService.setMasterVolume(vol);
    setMasterVolume(vol);
    if (vol > 0 && masterMuted) {
      audioService.setMasterMuted(false);
      setMasterMuted(false);
    }
  }, [masterMuted]);

  const toggleCategory = useCallback((category: SoundCategory, currentMuted: boolean, setter: (v: boolean) => void) => {
    audioService.init();
    const newMuted = !currentMuted;
    audioService.setCategoryMuted(category, newMuted);
    setter(newMuted);
  }, []);

  const VolumeIcon = masterMuted || masterVolume === 0 ? VolumeX : masterVolume < 0.4 ? Volume1 : Volume2;

  return (
    <div className="audio-toggle" style={{ position: 'relative' }}>
      <button
        className="audio-toggle-btn"
        onClick={() => {
          if (!expanded) audioService.init();
          setExpanded(!expanded);
        }}
        title={masterMuted ? 'Unmute audio' : 'Mute audio'}
        style={{
          background: 'none',
          border: 'none',
          color: masterMuted ? 'var(--text-dim)' : 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 6,
          transition: 'color 0.2s',
        }}
      >
        <VolumeIcon size={18} />
      </button>

      {expanded && (
        <div
          className="audio-toggle-panel"
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 12,
            width: 200,
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Master</span>
              <button
                onClick={toggleMasterMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: masterMuted ? 'var(--accent-red)' : 'var(--accent-teal)',
                  cursor: 'pointer',
                  padding: 2,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {masterMuted ? 'MUTED' : 'ON'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={handleMasterVolume}
              style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ambient</span>
              <button
                onClick={() => toggleCategory('ambient', ambientMuted, setAmbientMuted)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: ambientMuted ? 'var(--text-dim)' : 'var(--accent-teal)',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: 2,
                }}
              >
                {ambientMuted ? 'OFF' : 'ON'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SFX</span>
              <button
                onClick={() => toggleCategory('sfx', sfxMuted, setSfxMuted)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: sfxMuted ? 'var(--text-dim)' : 'var(--accent-teal)',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: 2,
                }}
              >
                {sfxMuted ? 'OFF' : 'ON'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
