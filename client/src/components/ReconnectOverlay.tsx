import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';

export default function ReconnectOverlay() {
  const partnerConnected = useGameStore((s) => s.partnerConnected);
  const partnerDisconnectedAt = useGameStore((s) => s.partnerDisconnectedAt);
  const reconnectionInfo = useGameStore((s) => s.reconnectionInfo);
  const room = useGameStore((s) => s.room);
  const { clearReconnection, leaveRoom, attemptReconnect } = useRoom();

  const [countdown, setCountdown] = useState(300);
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Check for stored reconnection offer on mount (page reload scenario)
  useEffect(() => {
    if (reconnectionInfo && !room) {
      setShowReconnectPrompt(true);
    }
  }, [reconnectionInfo, room]);

  // Countdown for partner disconnection
  useEffect(() => {
    if (partnerConnected || !partnerDisconnectedAt) {
      setCountdown(300);
      return;
    }

    const updateCountdown = () => {
      const elapsed = Math.floor((Date.now() - partnerDisconnectedAt) / 1000);
      const remaining = Math.max(0, 300 - elapsed);
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [partnerConnected, partnerDisconnectedAt]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Reconnection prompt (page reload or fresh connect with stored token)
  if (showReconnectPrompt && reconnectionInfo) {
    return (
      <div className="reconnect-overlay">
        <div className="reconnect-card">
          <div className="reconnect-icon">🔗</div>
          <h3 className="reconnect-title">Resume Game?</h3>
          <p className="reconnect-text">
            You were disconnected from room <strong>{reconnectionInfo.roomId}</strong>.
          </p>
          <p className="reconnect-text">
            Rejoin as <strong>{reconnectionInfo.playerName}</strong>?
          </p>
          <div className="reconnect-actions">
            <button
              className="reconnect-btn reconnect-btn-primary"
              disabled={reconnecting}
              onClick={() => {
                setReconnecting(true);
                attemptReconnect(reconnectionInfo.reconnectionToken);
                // Give it a few seconds, then clear if still showing
                setTimeout(() => {
                  setReconnecting(false);
                  setShowReconnectPrompt(false);
                }, 5000);
              }}
            >
              {reconnecting ? 'Reconnecting...' : 'Rejoin Game'}
            </button>
            <button
              className="reconnect-btn reconnect-btn-secondary"
              onClick={() => {
                clearReconnection();
                setShowReconnectPrompt(false);
              }}
            >
              Start New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Partner disconnected overlay (shown during active game)
  if (!partnerConnected && partnerDisconnectedAt && room && room.state !== 'completed') {

    return (
      <div className="reconnect-overlay">
        <div className="reconnect-card">
          <div className="reconnect-waiting-dots">
            <span className="reconnect-dot" />
            <span className="reconnect-dot" />
            <span className="reconnect-dot" />
          </div>
          <h3 className="reconnect-title">Partner Disconnected</h3>
          <p className="reconnect-text">
            Waiting for your partner to reconnect...
          </p>
          <div className="reconnect-countdown">
            <span className="reconnect-countdown-value">{formatTime(countdown)}</span>
            <span className="reconnect-countdown-label">remaining</span>
          </div>
          {countdown <= 0 && (
            <div className="reconnect-actions">
              <button
                className="reconnect-btn reconnect-btn-secondary"
                onClick={() => {
                  leaveRoom();
                }}
              >
                Save &amp; Exit
              </button>
            </div>
          )}
          <p className="reconnect-hint">
            Your game progress has been saved automatically.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
