import { X } from 'lucide-react';

const HOW_TO_PLAY_SEEN_KEY = 'escapetwogether-how-to-play-seen';

const steps = [
  {
    num: 1,
    title: 'Create or Join a Room',
    desc: 'One player creates a room and shares the 4-character code. The other joins using that code.',
    icon: '🏠',
  },
  {
    num: 2,
    title: 'Share the Room Code',
    desc: 'Send the room code to your partner through your favorite messaging app.',
    icon: '📨',
  },
  {
    num: 3,
    title: 'Communicate!',
    desc: 'You each see different clues — you MUST talk to each other to solve the puzzles.',
    icon: '💬',
  },
  {
    num: 4,
    title: 'Solve Puzzles Together',
    desc: 'Combine what you both see to crack codes, wire circuits, navigate maps, and more.',
    icon: '🧩',
  },
  {
    num: 5,
    title: 'Escape Together',
    desc: 'Clear all 5 rooms before time runs out to win. Your teamwork determines your rank!',
    icon: '🏆',
  },
];

export function hasSeenHowToPlay(): boolean {
  return localStorage.getItem(HOW_TO_PLAY_SEEN_KEY) === 'true';
}

export function markHowToPlaySeen(): void {
  localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, 'true');
}

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

export default function HowToPlay({ open, onClose }: HowToPlayProps) {
  if (!open) return null;

  return (
    <div className="how-to-play-overlay" onClick={onClose}>
      <div className="how-to-play-modal" onClick={(e) => e.stopPropagation()}>
        <button className="how-to-play-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2 className="how-to-play-title">How to Play</h2>
        <p className="how-to-play-subtitle">
          A cooperative escape room for two players on separate screens
        </p>

        <div className="how-to-play-steps">
          {steps.map((step) => (
            <div key={step.num} className="how-to-play-step">
              <div className="how-to-play-step-num">{step.num}</div>
              <div className="how-to-play-step-icon">{step.icon}</div>
              <div className="how-to-play-step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary how-to-play-start" onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  );
}
