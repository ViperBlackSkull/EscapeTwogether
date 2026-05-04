import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';

interface MapCell {
  type: 'empty' | 'obstacle' | 'treasure' | 'start';
  label?: string;
}

interface Position {
  row: number;
  col: number;
}

interface MapNavigatorProps {
  puzzleId: string;
  data: Record<string, any>;
}

export default function MapNavigator({ puzzleId, data }: MapNavigatorProps) {
  const { playerId } = useGameStore();
  const { sendPuzzleAction } = useRoom();

  const role: 'guide' | 'explorer' | null =
    playerId && data.roles?.[playerId] ? data.roles[playerId] : null;

  if (role === 'guide') {
    return <GuideView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
  }
  if (role === 'explorer') {
    return <ExplorerView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
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

const OBSTACLE_ICONS: Record<string, string> = {
  wall: '🧱',
  pit: '🕳️',
  boulder: '🪨',
  thorns: '🌿',
};

function GuideView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const grid: MapCell[][] = data.grid || [];
  const explorerPosition: Position = data.explorerPosition || { row: 7, col: 0 };
  const highlightedCells: Position[] = data.highlightedCells || [];
  const communicationLog: { sender: string; message: string }[] = data.communicationLog || [];
  const hintLevel: number = data.hintLevel || 0;
  const penaltySeconds: number = data.penaltySeconds || 0;
  const phase: string = data.phase || 'playing';

  const [chatMessage, setChatMessage] = useState('');
  const [moveMessage, setMoveMessage] = useState<string | null>(null);

  const isHighlighted = (r: number, c: number) =>
    highlightedCells.some(h => h.row === r && h.col === c);

  const handleHighlight = useCallback((row: number, col: number) => {
    sendPuzzleAction(puzzleId, 'highlight-cell', { row, col });
  }, [puzzleId, sendPuzzleAction]);

  const handleSendMessage = useCallback(() => {
    if (!chatMessage.trim()) return;
    sendPuzzleAction(puzzleId, 'send-message', { message: chatMessage });
    setChatMessage('');
  }, [puzzleId, sendPuzzleAction, chatMessage]);

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
    setMoveMessage('Hint requested');
    setTimeout(() => setMoveMessage(null), 2000);
  }, [puzzleId, sendPuzzleAction]);

  const isExplorerAt = (r: number, c: number) =>
    explorerPosition.row === r && explorerPosition.col === c;

  return (
    <div className="map-view">
      <div className="cipher-role-badge">Guide</div>
      <p className="cipher-instruction">
        You see the full map! Guide the Explorer to the treasure (★).
        Highlight cells to mark safe paths or dangers. Communicate directions!
      </p>

      {penaltySeconds > 0 && (
        <div className="map-penalty">Penalty: +{penaltySeconds}s</div>
      )}

      <div className="map-grid-container">
        <div className="map-grid map-grid-8x8">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isExplorer = isExplorerAt(r, c);
              const isHighlight = isHighlighted(r, c);
              const isTreasure = cell.type === 'treasure';
              const isStart = cell.type === 'start';
              const isObstacle = cell.type === 'obstacle';

              let cellClass = 'map-cell';
              if (isExplorer) cellClass += ' map-cell-explorer';
              else if (isTreasure) cellClass += ' map-cell-treasure';
              else if (isObstacle) cellClass += ' map-cell-obstacle';
              else if (isStart) cellClass += ' map-cell-start';
              if (isHighlight) cellClass += ' map-cell-highlighted';

              return (
                <div
                  key={`${r}-${c}`}
                  className={cellClass}
                  onClick={() => !isExplorer && handleHighlight(r, c)}
                  title={isObstacle ? cell.label || 'obstacle' : `(${r},${c})`}
                >
                  {isExplorer && <span className="map-explorer-icon">🧭</span>}
                  {isTreasure && !isExplorer && <span className="map-treasure-icon">★</span>}
                  {isObstacle && !isExplorer && (
                    <span className="map-obstacle-icon">{OBSTACLE_ICONS[cell.label || 'wall'] || '▪'}</span>
                  )}
                  {isStart && !isExplorer && !isTreasure && <span className="map-start-icon">⬤</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="map-legend">
        <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#2a9d8f' }}></span>Explorer</span>
        <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#e9c46a' }}></span>Treasure</span>
        <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#e76f51' }}></span>Obstacle</span>
        <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#f4a261' }}></span>Highlighted</span>
      </div>

      <div className="map-comm">
        <h4 className="split-section-label">Communication Log</h4>
        <div className="wire-log-entries">
          {communicationLog.length === 0 && (
            <p className="seq-no-messages">Guide the Explorer! Describe obstacles and safe directions.</p>
          )}
          {communicationLog.map((entry, i) => (
            <div key={i} className={`wire-log-entry ${entry.sender === 'guide' ? 'wire-log-self' : 'wire-log-partner'}`}>
              <span className="wire-log-sender">{entry.sender === 'guide' ? 'You' : 'Explorer'}</span>
              <span className="wire-log-msg">{entry.message}</span>
            </div>
          ))}
        </div>

        <div className="seq-input-row">
          <input
            className="seq-chat-input"
            type="text"
            placeholder="Tell the Explorer which way to go..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <button className="cipher-submit-btn seq-send-btn" onClick={handleSendMessage} disabled={!chatMessage.trim()}>
            Send
          </button>
        </div>
      </div>

      {moveMessage && <p className="split-message">{moveMessage}</p>}

      <div className="split-actions">
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 3 || phase === 'solved'}>
          {hintLevel >= 3 ? 'All hints used' : `Hint (${hintLevel}/3)`}
        </button>
      </div>
    </div>
  );
}

