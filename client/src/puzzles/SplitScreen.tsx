import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';

interface GridCell {
  symbol: string;
  color: string;
}

interface SplitScreenProps {
  puzzleId: string;
  data: Record<string, any>;
}

export default function SplitScreen({ puzzleId, data }: SplitScreenProps) {
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
  const playerView: (GridCell | null)[][] = data.playerAView || emptyGrid();
  const placements: (GridCell | null)[][] = data.playerAPlacements || emptyGrid();
  const commLog: { sender: string; row: number; col: number; cell: GridCell }[] =
    data.communicationLog || [];
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [placingCell, setPlacingCell] = useState<{ row: number; col: number; cell: GridCell } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hintLevel: number = data.hintLevel || 0;

  const handleSendCell = useCallback(
    (row: number, col: number) => {
      const cell = playerView[row]?.[col];
      if (!cell) return;
      console.log('[SFX] send-cell');
      sendPuzzleAction(puzzleId, 'send-cell', { row, col, cell });
      setMessage(`Sent: row ${row + 1}, col ${col + 1} — "${cell.symbol}"`);
      setTimeout(() => setMessage(null), 2000);
    },
    [playerView, puzzleId, sendPuzzleAction],
  );

  const handlePlaceCell = useCallback(
    (row: number, col: number, cell: GridCell) => {
      console.log('[SFX] place-cell');
      sendPuzzleAction(puzzleId, 'place-cell', { row, col, cell });
      setPlacingCell(null);
    },
    [puzzleId, sendPuzzleAction],
  );

  const handleCheck = useCallback(() => {
    console.log('[SFX] check-solution');
    sendPuzzleAction(puzzleId, 'check-solution', {});
  }, [puzzleId, sendPuzzleAction]);

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  const receivedCells = commLog.filter((e) => e.sender === 'player-b');

  return (
    <div className="split-screen-view">
      <div className="cipher-role-badge">Left Eye</div>
      <p className="cipher-instruction">
        You see the LEFT half. Tell your partner what you see, and place what they describe to you on the right.
      </p>

      <div className="split-grid-container">
        <h4 className="split-section-label">Your View</h4>
        <div className="split-grid">
          {playerView.map((row, r) =>
            row.map((cell, c) => {
              const placed = placements[r]?.[c];
              const isOwn = cell !== null;
              const displayCell = placed || cell;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`split-cell ${isOwn ? 'split-cell-own' : 'split-cell-empty'} ${selectedCell?.row === r && selectedCell?.col === c ? 'split-cell-selected' : ''} ${placed && cell === null ? 'split-cell-placed' : ''}`}
                  style={displayCell ? { borderColor: displayCell.color } : undefined}
                  onClick={() => {
                    if (isOwn) {
                      handleSendCell(r, c);
                      setSelectedCell({ row: r, col: c });
                    } else if (placingCell && placingCell.row === r && placingCell.col === c) {
                      handlePlaceCell(r, c, placingCell.cell);
                    }
                  }}
                >
                  {displayCell ? (
                    <span className="split-cell-symbol" style={{ color: displayCell.color }}>
                      {displayCell.symbol}
                    </span>
                  ) : (
                    <span className="split-cell-empty-marker">?</span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {receivedCells.length > 0 && (
        <div className="split-received">
          <h4 className="split-section-label">Partner Shared</h4>
          <div className="split-received-list">
            {receivedCells.map((entry, i) => (
              <button
                key={i}
                className="split-received-item"
                onClick={() => setPlacingCell({ row: entry.row, col: entry.col, cell: entry.cell })}
              >
                <span style={{ color: entry.cell.color }}>{entry.cell.symbol}</span>
                <span className="split-received-pos">
                  R{entry.row + 1}C{entry.col + 1}
                </span>
              </button>
            ))}
          </div>
          {placingCell && (
            <p className="split-placing-hint">
              Click an empty cell on the right side to place{' '}
              <span style={{ color: placingCell.cell.color }}>{placingCell.cell.symbol}</span> at
              R{placingCell.row + 1}C{placingCell.col + 1}
            </p>
          )}
        </div>
      )}

      {message && <p className="split-message">{message}</p>}

      <div className="split-actions">
        <button className="cipher-submit-btn" onClick={handleCheck}>
          Check Solution
        </button>
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 4}>
          {hintLevel >= 4 ? 'All hints used' : `Hint (${hintLevel}/4)`}
        </button>
      </div>
    </div>
  );
}

function PlayerBView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const playerView: (GridCell | null)[][] = data.playerBView || emptyGrid();
  const placements: (GridCell | null)[][] = data.playerBPlacements || emptyGrid();
  const commLog: { sender: string; row: number; col: number; cell: GridCell }[] =
    data.communicationLog || [];
  const [placingCell, setPlacingCell] = useState<{ row: number; col: number; cell: GridCell } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hintLevel: number = data.hintLevel || 0;

  const handleSendCell = useCallback(
    (row: number, col: number) => {
      const cell = playerView[row]?.[col];
      if (!cell) return;
      console.log('[SFX] send-cell');
      sendPuzzleAction(puzzleId, 'send-cell', { row, col, cell });
      setMessage(`Sent: row ${row + 1}, col ${col + 1} — "${cell.symbol}"`);
      setTimeout(() => setMessage(null), 2000);
    },
    [playerView, puzzleId, sendPuzzleAction],
  );

  const handlePlaceCell = useCallback(
    (row: number, col: number, cell: GridCell) => {
      console.log('[SFX] place-cell');
      sendPuzzleAction(puzzleId, 'place-cell', { row, col, cell });
      setPlacingCell(null);
    },
    [puzzleId, sendPuzzleAction],
  );

  const handleCheck = useCallback(() => {
    console.log('[SFX] check-solution');
    sendPuzzleAction(puzzleId, 'check-solution', {});
  }, [puzzleId, sendPuzzleAction]);

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  const receivedCells = commLog.filter((e) => e.sender === 'player-a');

  return (
    <div className="split-screen-view">
      <div className="cipher-role-badge cipher-role-badge-lock">Right Eye</div>
      <p className="cipher-instruction">
        You see the RIGHT half. Tell your partner what you see, and place what they describe to you on the left.
      </p>

      <div className="split-grid-container">
        <h4 className="split-section-label">Your View</h4>
        <div className="split-grid">
          {playerView.map((row, r) =>
            row.map((cell, c) => {
              const placed = placements[r]?.[c];
              const isOwn = cell !== null;
              const displayCell = placed || cell;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`split-cell ${isOwn ? 'split-cell-own' : 'split-cell-empty'} ${placed && cell === null ? 'split-cell-placed' : ''}`}
                  style={displayCell ? { borderColor: displayCell.color } : undefined}
                  onClick={() => {
                    if (isOwn) {
                      handleSendCell(r, c);
                    } else if (placingCell && placingCell.row === r && placingCell.col === c) {
                      handlePlaceCell(r, c, placingCell.cell);
                    }
                  }}
                >
                  {displayCell ? (
                    <span className="split-cell-symbol" style={{ color: displayCell.color }}>
                      {displayCell.symbol}
                    </span>
                  ) : (
                    <span className="split-cell-empty-marker">?</span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {receivedCells.length > 0 && (
        <div className="split-received">
          <h4 className="split-section-label">Partner Shared</h4>
          <div className="split-received-list">
            {receivedCells.map((entry, i) => (
              <button
                key={i}
                className="split-received-item"
                onClick={() => setPlacingCell({ row: entry.row, col: entry.col, cell: entry.cell })}
              >
                <span style={{ color: entry.cell.color }}>{entry.cell.symbol}</span>
                <span className="split-received-pos">
                  R{entry.row + 1}C{entry.col + 1}
                </span>
              </button>
            ))}
          </div>
          {placingCell && (
            <p className="split-placing-hint">
              Click an empty cell on the left side to place{' '}
              <span style={{ color: placingCell.cell.color }}>{placingCell.cell.symbol}</span> at
              R{placingCell.row + 1}C{placingCell.col + 1}
            </p>
          )}
        </div>
      )}

      {message && <p className="split-message">{message}</p>}

      <div className="split-actions">
        <button className="cipher-submit-btn" onClick={handleCheck}>
          Check Solution
        </button>
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 4}>
          {hintLevel >= 4 ? 'All hints used' : `Hint (${hintLevel}/4)`}
        </button>
      </div>
    </div>
  );
}

function emptyGrid(): (GridCell | null)[][] {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}
