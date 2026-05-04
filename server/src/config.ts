export const GAME_CONFIG = {
  maxPlayersPerRoom: 2,
  hintCooldownMs: 10_000,
  maxHints: 4,
  roomCodeLength: 4,
  roomCodeChars: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
} as const;

export const PUZZLE_CONFIG = {
  'cipher-lock': {
    name: 'Cipher Lock',
    codeLength: 4,
    hintLevels: 4,
  },
} as const;
