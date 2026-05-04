import { useEffect, useState, useMemo } from 'react';

export type PuzzleEffectType = 'success' | 'error' | 'hint' | 'room-complete';

interface PuzzleEffectsProps {
  activeEffect: PuzzleEffectType | null;
  onEffectEnd?: () => void;
  duration?: number;
}

export function SuccessBurst({ onEnd, duration = 1200 }: { onEnd?: () => void; duration?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onEnd?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onEnd]);

  const rays = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      angle: (i * 30),
      delay: i * 40,
    })),
  []);

  return (
    <div className={`puzzle-effect-success ${visible ? 'puzzle-effect-success-active' : ''}`}>
      <div className="puzzle-effect-burst-ring" />
      {rays.map((ray, i) => (
        <div
          key={i}
          className="puzzle-effect-ray"
          style={{
            transform: `rotate(${ray.angle}deg)`,
            animationDelay: `${ray.delay}ms`,
          }}
        />
      ))}
      <div className="puzzle-effect-core" />
    </div>
  );
}

export function ErrorShake({ onEnd, duration = 500 }: { onEnd?: () => void; duration?: number }) {
  useEffect(() => {
    const timer = setTimeout(() => onEnd?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onEnd]);

  return <div className="puzzle-effect-error" />;
}

export function HintScroll({ onEnd, duration = 2000 }: { onEnd?: () => void; duration?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onEnd?.(), 400);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onEnd]);

  return (
    <div className={`puzzle-effect-hint ${visible ? 'puzzle-effect-hint-visible' : ''}`}>
      <div className="puzzle-effect-scroll">
        <div className="puzzle-effect-scroll-top" />
        <div className="puzzle-effect-scroll-body">
          <div className="puzzle-effect-scroll-glow" />
        </div>
        <div className="puzzle-effect-scroll-bottom" />
      </div>
    </div>
  );
}

export function RoomCompletePulse({ onEnd, duration = 2500 }: { onEnd?: () => void; duration?: number }) {
  const [visible, setVisible] = useState(false);

  const waves = useMemo(() => Array.from({ length: 3 }, (_, i) => ({ delay: i * 300 })), []);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onEnd?.(), 500);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onEnd]);

  return (
    <div className={`puzzle-effect-room-complete ${visible ? 'puzzle-effect-room-complete-active' : ''}`}>
      {waves.map((wave, i) => (
        <div
          key={i}
          className="puzzle-effect-pulse-wave"
          style={{ animationDelay: `${wave.delay}ms` }}
        />
      ))}
      <div className="puzzle-effect-door-open">
        <div className="puzzle-effect-door-light" />
      </div>
    </div>
  );
}

export default function PuzzleEffects({ activeEffect, onEffectEnd, duration }: PuzzleEffectsProps) {
  if (!activeEffect) return null;

  switch (activeEffect) {
    case 'success':
      return <SuccessBurst onEnd={onEffectEnd} duration={duration ?? 1200} />;
    case 'error':
      return <ErrorShake onEnd={onEffectEnd} duration={duration ?? 500} />;
    case 'hint':
      return <HintScroll onEnd={onEffectEnd} duration={duration ?? 2000} />;
    case 'room-complete':
      return <RoomCompletePulse onEnd={onEffectEnd} duration={duration ?? 2500} />;
    default:
      return null;
  }
}
