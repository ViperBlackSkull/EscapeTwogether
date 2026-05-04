import { useEffect, useState } from 'react';

interface ScreenTransitionProps {
  roomName?: string;
  roomDescription?: string;
  phase: 'fade-out' | 'holding' | 'fade-in';
  onPhaseComplete: (phase: 'fade-out' | 'holding' | 'fade-in') => void;
  fadeDuration?: number;
  holdDuration?: number;
}

export default function ScreenTransition({
  roomName,
  roomDescription,
  phase,
  onPhaseComplete,
  fadeDuration = 1500,
  holdDuration = 2000,
}: ScreenTransitionProps) {
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    setTextVisible(false);

    if (phase === 'fade-out') {
      requestAnimationFrame(() => setVisible(true));
      const timer = setTimeout(() => onPhaseComplete('fade-out'), fadeDuration);
      return () => clearTimeout(timer);
    }

    if (phase === 'holding') {
      setVisible(true);
      const textTimer = setTimeout(() => setTextVisible(true), 200);
      const completeTimer = setTimeout(() => onPhaseComplete('holding'), holdDuration);
      return () => {
        clearTimeout(textTimer);
        clearTimeout(completeTimer);
      };
    }

    if (phase === 'fade-in') {
      setVisible(true);
      setTextVisible(true);
      const textTimer = setTimeout(() => setTextVisible(false), 200);
      const fadeTimer = setTimeout(() => setVisible(false), fadeDuration - 300);
      const completeTimer = setTimeout(() => onPhaseComplete('fade-in'), fadeDuration);
      return () => {
        clearTimeout(textTimer);
        clearTimeout(fadeTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [phase, fadeDuration, holdDuration, onPhaseComplete]);

  return (
    <div className={`screen-transition ${visible ? 'screen-transition-visible' : ''}`}>
      <div className="screen-transition-overlay" />
      <div className="screen-transition-vignette" />
      <div className="screen-transition-content">
        {phase !== 'fade-in' && (
          <div className={`screen-transition-text ${textVisible ? 'screen-transition-text-visible' : ''}`}>
            {roomName && <h2 className="screen-transition-room-name">{roomName}</h2>}
            {roomDescription && <p className="screen-transition-room-desc">{roomDescription}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
