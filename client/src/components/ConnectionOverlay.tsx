import { useSocket } from '../hooks/useSocket.js';

export default function ConnectionOverlay() {
  const { isConnected } = useSocket();

  if (isConnected) return null;

  return (
    <div className="connection-overlay">
      <div className="connection-card">
        <div className="connection-spinner" />
        <h3 style={{ margin: '0 0 8px', color: 'var(--accent-amber)', fontSize: 18 }}>
          Connection Lost
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
          Reconnecting to server...
        </p>
      </div>
    </div>
  );
}
