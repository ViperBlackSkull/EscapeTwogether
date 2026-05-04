import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';

const COLOR_HEX: Record<string, string> = {
  red: '#e76f51',
  blue: '#3b82f6',
  green: '#2a9d8f',
  yellow: '#e9c46a',
  purple: '#a855f7',
  orange: '#f4a261',
};

interface WireConnectionProps {
  puzzleId: string;
  data: Record<string, any>;
}

export default function WireConnection({ puzzleId, data }: WireConnectionProps) {
  const { playerId } = useGameStore();
  const { sendPuzzleAction } = useRoom();

  const role: 'player-a' | 'player-b' | null =
    playerId && data.roles?.[playerId] ? data.roles[playerId] : null;

  if (role === 'player-a') {
    return <PlayerAView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
  }
  if (role === 'player-b') {
    return <PlayerBView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
  }
  return (
    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
      Waiting for role assignment...
    </div>
  );
}

interface SharedProps {
  puzzleId: string;
  data: Record<string, any>;
  sendPuzzleAction: (puzzleId: string, action: string, data: Record<string, any>) => void;
}

function PlayerAView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const colors: string[] = data.playerAColors || [];
  const commLog: { sender: string; message: string }[] = data.communicationLog || [];
  const hintLevel: number = data.hintLevel || 0;
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleSendInfo = useCallback(
    (color: string) => {
      console.log('[SFX] send-color-info');
      sendPuzzleAction(puzzleId, 'send-color-info', {
        message: `My wire #${colors.indexOf(color) + 1} is ${color}`,
      });
      setSelectedColor(color);
      setTimeout(() => setSelectedColor(null), 1500);
    },
    [colors, puzzleId, sendPuzzleAction],
  );

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  return (
    <div className="wire-view">
      <div className="cipher-role-badge">Input Operator</div>
      <p className="cipher-instruction">
        You see the INPUT side with colored wires. Describe each wire to your partner so they can connect them to the correct numbered outputs.
      </p>

      <div className="wire-board">
        <h4 className="split-section-label">Your Colored Wires</h4>
        <div className="wire-input-list">
          {colors.map((color, i) => (
            <div
              key={i}
              className={`wire-node wire-node-input ${selectedColor === color ? 'wire-node-active' : ''}`}
              onClick={() => handleSendInfo(color)}
            >
              <div className="wire-stub" style={{ background: COLOR_HEX[color] || '#888' }} />
              <div
                className="wire-dot"
                style={{ background: COLOR_HEX[color] || '#888', boxShadow: `0 0 12px ${COLOR_HEX[color] || '#888'}40` }}
              />
              <span className="wire-label" style={{ color: COLOR_HEX[color] }}>
                {color}
              </span>
              <span className="wire-index">#{i + 1}</span>
            </div>
          ))}
        </div>
        <p className="wire-hint-text">Click a wire to describe it to your partner</p>
      </div>

      {commLog.length > 0 && (
        <div className="wire-comm-log">
          <h4 className="split-section-label">Communication Log</h4>
          <div className="wire-log-entries">
            {commLog.map((entry, i) => (
              <div key={i} className={`wire-log-entry ${entry.sender === 'player-a' ? 'wire-log-self' : 'wire-log-partner'}`}>
                <span className="wire-log-sender">{entry.sender === 'player-a' ? 'You' : 'Partner'}</span>
                <span className="wire-log-msg">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="split-actions">
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 4}>
          {hintLevel >= 4 ? 'All hints used' : `Hint (${hintLevel}/4)`}
        </button>
      </div>
    </div>
  );
}

function PlayerBView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const outputs: number[] = data.playerBOutputs || [];
  const connections: Record<number, string | null> = data.connections || {};
  const commLog: { sender: string; message: string }[] = data.communicationLog || [];
  const hintLevel: number = data.hintLevel || 0;
  const [assigningOutput, setAssigningOutput] = useState<number | null>(null);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

  const handleConnect = useCallback(
    (outputIndex: number, color: string) => {
      console.log('[SFX] connect-wire');
      sendPuzzleAction(puzzleId, 'connect-wire', { outputIndex, color });
      setAssigningOutput(null);
    },
    [puzzleId, sendPuzzleAction],
  );

  const handleDisconnect = useCallback(
    (outputIndex: number) => {
      console.log('[SFX] disconnect-wire');
      sendPuzzleAction(puzzleId, 'disconnect-wire', { outputIndex });
    },
    [puzzleId, sendPuzzleAction],
  );

  const handleCheck = useCallback(() => {
    console.log('[SFX] check-connections');
    sendPuzzleAction(puzzleId, 'check-connections', {});
    setCheckMessage('Checking...');
    setTimeout(() => setCheckMessage(null), 2000);
  }, [puzzleId, sendPuzzleAction]);

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  const connectedCount = Object.values(connections).filter((c) => c !== null).length;

  return (
    <div className="wire-view">
      <div className="cipher-role-badge cipher-role-badge-lock">Output Operator</div>
      <p className="cipher-instruction">
        You see the OUTPUT side with numbered ports. Listen to your partner and connect each output to the correct color.
      </p>

      <div className="wire-board">
        <h4 className="split-section-label">Numbered Outputs ({connectedCount}/6 connected)</h4>
        <div className="wire-output-list">
          {outputs.map((outputNum) => {
            const connectedColor = connections[outputNum];
            return (
              <div
                key={outputNum}
                className={`wire-node wire-node-output ${connectedColor ? 'wire-node-connected' : ''} ${assigningOutput === outputNum ? 'wire-node-active' : ''}`}
              >
                <div className="wire-output-header">
                  <span className="wire-output-num">#{outputNum}</span>
                  {connectedColor && (
                    <button
                      className="wire-disconnect-btn"
                      onClick={() => handleDisconnect(outputNum)}
                      title="Disconnect"
                    >
                      &times;
                    </button>
                  )}
                </div>
                {connectedColor ? (
                  <div
                    className="wire-dot wire-dot-large"
                    style={{
                      background: COLOR_HEX[connectedColor] || '#888',
                      boxShadow: `0 0 14px ${COLOR_HEX[connectedColor] || '#888'}50`,
                    }}
                  >
                    <span className="wire-dot-label">{connectedColor}</span>
                  </div>
                ) : (
                  <button
                    className="wire-connect-btn"
                    onClick={() => setAssigningOutput(assigningOutput === outputNum ? null : outputNum)}
                  >
                    {assigningOutput === outputNum ? 'Cancel' : 'Assign'}
                  </button>
                )}
                <div className="wire-stub wire-stub-right" style={{ background: connectedColor ? COLOR_HEX[connectedColor] : '#333' }} />
              </div>
            );
          })}
        </div>

        {assigningOutput !== null && (
          <div className="wire-color-picker">
            <h4 className="split-section-label">Select a color for output #{assigningOutput}</h4>
            <div className="wire-color-options">
              {allColors.map((color) => {
                const alreadyUsed = Object.values(connections).includes(color);
                return (
                  <button
                    key={color}
                    className={`wire-color-btn ${alreadyUsed ? 'wire-color-btn-used' : ''}`}
                    style={{ borderColor: COLOR_HEX[color] }}
                    onClick={() => handleConnect(assigningOutput, color)}
                    disabled={alreadyUsed}
                  >
                    <span className="wire-color-swatch" style={{ background: COLOR_HEX[color] }} />
                    <span>{color}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {commLog.length > 0 && (
        <div className="wire-comm-log">
          <h4 className="split-section-label">Communication Log</h4>
          <div className="wire-log-entries">
            {commLog.map((entry, i) => (
              <div key={i} className={`wire-log-entry ${entry.sender === 'player-b' ? 'wire-log-self' : 'wire-log-partner'}`}>
                <span className="wire-log-sender">{entry.sender === 'player-b' ? 'You' : 'Partner'}</span>
                <span className="wire-log-msg">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {checkMessage && <p className="split-message">{checkMessage}</p>}

      <div className="split-actions">
        <button className="cipher-submit-btn" onClick={handleCheck}>
          Check Connections
        </button>
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 4}>
          {hintLevel >= 4 ? 'All hints used' : `Hint (${hintLevel}/4)`}
        </button>
      </div>
    </div>
  );
}
