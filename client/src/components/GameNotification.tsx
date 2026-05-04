import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { UserPlus, Lightbulb, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface VisibleNotification {
  id: number;
  type: string;
  message: string;
  timestamp: number;
}

let notifId = 0;

const ICON_MAP: Record<string, { icon: typeof Info; color: string }> = {
  'player-joined': { icon: UserPlus, color: 'var(--accent-teal)' },
  'player-left': { icon: AlertTriangle, color: 'var(--accent-red)' },
  hint: { icon: Lightbulb, color: 'var(--accent-gold)' },
  'puzzle-solved': { icon: CheckCircle, color: 'var(--accent-teal)' },
  'game-started': { icon: CheckCircle, color: 'var(--accent-amber)' },
  'game-completed': { icon: CheckCircle, color: 'var(--accent-gold)' },
};

export default function GameNotification() {
  const { gameEvents } = useGameStore();
  const [visible, setVisible] = useState<VisibleNotification[]>([]);

  useEffect(() => {
    if (gameEvents.length === 0) return;

    const latest = gameEvents[gameEvents.length - 1];
    const id = ++notifId;

    const notif: VisibleNotification = {
      id,
      type: latest.type,
      message: latest.message,
      timestamp: latest.timestamp,
    };

    setVisible((prev) => [...prev, notif]);

    console.log(`[SFX] notification-${latest.type}`);

    const timer = setTimeout(() => {
      setVisible((prev) => prev.filter((n) => n.id !== id));
    }, 5000);

    return () => clearTimeout(timer);
  }, [gameEvents.length]);

  if (visible.length === 0) return null;

  return (
    <div className="game-notifications">
      {visible.map((notif, i) => {
        const mapping = ICON_MAP[notif.type] ?? { icon: Info, color: 'var(--text-secondary)' };
        const Icon = mapping.icon;
        return (
          <div
            key={notif.id}
            className="game-notification notification-enter"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <Icon size={16} style={{ color: mapping.color, flexShrink: 0 }} />
            <span className="game-notification-text">{notif.message}</span>
          </div>
        );
      })}
    </div>
  );
}
