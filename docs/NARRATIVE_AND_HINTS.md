# Narrative & Hint System Documentation

## Overview

This document describes the narrative story and progressive hint system implemented in EscapeTwogether. The game features an emotional story about estranged siblings working together to break a family curse, with 3-tier progressive hints for all 18 puzzles.

## Story Theme

### "Estranged Siblings & The Family Curse"

**Premise**: Lily and James, siblings separated by a mysterious family curse 25 years ago, must work together to break the spell binding Blackwood Manor. Their grandmother's love letters to their grandfather hold the key - each puzzle reveals pieces of their story.

**Characters**:
- **Lily**: Sent away as a child, now returned to break the curse
- **James**: Brother who remained at the manor, trapped by the spell
- **Stella & Robert**: Grandparents whose forbidden love created both the curse and its cure
- **Blackwood Manor**: The family estate, frozen in time since the curse took hold

**Story Arc**:
1. **Room 1 (Attic)**: Discovery of family history through photographs and love letters
2. **Room 2 (Clock Tower)**: Understanding the curse's origin at midnight
3. **Room 3 (Garden Conservatory)**: Breaking the curse through cooperation and nurturing new life

## Narrative Structure

### Room Introductions

Each room begins with an atmospheric introduction that sets the scene and advances the story:

**The Attic**: Introduces the siblings, the curse, and the grandmother's trunk
**The Clock Tower**: Reveals the curse's origin and the midnight deadline
**The Garden Conservatory**: Shows the path to breaking the curse through growth and renewal

### Puzzle Completion Narratives

Each puzzle solved reveals a snippet of story, building toward the room's completion:

- **Room 1**: Reveals the grandparents' love story (meeting, wedding, family life)
- **Room 2**: Uncovers grandmother Stella's role as clockmaker and the meaning of "Star"
- **Room 3**: Shows how love and care can bloom even in darkness

### Discovery Moments

Key puzzles trigger special "discovery" narratives that reveal important plot points:

- **Love Letter Cipher**: The wedding date (June 15, 1947)
- **Bell Codes**: Grandmother's name was Stella ("Star")
- **Hybridization**: The Love Lily, symbol of their love

## Hint System

### Three-Tier Progressive Hints

Each of the 18 puzzles has 3 hint tiers that unlock based on failed attempts:

**Tier 1 (2+ attempts)**: Gentle Nudge
- Subtle guidance
- Points player in right direction
- Minimal spoilers

**Tier 2 (4+ attempts)**: Specific Guidance
- More direct help
- Explains mechanics
- Partial solution hints

**Tier 3 (6+ attempts)**: Near-Solution
- Detailed instructions
- Step-by-step guidance
- Nearly complete solution

### Time Penalty System

Each hint used adds a **2-minute penalty** to the completion time:
- 1 hint used: +2 minutes
- 2 hints used: +4 minutes
- 3 hints used: +6 minutes

This encourages players to try solving puzzles independently before requesting hints.

### Hint Availability

- Hints unlock automatically based on failed attempts
- Players can only use each hint tier once per puzzle
- Hint usage is tracked across the entire game session
- Penalty is displayed in the hint modal for transparency

## Implementation

### Key Files

1. **`/src/lib/data/hints.ts`**: All hint content for 18 puzzles
2. **`/src/lib/stores/hintTracking.ts`**: Hint usage tracking and penalty calculation
3. **`/src/lib/components/HintModal.svelte`**: UI for requesting and viewing hints
4. **`/src/lib/components/StoryNarrative.svelte`**: Narrative display with typewriter effect
5. **`/src/lib/utils/narrativeIntegration.ts`**: Utilities for triggering story moments

### Data Structure

```typescript
// Hint structure
interface PuzzleHint {
  tier: number;           // 1, 2, or 3
  text: string;           // The hint text
  triggerAttempts: number; // Attempts required to unlock
}

// Usage tracking
interface HintUsageRecord {
  puzzleId: string;
  tier: number;
  timestamp: number;
  text: string;
  penaltyApplied: boolean;
}
```

### Integration Points

1. **Puzzle Components**: Import hints from `hints.ts` and pass to HintModal
2. **Game Loop**: Track attempts and trigger hint availability
3. **Timer System**: Apply hint penalties to final completion time
4. **Narrative System**: Trigger story moments at key game events

## Puzzle Hint Summary

### Room 1: The Attic (5 puzzles)

1. **Torn Photographs**: Drag pieces, match colors/patterns, complete 3 photos
2. **Music Box**: Gear size = note, arrange largest to smallest
3. **Love Letter Cipher**: Use UV light, find date 6-15-47
4. **Trunk Lock**: Combination is 6-15-47 (wedding date)
5. **Secret Message**: Examine objects, find "clock tower at midnight"

### Room 2: The Clock Tower (6 puzzles)

6. **Pendulum**: Coordinate timing, alternate swing speeds
7. **Gear Alignment**: Align dots in spiral from center
8. **Bell Codes**: Morse code spells "STAR" (Stella)
9. **Clock Face**: Set to midnight (12:00)
10. **Windup Key**: Turn opposite directions simultaneously
11. **Midnight Chime**: Play "Edelweiss" melody

### Room 3: The Garden Conservatory (7 puzzles)