function ExplorerView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const grid: MapCell[][] = data.grid || [];
  const explorerPosition: Position = data.explorerPosition || { row: 7, col: 0 };
  const fogOfWar: boolean[][] = data.fogOfWar || [];
  const highlightedCells: Position[] = data.highlightedCells || [];
  const directions: string[] = data.directions || [];
  const communicationLog: { sender: string; message: string }[] = data.communicationLog || [];
  const moveHistory: string[] = data.moveHistory || [];
  const penaltySeconds: number = data.penaltySeconds || 0;
  const hintLevel: number = data.hintLevel || 0;
  const phase: string = data.phase || 'playing';

  const [chatMessage, setChatMessage] = useState('');
  const [moveMessage, setMoveMessage] = useState<string | null>(null);

  const isHighlighted = (r: number, c: number) =>
    highlightedCells.some(h => h.row === r && h.col === c);

  const handleMove = useCallback((direction: string) => {
    console.log('[SFX] move', direction);
    sendPuzzleAction(puzzleId, 'move', { direction });
  }, [puzzleId, sendPuzzleAction]);

  const handleSendMessage = useCallback(() => {
    if (!chatMessage.trim()) return;
    sendPuzzleAction(puzzleId, 'send-message', { message: chatMessage });
    setChatMessage('');
  }, [puzzleId, sendPuzzleAction, chatMessage]);

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
    setMoveMessage('Hint requested');
    setTimeout(() => setMoveMessage(null), 2000);
  }, [puzzleId, sendPuzzleAction]);

  const isVisible = (r: number, c: number) =>
    fogOfWar[r]?.[c] === true;

  const isExplorerAt = (r: number, c: number) =>
    explorerPosition.row === r && explorerPosition.col === c;

  if (phase === 'solved') {
    return (
      <div className="map-view">
        <div className="cipher-role-badge">Explorer</div>
        <div className="map-solved">
          <div className="map-solved-icon">🏆</div>
          <h3 style={{ color: 'var(--accent-gold)', margin: '8px 0' }}>Treasure Found!</h3>
          {penaltySeconds > 0 && (
            <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>
              Time penalty: +{penaltySeconds}s
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Moves taken: {moveHistory.length}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view">
      <div className="cipher-role-badge cipher-role-badge-lock">Explorer</div>
      <p className="cipher-instruction">
        Navigate to the treasure! You can only see nearby cells. Follow your Guide's directions.
      </p>

      {penaltySeconds > 0 && (
        <div className="map-penalty">Penalty: +{penaltySeconds}s</div>
      )}

      <div className="map-grid-container">
        <div className="map-grid map-grid-8x8">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const visible = isVisible(r, c);
              const isExplorer = isExplorerAt(r, c);
              const isHighlight = isHighlighted(r, c);
              const isTreasure = cell.type === 'treasure';
              const isObstacle = cell.type === 'obstacle';

              let cellClass = 'map-cell';
              if (!visible && !isExplorer) cellClass += ' map-cell-fog';
              else if (isExplorer) cellClass += ' map-cell-explorer';
              else if (isTreasure) cellClass += ' map-cell-treasure';
              else if (isObstacle) cellClass += ' map-cell-obstacle';
              else cellClass += ' map-cell-visible';
              if (isHighlight && (visible || isExplorer)) cellClass += ' map-cell-highlighted';

              return (
                <div key={`${r}-${c}`} className={cellClass}>
                  {isExplorer && <span className="map-explorer-icon">🧭</span>}
                  {visible && isTreasure && !isExplorer && <span className="map-treasure-icon">★</span>}
                  {visible && isObstacle && !isExplorer && (
                    <span className="map-obstacle-icon">{OBSTACLE_ICONS[cell.label || 'wall'] || '▪'}</span>
                  )}
                  {!visible && !isExplorer && <span className="map-fog-icon">?</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Direction buttons */}
      <div className="map-controls">
        <div className="map-dpad">
          <div className="map-dpad-row">
            <button className="map-dir-btn" onClick={() => handleMove('up')} title="Move Up">↑</button>
          </div>
          <div className="map-dpad-row">
            <button className="map-dir-btn" onClick={() => handleMove('left')} title="Move Left">←</button>
            <div className="map-dpad-center"></div>
            <button className="map-dir-btn" onClick={() => handleMove('right')} title="Move Right">→</button>
          </div>
          <div className="map-dpad-row">
            <button className="map-dir-btn" onClick={() => handleMove('down')} title="Move Down">↓</button>
          </div>
        </div>
      </div>

      {/* Reference directions from the puzzle */}
      {directions.length > 0 && (
        <div className="map-directions">
          <h4 className="split-section-label">Your Directions</h4>
          <div className="map-directions-list">
            {directions.map((d, i) => (
              <span key={i} className="map-direction-chip">{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* Move history */}
      {moveHistory.length > 0 && (
        <div className="map-history">
          <h4 className="split-section-label">Move History ({moveHistory.length})</h4>
          <div className="map-history-list">
            {moveHistory.map((m, i) => (
              <span key={i} className="map-history-chip">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Communication */}
      <div className="map-comm">
        <h4 className="split-section-label">Communication Log</h4>
        <div className="wire-log-entries">
          {communicationLog.length === 0 && (
            <p className="seq-no-messages">Waiting for your Guide's directions...</p>
          )}
          {communicationLog.map((entry, i) => (
            <div key={i} className={`wire-log-entry ${entry.sender === 'explorer' ? 'wire-log-self' : 'wire-log-partner'}`}>
              <span className="wire-log-sender">{entry.sender === 'explorer' ? 'You' : 'Guide'}</span>
              <span className="wire-log-msg">{entry.message}</span>
            </div>
          ))}
        </div>

        <div className="seq-input-row">
          <input
            className="seq-chat-input"
            type="text"
            placeholder="Ask your Guide for directions..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <button className="cipher-submit-btn seq-send-btn" onClick={handleSendMessage} disabled={!chatMessage.trim()}>
            Send
          </button>
        </div>
      </div>

      {moveMessage && <p className="split-message">{moveMessage}</p>}

      <div className="split-actions">
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 3}>
          {hintLevel >= 3 ? 'All hints used' : `Hint (${hintLevel}/3)`}
        </button>
      </div>
    </div>
  );
}
