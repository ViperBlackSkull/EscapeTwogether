import { describe, it, expect } from 'vitest';
import {
	createSeedPacketsState,
	selectSeed,
	selectCondition,
	lockSelection,
	attemptMatch,
	getHint,
	seedPacketsPuzzle,
	checkMatchCorrect
} from '$lib/puzzles/room3/seed-packets';
import type { SeedPacketsState, SeedMatch } from '$lib/puzzles/room3/seed-packets';

describe('Seed Packets Puzzle', () => {
	describe('createSeedPacketsState', () => {
		it('should create initial state with 5 seeds and 5 conditions', () => {
			const state = createSeedPacketsState();

			expect(state.data.seeds).toHaveLength(5);
			expect(state.data.conditions).toHaveLength(5);
			expect(state.data.matches).toHaveLength(0);
			expect(state.solved).toBe(false);
			expect(state.attempts).toBe(0);
		});

		it('should have no selections initially', () => {
			const state = createSeedPacketsState();

			expect(state.data.selectedSeed).toBeNull();
			expect(state.data.selectedCondition).toBeNull();
			expect(state.data.lockedSelection.seedId).toBeNull();
			expect(state.data.lockedSelection.conditionId).toBeNull();
		});
	});

	describe('selectSeed', () => {
		it('should select a seed', () => {
			let state = createSeedPacketsState();
			const seedId = state.data.seeds[0].id;

			state = selectSeed(state, seedId);

			expect(state.data.selectedSeed).toBe(seedId);
		});

		it('should deselect a seed when selected again', () => {
			let state = createSeedPacketsState();
			const seedId = state.data.seeds[0].id;

			state = selectSeed(state, seedId);
			state = selectSeed(state, seedId);

			expect(state.data.selectedSeed).toBeNull();
		});

		it('should not select already matched seeds', () => {
			let state = createSeedPacketsState();

			// Use a known correct match (moonflower -> twilight bed)
			const moonflower = state.data.seeds.find(s => s.id === 'seed_moonflower')!;
			const twilightBed = state.data.conditions.find(c => c.id === 'condition_twilight_bed')!;

			// Make a match first
			state = selectSeed(state, moonflower.id);
			state = selectCondition(state, twilightBed.id);
			state = lockSelection(state);
			const result = attemptMatch(state);

			// Verify match was successful
			expect(result.correct).toBe(true);

			// Try to select the matched seed
			const newState = selectSeed(result.state, moonflower.id);

			expect(newState.data.selectedSeed).toBeNull();
		});
	});

	describe('selectCondition', () => {
		it('should select a condition', () => {
			let state = createSeedPacketsState();
			const conditionId = state.data.conditions[0].id;

			state = selectCondition(state, conditionId);

			expect(state.data.selectedCondition).toBe(conditionId);
		});

		it('should deselect a condition when selected again', () => {
			let state = createSeedPacketsState();
			const conditionId = state.data.conditions[0].id;

			state = selectCondition(state, conditionId);
			state = selectCondition(state, conditionId);

			expect(state.data.selectedCondition).toBeNull();
		});
	});

	describe('lockSelection', () => {
		it('should lock both selections', () => {
			let state = createSeedPacketsState();
			const seedId = state.data.seeds[0].id;
			const conditionId = state.data.conditions[0].id;

			state = selectSeed(state, seedId);
			state = selectCondition(state, conditionId);
			state = lockSelection(state);

			expect(state.data.lockedSelection.seedId).toBe(seedId);
			expect(state.data.lockedSelection.conditionId).toBe(conditionId);
		});

		it('should not lock without both selections', () => {
			let state = createSeedPacketsState();
			const seedId = state.data.seeds[0].id;

			state = selectSeed(state, seedId);
			state = lockSelection(state);

			expect(state.data.lockedSelection.seedId).toBeNull();
			expect(state.data.lockedSelection.conditionId).toBeNull();
		});
	});

	describe('attemptMatch', () => {
		it('should fail without locked selections', () => {
			const state = createSeedPacketsState();

			const result = attemptMatch(state);

			expect(result.correct).toBe(false);
			expect(result.message).toContain('Both players must make a selection');
		});

		it('should correctly match moonflower to twilight bed', () => {
			let state = createSeedPacketsState();

			// Find the moonflower seed and twilight bed condition
			const moonflowerSeed = state.data.seeds.find(s => s.id === 'seed_moonflower')!;
			const twilightBed = state.data.conditions.find(c => c.id === 'condition_twilight_bed')!;

			state = selectSeed(state, moonflowerSeed.id);
			state = selectCondition(state, twilightBed.id);
			state = lockSelection(state);

			const result = attemptMatch(state);

			expect(result.correct).toBe(true);
			expect(result.state.data.matches).toHaveLength(1);
		});

		it('should increment attempts on each match attempt', () => {
			let state = createSeedPacketsState();
			const seedId = state.data.seeds[0].id;
			const conditionId = state.data.conditions[0].id;

			state = selectSeed(state, seedId);
			state = selectCondition(state, conditionId);
			state = lockSelection(state);

			const result = attemptMatch(state);

			expect(result.state.attempts).toBe(1);
		});

		it('should not add incorrect matches to matches array', () => {
			let state = createSeedPacketsState();

			// Try wrong match
			const wrongSeed = state.data.seeds.find(s => s.id === 'seed_moonflower')!;
			const wrongCondition = state.data.conditions.find(c => c.id === 'condition_sunny_rock')!;

			state = selectSeed(state, wrongSeed.id);
			state = selectCondition(state, wrongCondition.id);
			state = lockSelection(state);

			const result = attemptMatch(state);

			expect(result.correct).toBe(false);
			expect(result.state.data.matches).toHaveLength(0);
		});
	});

	describe('checkMatchCorrect', () => {
		it('should return true for correct matches', () => {
			const state = createSeedPacketsState();
			const correctMatch: SeedMatch = {
				seedId: 'seed_moonflower',
				conditionId: 'condition_twilight_bed'
			};

			expect(checkMatchCorrect(state, correctMatch)).toBe(true);
		});

		it('should return false for incorrect matches', () => {
			const state = createSeedPacketsState();
			const incorrectMatch: SeedMatch = {
				seedId: 'seed_moonflower',
				conditionId: 'condition_sunny_rock'
			};

			expect(checkMatchCorrect(state, incorrectMatch)).toBe(false);
		});
	});

	describe('getHint', () => {
		it('should return null when attempts are below threshold', () => {
			const state = createSeedPacketsState();

			expect(getHint(state)).toBeNull();
		});

		it('should return tier 1 hint after 3 attempts', () => {
			let state = createSeedPacketsState();
			state = { ...state, attempts: 3 };

			const hint = getHint(state);

			expect(hint).not.toBeNull();
			expect(hint?.tier).toBe(1);
		});
	});

	describe('seedPacketsPuzzle definition', () => {
		it('should have correct puzzle ID', () => {
			expect(seedPacketsPuzzle.id).toBe('room3_seed_packets');
		});

		it('should be in garden_conservatory room', () => {
			expect(seedPacketsPuzzle.roomId).toBe('garden_conservatory');
		});

		it('should require both roles', () => {
			expect(seedPacketsPuzzle.requiredRoles).toContain('explorer');
			expect(seedPacketsPuzzle.requiredRoles).toContain('analyst');
		});

		it('should have 3 hint tiers', () => {
			expect(seedPacketsPuzzle.hints).toHaveLength(3);
		});
	});

	describe('full puzzle completion', () => {
		it('should solve puzzle when all 5 correct matches are made', () => {
			let state = createSeedPacketsState();

			const correctMatches: SeedMatch[] = [
				{ seedId: 'seed_moonflower', conditionId: 'condition_twilight_bed' },
				{ seedId: 'seed_sunburst', conditionId: 'condition_sunny_rock' },
				{ seedId: 'seed_shade_fern', conditionId: 'condition_shady_moss' },
				{ seedId: 'seed_desert_rose', conditionId: 'condition_dappled_grove' },
				{ seedId: 'seed_water_lily', conditionId: 'condition_pond_edge' }
			];

			for (const match of correctMatches) {
				state = selectSeed(state, match.seedId);
				state = selectCondition(state, match.conditionId);
				state = lockSelection(state);
				const result = attemptMatch(state);
				state = result.state;
			}

			expect(state.solved).toBe(true);
			expect(state.data.matches).toHaveLength(5);
		});
	});
});