12. **Seed Packets**: Match seeds to bloom times
13. **Water Flow**: Adjust to 72°F (40% cold, 60% hot)
14. **Light Spectrum**: Mix colors for flower needs
15. **Hybridization**: Cross-breed to create Love Lily
16. **Trellis**: Grow vines in heart pattern
17. **Bloom Timing**: Touch flowers simultaneously
18. **Final Bloom**: Complete all stages, touch together

## Usage Examples

### Displaying a Hint

```svelte
<script>
  import { HintModal } from '$lib/components';
  import { PUZZLE_HINTS } from '$lib/data/hints';

  let showHintModal = false;
  let attempts = 3;

  const puzzleId = 'room1-music-box';
  const hints = PUZZLE_HINTS[puzzleId];
</script>

<HintModal
  isOpen={showHintModal}
  puzzleId={puzzleId}
  puzzleName="Music Box"
  hints={hints}
  currentAttempts={attempts}
  hintsRemaining={3}
  on:hintRequested={(e) => {
    console.log(`Used hint tier ${e.detail.tier}`);
  }}
/>
```

### Triggering Narrative

```svelte
<script>
  import { StoryNarrative } from '$lib/components';
  import { getNarrativeForEvent, createNarrativeEvent } from '$lib/utils/narrativeIntegration';

  let showNarrative = false;
  let narrativeText = '';

  function onPuzzleComplete(puzzleId: string) {
    const event = createNarrativeEvent('puzzle_complete', 'attic', puzzleId);
    narrativeText = getNarrativeForEvent(event);
    showNarrative = true;
  }
</script>

<StoryNarrative
  isOpen={showNarrative}
  roomId="attic"
  narrativeType="completion"
  customText={narrativeText}
  on:continue={() => showNarrative = false}
/>
```

### Tracking Hint Penalties

```typescript
import { hintTracking, formatPenalty } from '$lib/stores';

// Use a hint
hintTracking.useHint('room1-music-box', 1);

// Get total penalty
const penalty = hintTracking.getHintPenalty('room1-music-box');
console.log(formatPenalty(penalty)); // "+2 minutes"
```

## Best Practices

1. **Hint Writing**: Keep hints progressive - each tier should be more specific than the last
2. **Narrative Pacing**: Reveal story gradually, not all at once
3. **Penalty Balance**: 2 minutes per hint is significant but not game-breaking
4. **Player Choice**: Allow players to skip hints if they prefer to figure it out
5. **Transparency**: Always show penalty before player accepts hint

## Future Enhancements

Potential improvements to the system:

1. **Adaptive Hints**: Adjust hint threshold based on player performance
2. **Contextual Hints**: Hints that reference specific player actions
3. **Narrative Branches**: Different story paths based on player choices
4. **Hint Personalization**: Tailor hints to player's role (Explorer/Analyst)
5. **Achievement System**: Unlock achievements for completing puzzles without hints

## Testing

To test the hint system:

```bash
# Run the game
npm run dev

# Test hint progression:
# 1. Fail a puzzle twice (Tier 1 hint unlocks)
# 2. Fail four times (Tier 2 hint unlocks)
# 3. Fail six times (Tier 3 hint unlocks)
# 4. Use hints and verify penalty is applied
# 5. Check hint tracking in store
```

To test narrative integration:

```bash
# Navigate through rooms and verify:
# 1. Room intro narratives appear
# 2. Puzzle completion narratives show
# 3. Discovery narratives trigger at key puzzles
# 4. Room completion narratives advance story
# 5. Game completion narrative provides closure
```

## Integration Status

✅ **COMPLETED**: Narrative and hint system has been fully integrated into the game loop.

**Integration Points Implemented:**

1. **GameManager Integration** (`/src/lib/gameManager.ts`):
   - ✅ Room intro narratives triggered on room transitions
   - ✅ Puzzle completion narratives triggered after solving
   - ✅ Room completion narratives before advancing
   - ✅ Game completion narrative on victory
   - ✅ Discovery narratives for plot-critical puzzles

2. **Game Page Integration** (`/src/routes/game/+page.svelte`):
   - ✅ StoryNarrative component connected to narrative manager
   - ✅ Hint system loads puzzle-specific hints
   - ✅ Hint modal integrated with tracking store
   - ✅ Narrative state management

3. **Narrative Manager** (`/src/lib/utils/narrativeManager.ts`):
   - ✅ Centralized narrative trigger system
   - ✅ Integration with GameManager events
   - ✅ Discovery puzzle detection
   - ✅ Narrative history tracking

**How It Works:**

1. When game starts → Room intro narrative displays
2. When puzzle selected → Hints loaded for that puzzle
3. When puzzle solved → Completion narrative displays
4. When room completed → Room completion narrative displays
5. When game won → Final victory narrative displays

**Testing the Integration:**

```bash
# Run the game
npm run dev

# Navigate to the game page and observe:
# 1. Room intro appears when entering each room
# 2. Hints are available for each puzzle
# 3. Completion narratives show after solving puzzles
# 4. Discovery narratives trigger for key puzzles
# 5. Victory narrative displays at game completion
```

The narrative system is now fully operational and integrated into the core gameplay experience!

## Support

For questions or issues with the narrative or hint system, contact the narrative design team or refer to the inline code documentation.
