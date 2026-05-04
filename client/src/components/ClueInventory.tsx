import { useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { ROOMS } from '../types/index.js';
import type { Clue } from '../stores/gameStore.js';
import { FileText, Lightbulb, CheckCircle, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

const CLUE_TYPE_ICON = {
  clue: FileText,
  hint: Lightbulb,
  solved: CheckCircle,
} as const;

const CLUE_TYPE_COLOR = {
  clue: 'var(--accent-gold)',
  hint: '#00bfff',
  solved: 'var(--accent-teal)',
} as const;

export default function ClueInventory() {
  const { clues, room } = useGameStore();
  const [expandedClueId, setExpandedClueId] = useState<string | null>(null);
  const [filterRoom, setFilterRoom] = useState<number | null>(null);

  const currentRoomIndex = room?.currentRoomIndex ?? 0;

  const filteredClues = filterRoom !== null
    ? clues.filter((c) => c.roomIndex === filterRoom)
    : clues;

  const toggleExpand = (id: string) => {
    setExpandedClueId((prev) => (prev === id ? null : id));
  };

  if (clues.length === 0) {
    return (
      <div className="clue-inventory">
        <div className="clue-inventory-header">
          <span className="clue-inventory-title">Clues</span>
        </div>
        <div className="clue-inventory-empty">
          <FileText size={20} style={{ opacity: 0.3 }} />
          <p>No clues collected yet. Solve puzzles to discover clues.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clue-inventory">
      <div className="clue-inventory-header">
        <span className="clue-inventory-title">Clues ({clues.length})</span>
      </div>
      <div className="clue-inventory-filter">
        <button
          className={`clue-filter-btn ${filterRoom === null ? 'clue-filter-active' : ''}`}
          onClick={() => setFilterRoom(null)}
        >
          All
        </button>
        {ROOMS.map((r, i) => {
          const roomClueCount = clues.filter((c) => c.roomIndex === i).length;
          if (roomClueCount === 0) return null;
          return (
            <button
              key={i}
              className={`clue-filter-btn ${filterRoom === i ? 'clue-filter-active' : ''}`}
              onClick={() => setFilterRoom(i)}
            >
              <MapPin size={10} />
              {r.name.replace('The ', '')}
            </button>
          );
        })}
      </div>
      <div className="clue-inventory-grid">
        {filteredClues.map((clue) => (
          <ClueCard
            key={clue.id}
            clue={clue}
            expanded={expandedClueId === clue.id}
            onToggle={() => toggleExpand(clue.id)}
            isCurrentRoom={clue.roomIndex === currentRoomIndex}
          />
        ))}
      </div>
    </div>
  );
}

function ClueCard({ clue, expanded, onToggle, isCurrentRoom }: {
  clue: Clue;
  expanded: boolean;
  onToggle: () => void;
  isCurrentRoom: boolean;
}) {
  const Icon = CLUE_TYPE_ICON[clue.type];
  const color = CLUE_TYPE_COLOR[clue.type];

  return (
    <div
      className={`clue-card ${expanded ? 'clue-card-expanded' : ''} ${isCurrentRoom ? 'clue-card-current' : ''}`}
      onClick={onToggle}
    >
      <div className="clue-card-header">
        <Icon size={14} style={{ color, flexShrink: 0 }} />
        <span className="clue-card-label">{clue.label}</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </div>
      <div className="clue-card-room-tag" style={{ color }}>
        {clue.roomName}
      </div>
      {expanded && (
        <div className="clue-card-body">
          <p className="clue-card-text">{clue.text}</p>
        </div>
      )}
    </div>
  );
}
