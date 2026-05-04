import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';

const SYMBOL_PALETTE = ['★', '◆', '▲', '●', '■', '♣', '♥', '✦'];

interface SequenceMemoryProps {
  puzzleId: string;
  data: Record<string, any>;
}

export default function SequenceMemory({ puzzleId, data }: SequenceMemoryProps) {
  const { playerId } = useGameStore();
  const { sendPuzzleAction } = useRoom();

  const role: 'watcher' | 'repeater' | null =
    playerId && data.roles?.[playerId] ? data.roles[playerId] : null;

  if (role === 'watcher') {
    return <WatcherView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
  }
  if (role === 'repeater') {
    return <RepeaterView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
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

function WatcherView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const sequence: { symbol: string; color: string }[] = data.sequence || [];
  const phase: string = data.phase || 'showing';
  const phaseOneLength: number = data.phaseOneLength || 3;
  const communicationLog: { sender: string; message: string }[] = data.communicationLog || [];
  const hintLevel: number = data.hintLevel || 0;
  const revealedPositions: number[] = data.revealedPositions || [];

  const [currentShowIndex, setCurrentShowIndex] = useState(-1);
  const [showComplete, setShowComplete] = useState(false);
  const [relayMessage, setRelayMessage] = useState('');
  const hasStarted = useRef(false);

  // Animate through the sequence one symbol at a time
  useEffect(() => {
    if (phase !== 'showing' || hasStarted.current || sequence.length === 0) return;
    hasStarted.current = true;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < sequence.length) {
        setCurrentShowIndex(idx);
        idx++;
      } else {
        clearInterval(interval);
        setShowComplete(true);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [phase, sequence.length]);

  const handleStartRelay = useCallback(() => {
    console.log('[SFX] start-relay');
    sendPuzzleAction(puzzleId, 'start-relay', {});
  }, [puzzleId, sendPuzzleAction]);

  const handleSendMessage = useCallback(() => {
    if (!relayMessage.trim()) return;
    sendPuzzleAction(puzzleId, 'send-relay-info', { message: relayMessage });
    setRelayMessage('');
  }, [puzzleId, sendPuzzleAction, relayMessage]);

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  // Phase: showing — animate symbols one by one
  if (phase === 'showing') {
    return (
      <div className="seq-view">
        <div className="cipher-role-badge">Watcher</div>
        <p className="cipher-instruction">
          Watch the sequence carefully! Memorize every symbol in order, then relay them to your partner.
        </p>

        <div className="seq-display">
          {sequence.map((item, i) => (
            <div
              key={i}
              className={`seq-symbol-cell ${
                i === currentShowIndex
                  ? 'seq-symbol-active'
                  : i < currentShowIndex
                    ? 'seq-symbol-shown'
                    : 'seq-symbol-hidden'
              } ${i < phaseOneLength ? 'seq-phase-one' : 'seq-phase-two'}`}
            >
              {i <= currentShowIndex ? (
                <span style={{ color: item.color }} className="seq-symbol-char">
                  {item.symbol}
                </span>
              ) : (
                <span className="seq-symbol-placeholder">?</span>
              )}
            </div>
          ))}
        </div>

        <div className="seq-phase-labels">
          <span className="seq-phase-label seq-phase-label-first">Phase 1 (first {phaseOneLength})</span>
          <span className="seq-phase-label seq-phase-label-second">Phase 2 (remaining)</span>
        </div>

        {showComplete && (
          <div className="seq-show-complete">
            <p className="seq-memorize-msg">Sequence shown! Memorize it and click below when ready.</p>
            <button className="cipher-submit-btn" onClick={handleStartRelay}>
              Start Relay
            </button>
          </div>
        )}
      </div>
    );
  }

  // Phase: relay — communicate with partner
  return (
    <div className="seq-view">
      <div className="cipher-role-badge">Watcher</div>
      <p className="cipher-instruction">
        Relay the sequence to your partner! Describe each symbol and its position.
        First share Phase 1 ({sequence.slice(0, phaseOneLength).map(s => s.symbol).join(', ')}),
        then Phase 2 ({sequence.slice(phaseOneLength).map(s => s.symbol).join(', ')}).
      </p>

      <div className="seq-reference">
        <h4 className="split-section-label">Your Sequence (reference)</h4>
        <div className="seq-reference-row">
          {sequence.map((item, i) => (
            <div
              key={i}
              className={`seq-ref-cell ${revealedPositions.includes(i) ? 'seq-ref-revealed' : ''} ${i < phaseOneLength ? 'seq-phase-one' : 'seq-phase-two'}`}
            >
              <span className="seq-ref-pos">{i + 1}</span>
              <span style={{ color: item.color }} className="seq-ref-symbol">{item.symbol}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="seq-comm">
        <h4 className="split-section-label">Communication Log</h4>
        <div className="wire-log-entries">
          {communicationLog.length === 0 && (
            <p className="seq-no-messages">No messages yet. Tell your partner the sequence!</p>
          )}
          {communicationLog.map((entry, i) => (
            <div key={i} className={`wire-log-entry ${entry.sender === 'watcher' ? 'wire-log-self' : 'wire-log-partner'}`}>
              <span className="wire-log-sender">{entry.sender === 'watcher' ? 'You' : 'Partner'}</span>
              <span className="wire-log-msg">{entry.message}</span>
            </div>
          ))}
        </div>

        <div className="seq-input-row">
          <input
            className="seq-chat-input"
            type="text"
            placeholder="Describe the sequence to your partner..."
            value={relayMessage}
            onChange={(e) => setRelayMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <button className="cipher-submit-btn seq-send-btn" onClick={handleSendMessage} disabled={!relayMessage.trim()}>
            Send
          </button>
        </div>
      </div>

      <div className="split-actions">
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 3}>
          {hintLevel >= 3 ? 'All hints used' : `Hint (${hintLevel}/3)`}
        </button>
      </div>
    </div>
  );
}

function RepeaterView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const sequence: { symbol: string; color: string }[] = data.sequence || [];
  const phase: string = data.phase || 'showing';
  const phaseOneLength: number = data.phaseOneLength || 3;
  const playerBSequence: (string | null)[] = data.playerBSequence || new Array(sequence.length).fill(null);
  const communicationLog: { sender: string; message: string }[] = data.communicationLog || [];
  const hintLevel: number = data.hintLevel || 0;
  const revealedPositions: number[] = data.revealedPositions || [];
  const phaseOneSymbols: { symbol: string; color: string }[] = data.phaseOneSymbols || [];

  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const totalLength: number = data.totalLength || sequence.length;

  const handleStartInput = useCallback(() => {
    console.log('[SFX] start-input');
    sendPuzzleAction(puzzleId, 'start-input', {});
  }, [puzzleId, sendPuzzleAction]);

  const handlePlaceSymbol = useCallback(
    (symbol: string) => {
      const firstEmpty = playerBSequence.findIndex((s) => s === null);
      if (firstEmpty === -1) return;
      console.log('[SFX] place-symbol');
      sendPuzzleAction(puzzleId, 'place-symbol', { position: firstEmpty, symbol });
    },
    [puzzleId, sendPuzzleAction, playerBSequence],
  );

  const handleClearSymbol = useCallback(
    (position: number) => {
      sendPuzzleAction(puzzleId, 'clear-symbol', { position });
    },
    [puzzleId, sendPuzzleAction],
  );

  const handleSubmit = useCallback(() => {
    console.log('[SFX] submit-sequence');
    sendPuzzleAction(puzzleId, 'submit-sequence', {});
    setSubmitMessage('Checking...');
    setTimeout(() => setSubmitMessage(null), 2500);
  }, [puzzleId, sendPuzzleAction]);

  const handleHint = useCallback(() => {
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  const filledCount = playerBSequence.filter((s) => s !== null).length;

  // Phase: showing — wait for watcher
  if (phase === 'showing') {
    return (
      <div className="seq-view">
        <div className="cipher-role-badge cipher-role-badge-lock">Repeater</div>
        <p className="cipher-instruction">
          Your partner (the Watcher) is memorizing a sequence of symbols. Wait for them to relay it to you!
        </p>
        <div className="seq-waiting">
          <div className="seq-waiting-icon">👁️</div>
          <p>The Watcher is studying the sequence...</p>
        </div>
      </div>
    );
  }

  // Phase: relay — receive info, can start inputting
  if (phase === 'relay') {
    return (
      <div className="seq-view">
        <div className="cipher-role-badge cipher-role-badge-lock">Repeater</div>
        <p className="cipher-instruction">
          Your partner is relaying the sequence to you. Listen carefully, then enter the symbols!
        </p>

        {phaseOneSymbols.length > 0 && (
          <div className="seq-phase-info">
            <h4 className="split-section-label">Phase 1 Revealed by Partner</h4>
            <div className="seq-phase-one-display">
              {phaseOneSymbols.map((s, i) => (
                <span key={i} className="seq-phase-one-symbol" style={{ color: s.color }}>
                  {s.symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="seq-comm">
          <h4 className="split-section-label">Communication Log</h4>
          <div className="wire-log-entries">
            {communicationLog.length === 0 && (
              <p className="seq-no-messages">Waiting for your partner to describe the sequence...</p>
            )}
            {communicationLog.map((entry, i) => (
              <div key={i} className={`wire-log-entry ${entry.sender === 'repeater' ? 'wire-log-self' : 'wire-log-partner'}`}>
                <span className="wire-log-sender">{entry.sender === 'repeater' ? 'You' : 'Watcher'}</span>
                <span className="wire-log-msg">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="split-actions">
          <button className="cipher-submit-btn" onClick={handleStartInput}>
            Start Entering Sequence
          </button>
        </div>
      </div>
    );
  }

  // Phase: input — repeater enters symbols
  return (
    <div className="seq-view">
      <div className="cipher-role-badge cipher-role-badge-lock">Repeater</div>
      <p className="cipher-instruction">
        Enter the sequence your partner described! Click symbols in the correct order ({totalLength} symbols total).
      </p>

      {/* Sequence slots */}
      <div className="seq-slots">
        <h4 className="split-section-label">Your Sequence ({filledCount}/{totalLength})</h4>
        <div className="seq-slots-row">
          {playerBSequence.map((symbol, i) => {
            const isRevealed = revealedPositions.includes(i);
            const displaySymbol = isRevealed ? sequence[i]?.symbol : symbol;
            const isPhaseOne = i < phaseOneLength;

            return (
              <div
                key={i}
                className={`seq-slot ${symbol ? 'seq-slot-filled' : 'seq-slot-empty'} ${isPhaseOne ? 'seq-phase-one' : 'seq-phase-two'} ${isRevealed ? 'seq-slot-hinted' : ''}`}
                onClick={() => symbol && handleClearSymbol(i)}
                title={symbol ? 'Click to remove' : `Position ${i + 1}`}
              >
                {displaySymbol ? (
                  <span
                    className="seq-slot-symbol"
                    style={{ color: isRevealed ? sequence[i]?.color : undefined }}
                  >
                    {displaySymbol}
                  </span>
                ) : (
                  <span className="seq-slot-number">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Symbol palette */}
      <div className="seq-palette">
        <h4 className="split-section-label">Available Symbols</h4>
        <div className="seq-palette-row">
          {SYMBOL_PALETTE.map((sym) => (
            <button
              key={sym}
              className="seq-palette-btn"
              onClick={() => handlePlaceSymbol(sym)}
              disabled={filledCount >= totalLength}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Communication log */}
      {communicationLog.length > 0 && (
        <div className="seq-comm">
          <h4 className="split-section-label">Communication Log</h4>
          <div className="wire-log-entries">
            {communicationLog.map((entry, i) => (
              <div key={i} className={`wire-log-entry ${entry.sender === 'repeater' ? 'wire-log-self' : 'wire-log-partner'}`}>
                <span className="wire-log-sender">{entry.sender === 'repeater' ? 'You' : 'Watcher'}</span>
                <span className="wire-log-msg">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitMessage && <p className="split-message">{submitMessage}</p>}

      <div className="split-actions">
        <button className="cipher-submit-btn" onClick={handleSubmit} disabled={filledCount < totalLength}>
          Submit Sequence
        </button>
        <button className="cipher-hint-btn" onClick={handleHint} disabled={hintLevel >= 3}>
          {hintLevel >= 3 ? 'All hints used' : `Hint (${hintLevel}/3)`}
        </button>
      </div>
    </div>
  );
}
