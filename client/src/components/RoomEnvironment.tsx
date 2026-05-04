import { useEffect, useRef, useMemo } from 'react';
import type { RoomTheme } from '../themes/rooms.js';

interface RoomEnvironmentProps {
  theme: RoomTheme;
}

export default function RoomEnvironment({ theme }: RoomEnvironmentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mouse-x', `${x}%`);
      el.style.setProperty('--mouse-y', `${y}%`);
    };

    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, []);

  const particles = useMemo(() => {
    const { count, sizeRange, speedRange, driftRange, opacityRange } = theme.particles;
    return Array.from({ length: count }, (_, i) => {
      const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
      const speed = speedRange[0] + ((i * 1.7) % (speedRange[1] - speedRange[0]));
      const drift = driftRange[0] + Math.random() * (driftRange[1] - driftRange[0]);
      const opacity = opacityRange[0] + (i / count) * (opacityRange[1] - opacityRange[0]);
      const left = 5 + ((i * (85 / count)) % 85) + Math.random() * 5;
      const delay = i * (speed / count);

      return (
        <div
          key={i}
          className={`env-particle env-particle-${theme.particles.shape}`}
          style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            '--particle-speed': `${speed}s`,
            '--particle-drift': `${drift}px`,
            opacity,
            animationDelay: `${delay}s`,
            animationDuration: `${speed}s`,
            background: theme.colors.particleColor,
          } as React.CSSProperties}
        />
      );
    });
  }, [theme]);

  const { colors, patterns } = theme;

  return (
    <div ref={containerRef} className="room-environment">
      {/* Themed background gradient */}
      <div
        className="env-bg-gradient"
        style={{
          background: `linear-gradient(180deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientMid} 40%, ${colors.bgGradientEnd} 100%)`,
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="env-grid-pattern"
        style={{
          opacity: patterns.gridOpacity,
          backgroundImage: `linear-gradient(${patterns.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${patterns.gridColor} 1px, transparent 1px)`,
        }}
      />

      {/* Mouse-following spotlight */}
      <div
        className="env-spotlight"
        style={{
          background: `radial-gradient(ellipse 600px 400px at var(--mouse-x, 50%) var(--mouse-y, 30%), ${colors.spotlightColor}, transparent)`,
        }}
      />

      {/* Themed vignette */}
      <div
        className="env-vignette"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${patterns.vignetteStrength}) 100%)`,
        }}
      />

      {/* Ambient flicker light */}
      <div
        className="env-flicker"
        style={{
          background: `radial-gradient(ellipse at 50% 15%, ${colors.spotlightColor} 0%, transparent 50%)`,
        }}
      />

      {/* Floating particles */}
      <div className="env-particles">{particles}</div>

      {/* Room frame / border glow */}
      <div
        className="env-frame"
        style={{
          borderColor: colors.borderColor,
          boxShadow: `inset 0 0 60px ${colors.borderGlow}, 0 0 40px ${colors.borderGlow}`,
        }}
      />
    </div>
  );
}
