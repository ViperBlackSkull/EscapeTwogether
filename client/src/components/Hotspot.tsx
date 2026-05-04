import { useState } from 'react';
import type { RoomTheme } from '../themes/rooms.js';

export type HotspotState = 'locked' | 'available' | 'completed';

interface HotspotProps {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: HotspotState;
  theme: RoomTheme;
  onClick: () => void;
}

export default function Hotspot({ label, x, y, width, height, state, theme, onClick }: HotspotProps) {
  const [pressed, setPressed] = useState(false);
  const { colors } = theme;

  const styleVars = {
    '--hs-primary': state === 'completed' ? '#2a9d8f' : colors.primary,
    '--hs-primary-glow': state === 'completed' ? 'rgba(42,157,143,0.3)' : colors.primaryGlow,
    '--hs-secondary': state === 'completed' ? '#2a9d8f' : colors.secondary,
    '--hs-accent': state === 'completed' ? '#2a9d8f' : colors.accent,
  } as React.CSSProperties;

  return (
    <button
      className={`hotspot hotspot-${state} ${pressed ? 'hotspot-pressed' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        ...styleVars,
      }}
      onClick={onClick}
      disabled={state === 'completed' || state === 'locked'}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      title={label}
    >
      {state === 'locked' && <div className="hotspot-lock-icon">&#x1f512;</div>}
      <span className="hotspot-label">{label}</span>
      <span className="hotspot-ring" />
      <span className="hotspot-glow" />
    </button>
  );
}
