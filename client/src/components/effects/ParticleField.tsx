import { useMemo } from 'react';

export type ParticleStyle = 'dust' | 'sparks' | 'fog' | 'golden' | 'embers';

interface ParticleFieldProps {
  style: ParticleStyle;
  count?: number;
  paused?: boolean;
}

interface ParticleConfig {
  sizeRange: [number, number];
  opacityRange: [number, number];
  speedRange: [number, number];
  driftRange: [number, number];
  colors: string[];
  shape: 'circle' | 'square' | 'diamond' | 'spark';
  blur: boolean;
}

const PARTICLE_CONFIGS: Record<ParticleStyle, ParticleConfig> = {
  dust: {
    sizeRange: [2, 5],
    opacityRange: [0.08, 0.25],
    speedRange: [10, 22],
    driftRange: [10, 30],
    colors: ['#D2B48C', '#C4A882', '#B8A070'],
    shape: 'circle',
    blur: true,
  },
  sparks: {
    sizeRange: [1, 4],
    opacityRange: [0.2, 0.7],
    speedRange: [4, 10],
    driftRange: [5, 20],
    colors: ['#00FFFF', '#00CED1', '#48D1CC', '#7DF9FF'],
    shape: 'spark',
    blur: false,
  },
  fog: {
    sizeRange: [30, 80],
    opacityRange: [0.02, 0.06],
    speedRange: [15, 30],
    driftRange: [20, 50],
    colors: ['#8B8BA3', '#9B9BB3', '#ABABD3'],
    shape: 'circle',
    blur: true,
  },
  golden: {
    sizeRange: [2, 6],
    opacityRange: [0.15, 0.5],
    speedRange: [8, 18],
    driftRange: [8, 25],
    colors: ['#FFD700', '#E9C46A', '#F4A261', '#DAA520'],
    shape: 'diamond',
    blur: false,
  },
  embers: {
    sizeRange: [1, 3],
    opacityRange: [0.3, 0.8],
    speedRange: [6, 14],
    driftRange: [5, 15],
    colors: ['#FF6B35', '#E76F51', '#F4A261', '#FF8C42'],
    shape: 'circle',
    blur: true,
  },
};

export default function ParticleField({ style, count = 40, paused = false }: ParticleFieldProps) {
  const config = PARTICLE_CONFIGS[style];

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
      const speed = config.speedRange[0] + ((i * 1.618) % (config.speedRange[1] - config.speedRange[0]));
      const drift = config.driftRange[0] + Math.random() * (config.driftRange[1] - config.driftRange[0]);
      const opacity = config.opacityRange[0] + (i / count) * (config.opacityRange[1] - config.opacityRange[0]);
      const color = config.colors[i % config.colors.length];
      const left = 2 + ((i * (96 / count)) % 96);
      const delay = (i * 0.3) % speed;

      const shapeClass = `particle-field-${config.shape}`;

      return (
        <div
          key={i}
          className={`particle-field-item ${shapeClass}`}
          style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            opacity,
            background: color,
            filter: config.blur ? `blur(${Math.max(1, size / 3)}px)` : undefined,
            animationDuration: `${speed}s`,
            animationDelay: `${delay}s`,
            '--pf-drift': `${drift}px`,
          } as React.CSSProperties}
        />
      );
    });
  }, [style, count, config]);

  return (
    <div className={`particle-field ${paused ? 'particle-field-paused' : ''}`}>
      {particles}
    </div>
  );
}
