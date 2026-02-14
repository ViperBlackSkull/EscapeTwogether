/**
 * Room 3: The Garden Conservatory Puzzles
 * Theme: Growth & New Beginnings - Dawn, soft diffused light, serene, hopeful, alive
 *
 * An overgrown Victorian conservatory where two botanists fell in love,
 * creating a secret garden of hybrid flowers. Each flower is a message.
 * Bloom the garden to find their final creation - a flower named for their love.
 */

import type { PuzzleDefinition, RoomId } from '$lib/types';

// Import all puzzle modules
export { seedPacketsPuzzle, seedPacketsPuzzle as default } from './seed-packets';
export type {
	SeedPacket,
	PlantingCondition,
	SeedMatch,
	SeedPacketsState
} from './seed-packets';
export {
	createSeedPacketsState,
	selectSeed,
	selectCondition,
	lockSelection,
	attemptMatch,
	getHint as getSeedPacketsHint
} from './seed-packets';

export { waterFlowPuzzle } from './water-flow';
export type {
	Plant,
	Valve,
	WaterFlowState
} from './water-flow';
export {
	createWaterFlowState,
	setValveLevel,
	confirmTemperature,
	getTemperatureFeedback,
	calculateTemperature,
	getHint as getWaterFlowHint
} from './water-flow';

export { lightSpectrumPuzzle } from './light-spectrum';
export type {
	LightColor,
	Prism,
	Flower as LightFlower,
	LightSpectrumState
} from './light-spectrum';
export {
	createLightSpectrumState,
	rotatePrism,
	selectPrism,
	toggleMixMode,
	addToMix,
	getMixedColor,
	directLightToFlower,
	getLightRequirementsChart,
	getHint as getLightSpectrumHint
} from './light-spectrum';

export { hybridizationPuzzle } from './hybridization';
export type {
	ParentPlant,
	Offspring,
	CrossAttempt,
	RoundState,
	HybridizationState
} from './hybridization';
export {
	createHybridizationState,
	startRound,
	endShowPhase,
	selectParent,
	attemptCross,
	getAvailablePlants,
	getTargetOffspringInfo,
	getHint as getHybridizationHint
} from './hybridization';

export { trellisPuzzle } from './trellis';
export type {
	Position,
	TrellisCell,
	VineSegment,
	GrowthInstruction,
	TrellisState
} from './trellis';
export {
	createTrellisState,
	startNewVine,
	growVine,
	confirmVinePath,
	resetCurrentVine,
	getPlayerView,
	getDepthInfo,
	getHint as getTrellisHint
} from './trellis';

export { bloomTimingPuzzle } from './bloom-timing';
export type {
	BloomFlower,
	TouchAttempt,
	BloomTimingState
} from './bloom-timing';
export {
	createBloomTimingState,
	touchFlower,
	getTurnInfo,
	checkCoordinationTimeout,
	resetBloomTiming,
	getFlowersForPlayer,
	getHint as getBloomTimingHint
} from './bloom-timing';

export { finalBloomPuzzle } from './final-bloom';
export type {
	StageType,
	StageState,
	SeedStageState,
	WaterStageState,
	LightStageState,
	PollinateStageState,
	BloomStageState,
	FoundItem,
	FinalBloomState
} from './final-bloom';
export {
	createFinalBloomState,
	selectLoveSeed,
	plantSeed,
	adjustWaterValve,
	confirmWatering,
	rotateLightPrism,
	confirmLighting,
	selectPollinationParent,
	confirmPollination,
	touchBloomPetal,
	getCurrentStageInfo,
	getHint as getFinalBloomHint
} from './final-bloom';

// Room 3 puzzle definitions array
import { seedPacketsPuzzle } from './seed-packets';
import { waterFlowPuzzle } from './water-flow';
import { lightSpectrumPuzzle } from './light-spectrum';
import { hybridizationPuzzle } from './hybridization';
import { trellisPuzzle } from './trellis';
import { bloomTimingPuzzle } from './bloom-timing';
import { finalBloomPuzzle } from './final-bloom';

export const room3Puzzles: PuzzleDefinition[] = [
	seedPacketsPuzzle,
	waterFlowPuzzle,
	lightSpectrumPuzzle,
	hybridizationPuzzle,
	trellisPuzzle,
	bloomTimingPuzzle,
	finalBloomPuzzle
];

// Room 3 metadata
export const ROOM3_ID: RoomId = 'garden_conservatory';
export const ROOM3_NAME = 'The Garden Conservatory';
export const ROOM3_DESCRIPTION = `An overgrown Victorian conservatory where two botanists fell in love,
creating a secret garden of hybrid flowers. Each flower is a message.
Bloom the garden to find their final creation - a flower named for their love.`;

// Room 3 theme colors
export const ROOM3_COLORS = {
	primary: '#90EE90',      // Light green
	secondary: '#FFB6C1',    // Light pink
	accent: '#FFD700',       // Gold (morning sun)
	background: '#F0FFF0',   // Honeydew
	text: '#2F4F4F'          // Dark slate gray
};

// Room 3 theme sounds
export const ROOM3_SOUNDS = {
	ambient: 'rain_on_glass',
	interact: 'water_splash',
	success: 'bloom',
	complete: 'celebration_chimes'
};

export default room3Puzzles;
