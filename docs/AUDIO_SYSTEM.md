# Audio System Documentation

## Overview

The EscapeTwogether audio system provides a comprehensive, Web Audio API-based sound engine with:

- **Procedurally generated audio** - No external audio files needed
- **Room-specific ambient soundscapes** - Unique atmosphere for each room
- **Dynamic music system** - Exploration, tension, victory, and defeat tracks
- **Rich SFX library** - UI, puzzle, multiplayer, and game state sounds
- **Complete volume control** - Master, music, SFX, and ambience channels
- **Smooth audio transitions** - Fade in/out for music and ambience

## Architecture

### Core Components

1. **Audio Manager** (`src/lib/audio.ts`)
   - Main audio engine using Web Audio API
   - Sound generation and playback
   - Volume control and muting
   - Music and ambience management

2. **Audio Helpers** (`src/lib/audioHelpers.ts`)
   - Convenience functions for common audio operations
   - Puzzle event handlers
   - UI audio hooks
   - Multiplayer audio feedback

3. **Game Audio Controller** (`src/lib/gameAudio.ts`)
   - Game state integration
   - Room-specific audio management
   - Music flow control
   - Event-driven audio triggers

4. **Audio Settings Component** (`src/lib/components/AudioSettings.svelte`)
   - User-facing volume controls
   - Mute functionality
   - Audio testing buttons
   - Real-time volume adjustment

## Audio Assets

### Sound Effects (SFX)

#### UI Sounds
- `button-click` - Short click for button interactions
- `button-hover` - Subtle hover feedback
- `notification` - Two-tone notification sound

#### Puzzle Sounds
- `puzzle-solved` - Ascending arpeggio celebration
- `puzzle-attempt` - Gentle attempt confirmation
- `puzzle-error` - Descending error tone
- `puzzle-hint` - Sparkly hint reveal

#### Room Sounds
- `room-transition` - Whoosh transition effect
- `door-open` - Creaking door sound
- `door-locked` - Locked door clank

#### Item Sounds
- `item-pickup` - Item collection jingle
- `item-use` - Item activation sound

#### Multiplayer Sounds
- `player-join` - Welcome chime for new players
- `player-leave` - Departure sound
- `message-send` - Outgoing message blip
- `message-receive` - Incoming message ping

#### Game State Sounds
- `victory` - Victory fanfare
- `defeat` - Somber defeat music

### Ambient Soundscapes

#### Attic Ambient (`ambient-attic`)
- Wind howling through rafters
- Occasional creaking sounds
- Distant whistling
- Mysterious atmosphere
- Duration: 10 seconds (looped)

#### Clock Tower Ambient (`ambient-clock-tower`)
- Constant ticking rhythm
- Grinding gears
- Low mechanical rumble
- Swinging pendulum (stereo panned)
- Duration: 8 seconds (looped)

#### Garden Ambient (`ambient-garden`)
- Bird chirps (random intervals)
- Leaves rustling
- Wind through branches
- Gentle water trickle
- Atmospheric pad
- Duration: 12 seconds (looped)

#### Main Menu Ambient (`ambient-main-menu`)
- Mystery drone
- Ethereal pads
- Occasional chimes
- Subtle movement
- Duration: 15 seconds (looped)

### Music Tracks

#### Exploration Music (`music-exploration`)
- Mystery-themed ambient music
- Gentle chord progressions
- Subtle melody
- Soft arpeggios
- Duration: 16 seconds (looped)

#### Tension Music (`music-tension`)
- Dissonant intervals
- Pulsing tension
- Rhythmic ticking
- Eerie high frequencies
- Low rumble
- Duration: 8 seconds (looped)

#### Victory Music (`music-victory`)
- Triumphant fanfare
- Major key melody
- Celebration arpeggios
- Duration: 6 seconds (one-shot)

#### Game Over Music (`music-game-over`)
- Descending sad melody
- Minor chord progression
- Tension dissipation
- Duration: 5 seconds (one-shot)

## Usage

### Basic Audio Playback

```typescript
import { soundManager } from '$lib/audio';

// Play a sound effect
soundManager.play('button-click');
soundManager.play('puzzle-solved');
soundManager.play('door-open');

// Play with custom volume
soundManager.play('notification', { volume: 0.5 });

// Play with rate adjustment
soundManager.play('button-click', { rate: 1.5 });
```

### Convenience Methods

