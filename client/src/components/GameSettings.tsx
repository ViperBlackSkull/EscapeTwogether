import { useState, useEffect, useCallback } from 'react';
import { X, Volume2, VolumeX, LogOut, RotateCcw } from 'lucide-react';
import { audioService } from '../services/audioService.js';
import type { SoundCategory } from '../services/audioService.js';

interface GameSettingsProps {
  open: boolean;
  onClose: () => void;
  onResetPuzzle?: () => void;
  onLeaveGame?: () => void;
  activePuzzleId?: string | null;
}

export default function GameSettings({ open, onClose, onResetPuzzle, onLeaveGame, activePuzzleId }: GameSettingsProps) {
  const [masterMuted, setMasterMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [ambientMuted, setAmbientMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [chatFontSize, setChatFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  useEffect(() => {
    const prefs = audioService.getPreferences();
    setMasterMuted(prefs.masterMuted);
    setMasterVolume(prefs.masterVolume);
    setAmbientMuted(prefs.categories.ambient.muted);
    setSfxMuted(prefs.categories.sfx.muted);
    const stored = localStorage.getItem('escape-twogether-chat-font');
    if (stored === 'small' || stored === 'medium' || stored === 'large') {
      setChatFontSize(stored);
    }
  }, [open]);

  const toggleMasterMute = useCallback(() => {
    audioService.init();
    audioService.ensureResumed();
    const next = !masterMuted;
    audioService.setMasterMuted(next);
    setMasterMuted(next);
  }, [masterMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    audioService.init();
    audioService.setMasterVolume(vol);
    setMasterVolume(vol);
    if (vol > 0 && masterMuted) {
      audioService.setMasterMuted(false);
      setMasterMuted(false);
    }
  }, [masterMuted]);

  const toggleCategory = useCallback((cat: SoundCategory, cur: boolean, setter: (v: boolean) => void) => {
    audioService.init();
    const next = !cur;
    audioService.setCategoryMuted(cat, next);
    setter(next);
  }, []);

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setChatFontSize(size);
    localStorage.setItem('escape-twogether-chat-font', size);
    document.documentElement.style.setProperty('--chat-font-size', size === 'small' ? '12px' : size === 'large' ? '16px' : '14px');
  };

  const handleReset = () => {
    if (showConfirmReset) {
      onResetPuzzle?.();
      setShowConfirmReset(false);
      onClose();
    } else {
      setShowConfirmReset(true);
    }
  };

  const handleLeave = () => {
    if (showConfirmLeave) {
      onLeaveGame?.();
      setShowConfirmLeave(false);
    } else {
      setShowConfirmLeave(true);
    }
  };

  if (!open) return null;

  return (
    <div className="game-settings-overlay" onClick={onClose}>
      <div className="game-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="game-settings-header">
          <h3>Settings</h3>
          <button className="game-settings-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="game-settings-body">
          {/* Audio Section */}
          <div className="game-settings-section">
            <div className="game-settings-section-title">
              {masterMuted || masterVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              Audio
            </div>
            <div className="game-settings-row">
              <span className="game-settings-label">Master Volume</span>
              <div className="game-settings-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={handleVolumeChange}
                  className="game-settings-slider"
                />
                <button className="game-settings-toggle-btn" onClick={toggleMasterMute}>
                  {masterMuted ? 'MUTED' : 'ON'}
                </button>
              </div>
            </div>
            <div className="game-settings-row">
              <span className="game-settings-label">Ambient</span>
              <button
                className={`game-settings-cat-btn ${ambientMuted ? '' : 'active'}`}
                onClick={() => toggleCategory('ambient', ambientMuted, setAmbientMuted)}
              >
                {ambientMuted ? 'OFF' : 'ON'}
              </button>
            </div>
            <div className="game-settings-row">
              <span className="game-settings-label">Sound Effects</span>
              <button
                className={`game-settings-cat-btn ${sfxMuted ? '' : 'active'}`}
                onClick={() => toggleCategory('sfx', sfxMuted, setSfxMuted)}
              >
                {sfxMuted ? 'OFF' : 'ON'}
              </button>
            </div>
          </div>

          {/* Accessibility Section */}
          <div className="game-settings-section">
            <div className="game-settings-section-title">Accessibility</div>
            <div className="game-settings-row">
              <span className="game-settings-label">Chat Font Size</span>
              <div className="game-settings-control">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    className={`game-settings-size-btn ${chatFontSize === size ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange(size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="game-settings-section">
            <div className="game-settings-section-title">Actions</div>
            {activePuzzleId && (
              <div className="game-settings-action-row">
                <button
                  className={`game-settings-action-btn ${showConfirmReset ? 'confirm' : ''}`}
                  onClick={handleReset}
                >
                  <RotateCcw size={14} />
                  {showConfirmReset ? 'Confirm Reset?' : 'Reset Current Puzzle'}
                </button>
              </div>
            )}
            <div className="game-settings-action-row">
              <button
                className={`game-settings-action-btn leave ${showConfirmLeave ? 'confirm' : ''}`}
                onClick={handleLeave}
              >
                <LogOut size={14} />
                {showConfirmLeave ? 'Really Leave?' : 'Leave Game'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