```typescript
import { soundManager } from '$lib/audio';

// UI interactions
soundManager.playClick();
soundManager.playHover();
soundManager.playNotification();

// Puzzle feedback
soundManager.playPuzzleSolved();
soundManager.playPuzzleError();
soundManager.playPuzzleHint();

// Multiplayer
soundManager.playPlayerJoin();
soundManager.playPlayerLeave();
soundManager.playMessageSend();
soundManager.playMessageReceive();

// Game state
soundManager.playVictory();
soundManager.playDefeat();
```

### Music Control

```typescript
import { soundManager } from '$lib/audio';

// Play background music with fade in
soundManager.playMusic('music-exploration', 2.0); // 2 second fade
soundManager.playMusic('music-tension', 1.0);

// Stop music with fade out
soundManager.stopMusic(1.0); // 1 second fade

// Adjust music volume
soundManager.setMusicVolume(0.8);
```

### Ambient Sounds

```typescript
import { soundManager } from '$lib/audio';

// Play room ambience
soundManager.playAmbient('ambient-attic', 3.0); // 3 second fade
soundManager.playAmbient('ambient-clock-tower', 2.0);
soundManager.playAmbient('ambient-garden', 3.0);

// Stop ambience
soundManager.stopAmbient(2.0);

// Adjust ambience volume
soundManager.setAmbientVolume(0.6);
```

### Room System

```typescript
import { soundManager } from '$lib/audio';

// Set current room (plays appropriate ambience)
soundManager.setRoom('attic');
soundManager.setRoom('clock-tower');
soundManager.setRoom('garden');

// Smooth room transition
soundManager.transitionToRoom('clock-tower');
```

### Volume Control

```typescript
import { soundManager } from '$lib/audio';

// Master volume
soundManager.setMasterVolume(0.8);

// Individual channels
soundManager.setMusicVolume(0.6);
soundManager.setSfxVolume(0.8);
soundManager.setAmbientVolume(0.5);

// Mute/unmute
soundManager.setMuted(true);
soundManager.toggleMute();
```

### Game Audio Controller

```typescript
import { gameAudio } from '$lib/gameAudio';

// Initialize
await gameAudio.initialize();

// Room management
gameAudio.enterRoom('attic');
gameAudio.exitRoom('attic');

// Music control
gameAudio.startExplorationMusic();
gameAudio.startTensionMusic();
gameAudio.stopBackgroundMusic();

// Puzzle feedback
gameAudio.onPuzzleAttempt();
gameAudio.onPuzzleSolved();
gameAudio.onPuzzleError();
gameAudio.onPuzzleHint();

// Game state
gameAudio.onGameStart();
gameAudio.onGameEnd(true); // victory
gameAudio.onGameEnd(false); // defeat
gameAudio.onPlayerJoin();
gameAudio.onPlayerLeave();

// UI feedback
gameAudio.onButtonClick();
gameAudio.onButtonHover();
gameAudio.onNotification();

// Items
gameAudio.onItemPickup();
gameAudio.onItemUse();
gameAudio.onDoorOpen();
gameAudio.onDoorLocked();

// Multiplayer
gameAudio.onMessageSent();
gameAudio.onMessageReceived();

// Volume control
gameAudio.setMasterVolume(0.8);
gameAudio.toggleMute();

// State queries
const state = gameAudio.getState();
const inAttic = gameAudio.isInRoom('attic');
const musicPlaying = gameAudio.isMusicPlaying();
```

### Audio Helper Functions

```typescript
import {
	handlePuzzleEvent,
	handleRoomChange,
	createUIAudioHooks,
	createPuzzleAudioHooks,
	createMultiplayerAudioHooks
} from '$lib/audioHelpers';

// Handle puzzle events
handlePuzzleEvent('solved');
handlePuzzleEvent('attempt');
handlePuzzleEvent('error');
handlePuzzleEvent('hint');

// Handle room changes
handleRoomChange('attic', true); // with transition
handleRoomChange('clock-tower', false); // direct change

// Create audio hooks for components
const uiHooks = createUIAudioHooks();
uiHooks.onClick(); // plays button click
uiHooks.onHover(); // plays button hover

const puzzleHooks = createPuzzleAudioHooks();
puzzleHooks.onSolved(); // plays puzzle solved
puzzleHooks.onError(); // plays puzzle error

const multiplayerHooks = createMultiplayerAudioHooks();
multiplayerHooks.onPlayerJoin(); // plays player joined
multiplayerHooks.onMessageReceive(); // plays message received
```

## Component Integration

### Using Audio Settings Component

```svelte
<script>
	import AudioSettings from '$lib/components/AudioSettings.svelte';
</script>

<AudioSettings />
```

The AudioSettings component provides:
- Master mute/unmute toggle
- Individual volume sliders for master, music, SFX, and ambience
- Test buttons for each audio channel
- Real-time volume level display
- Compact, collapsible interface

### Integration in Game Pages

```svelte
<script>
	import { onMount } from 'svelte';
	import { soundManager } from '$lib/audio';
	import { gameAudio } from '$lib/gameAudio';

	onMount(async () => {
		// Initialize audio system
		await gameAudio.initialize();

		// Start game audio
		gameAudio.onGameStart();

		return () => {
			// Cleanup
			gameAudio.cleanup();
		};
	});
</script>

<!-- Puzzle interaction -->
<button on:click={() => gameAudio.onPuzzleAttempt()}>
	Try Solution
</button>

<!-- Room transition -->
<button on:click={() => gameAudio.enterRoom('clock-tower')}>
	Next Room
</button>
```

## Audio System Features

### Procedural Audio Generation

All audio is generated procedurally using the Web Audio API, providing:

- **No external dependencies** - No audio files to load or manage
- **Small bundle size** - Audio generation code is lightweight
- **Instant playback** - No loading delays
- **Consistent quality** - Controlled audio characteristics
- **Easy modification** - Adjust parameters in code

### Volume Channels

The audio system supports four independent volume channels:

1. **Master Volume** - Overall volume control
2. **Music Volume** - Background music
3. **SFX Volume** - Sound effects
4. **Ambience Volume** - Room ambient sounds

### Smooth Transitions

- Music and ambience fade in/out over configurable durations
- Room transitions include crossfading ambient sounds
- Volume changes are smoothed to prevent abrupt changes

### Room-Specific Audio

Each room has a unique ambient soundscape:

- **Attic**: Wind, creaks, mysterious atmosphere
- **Clock Tower**: Ticking, gears, mechanical sounds
- **Garden**: Birds, leaves, water, nature sounds

### Game State Awareness

The audio system responds to game state changes:

- Play appropriate music for current situation
- Adjust audio based on puzzle progress
- Provide feedback for multiplayer events
- Celebrate victories and acknowledge defeats

## Best Practices

### Initialization

Always initialize the audio system on first user interaction:

```typescript
// In onMount or first click handler
await soundManager.init();
```

### Volume Balance

Recommended default volumes:

- Master: 70% (0.7)
- Music: 60% (0.6)
- SFX: 80% (0.8)
- Ambience: 50% (0.5)

### Fade Durations

Use appropriate fade durations:

- Music fade in: 2-3 seconds
- Music fade out: 1-2 seconds
- Ambience fade in: 2-3 seconds
- Ambience fade out: 2 seconds
- Room transition: 0.5 seconds

### Performance

The audio system is designed for performance:

- All audio is pre-generated on initialization
- Minimal CPU usage during playback
- Efficient memory usage
- No runtime audio processing overhead

## Browser Compatibility

The audio system uses the Web Audio API, supported in:

- Chrome/Edge 14+
- Firefox 23+
- Safari 6+
- Opera 15+

Mobile browsers are fully supported with proper initialization on user interaction.

## Future Enhancements

Potential improvements to the audio system:

1. **External Audio Support**
   - Option to use external audio files
   - Fallback to procedural generation
   - Asset loading system

2. **Advanced Effects**
   - Reverb and echo
   - 3D spatial audio
   - Dynamic EQ based on game state

3. **Audio Profiling**
   - Volume presets (quiet, normal, loud)
   - Hearing accessibility modes
   - Color-blind audio alternatives

4. **Performance Monitoring**
   - Audio performance metrics
   - Memory usage tracking
   - Debug mode for audio issues

## Troubleshooting

### Audio Not Playing

1. Ensure audio context is initialized on user interaction
2. Check if audio is muted
3. Verify volume levels are > 0
4. Check browser console for errors

### Audio Context Suspended

Browsers suspend audio context until user interaction:

```typescript
// Resume audio context
if (audioContext.state === 'suspended') {
	audioContext.resume();
}
```

### Volume Not Changing

Ensure volume changes are within valid range (0-1):

```typescript
soundManager.setMasterVolume(Math.max(0, Math.min(1, volume)));
```

## Credits

Audio System Design & Implementation
- Procedural audio generation using Web Audio API
- Room-specific ambient soundscapes
- Dynamic music system
- Complete SFX library
- Volume control system

Generated with Claude Code - AI-powered audio engineering
