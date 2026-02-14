import { describe, it, expect } from 'vitest';
import {
	createBloomTimingState,
	touchFlower,
	getTurnInfo,
	resetBloomTiming,
	getFlowersForPlayer,
	getHint,
	bloomTimingPuzzle
} from '$lib/puzzles/room3/bloom-timing';

describe('Bloom Timing Puzzle', () => {
	describe('createBloomTimingState', () => {
		it('should create initial state with 8 flowers', () => {
			const state = createBloomTimingState();

			expect(state.data.flowers).toHaveLength(8);
			expect(state.solved).toBe(false);
		});

		it('should start with explorer as expected player', () => {
			const state = createBloomTimingState();

			expect(state.data.expectedPlayer).toBe('explorer');
		});

		it('should start at position 1', () => {
			const state = createBloomTimingState();

			expect(state.data.expectedPosition).toBe(1);
		});

		it('should have all flowers untouched', () => {
			const state = createBloomTimingState();

			expect(state.data.flowers.every(f => !f.touched)).toBe(true);
		});
	});

	describe('touchFlower', () => {
		it('should succeed when correct player touches correct flower', () => {
			const state = createBloomTimingState();

			// Position 1 is Rose, explorer should touch it
			const result = touchFlower(state, 'flower_rose', 'explorer');

			expect(result.success).toBe(true);
			expect(result.state.data.correctCount).toBe(1);
		});

		it('should fail when wrong player touches', () => {
			const state = createBloomTimingState();

			// Position 1 should be explorer, not analyst
			const result = touchFlower(state, 'flower_rose', 'analyst');

			expect(result.success).toBe(false);
			expect(result.message).toContain('Not your turn');
		});

		it('should fail when wrong flower touched', () => {
			const state = createBloomTimingState();

			// Position 1 is Rose, not Lily
			const result = touchFlower(state, 'flower_lily', 'explorer');

			expect(result.success).toBe(false);
			expect(result.message).toContain('Wrong flower');
		});

		it('should alternate players after each correct touch', () => {
			let state = createBloomTimingState();

			// Touch 1: Explorer touches Rose (position 1)
			state = touchFlower(state, 'flower_rose', 'explorer').state;
			expect(state.data.expectedPlayer).toBe('analyst');

			// Touch 2: Analyst touches Lily (position 2)
			state = touchFlower(state, 'flower_lily', 'analyst').state;
			expect(state.data.expectedPlayer).toBe('explorer');
		});

		it('should increment position after correct touch', () => {
			let state = createBloomTimingState();

			state = touchFlower(state, 'flower_rose', 'explorer').state;

			expect(state.data.expectedPosition).toBe(2);
		});

		it('should fail when touching already touched flower', () => {
			let state = createBloomTimingState();

			state = touchFlower(state, 'flower_rose', 'explorer').state;
			const result = touchFlower(state, 'flower_rose', 'analyst');

			expect(result.success).toBe(false);
			expect(result.message).toContain('already bloomed');
		});

		it('should increment wrong attempts on failure', () => {
			const state = createBloomTimingState();

			const result = touchFlower(state, 'flower_lily', 'explorer');

			expect(result.state.data.wrongFlowerAttempts).toBe(1);
		});
	});

	describe('getTurnInfo', () => {
		it('should return current turn info', () => {
			const state = createBloomTimingState();
			const info = getTurnInfo(state);

			expect(info.expectedPlayer).toBe('explorer');
			expect(info.expectedPosition).toBe(1);
			expect(info.progress).toBe('0/8 flowers bloomed');
		});

		it('should update after touches', () => {
			let state = createBloomTimingState();
			state = touchFlower(state, 'flower_rose', 'explorer').state;

			const info = getTurnInfo(state);

			expect(info.expectedPlayer).toBe('analyst');
			expect(info.expectedPosition).toBe(2);
			expect(info.progress).toBe('1/8 flowers bloomed');
		});
	});

	describe('resetBloomTiming', () => {
		it('should reset all state to initial', () => {
			let state = createBloomTimingState();
			state = touchFlower(state, 'flower_rose', 'explorer').state;
			state = touchFlower(state, 'flower_lily', 'analyst').state;

			state = resetBloomTiming(state);

			expect(state.data.correctCount).toBe(0);
			expect(state.data.expectedPlayer).toBe('explorer');
			expect(state.data.expectedPosition).toBe(1);
			expect(state.data.flowers.every(f => !f.touched)).toBe(true);
		});
	});

	describe('getFlowersForPlayer', () => {
		it('should return all flowers with next indicator', () => {
			const state = createBloomTimingState();
			const flowers = getFlowersForPlayer(state, 'explorer');

			expect(flowers).toHaveLength(8);
			const nextFlower = flowers.find(f => f.isNext);
			expect(nextFlower?.position).toBe(1);
		});
	});

	describe('getHint', () => {
		it('should return null when attempts are below threshold', () => {
			const state = createBloomTimingState();

			expect(getHint(state)).toBeNull();
		});

		it('should return tier 1 hint after 3 attempts', () => {
			let state = createBloomTimingState();
			state = { ...state, attempts: 3 };

			const hint = getHint(state);

			expect(hint).not.toBeNull();
			expect(hint?.tier).toBe(1);
		});

		it('should reveal pattern after 4 correct touches', () => {
			let state = createBloomTimingState();
			state = touchFlower(state, 'flower_rose', 'explorer').state;
			state = touchFlower(state, 'flower_lily', 'analyst').state;
			state = touchFlower(state, 'flower_tulip', 'explorer').state;
			state = touchFlower(state, 'flower_daisy', 'analyst').state;

			const hint = getHint(state);

			expect(hint).not.toBeNull();
			expect(hint?.text).toContain('ALTERNATE');
		});
	});

	describe('full puzzle completion', () => {
		it('should solve puzzle when all 8 flowers touched in correct order', () => {
			let state = createBloomTimingState();

			// Complete the full sequence: A-B-A-B-A-B-A-B
			state = touchFlower(state, 'flower_rose', 'explorer').state;      // 1: Explorer
			state = touchFlower(state, 'flower_lily', 'analyst').state;       // 2: Analyst
			state = touchFlower(state, 'flower_tulip', 'explorer').state;     // 3: Explorer
			state = touchFlower(state, 'flower_daisy', 'analyst').state;      // 4: Analyst
			state = touchFlower(state, 'flower_orchid', 'explorer').state;    // 5: Explorer
			state = touchFlower(state, 'flower_violet', 'analyst').state;     // 6: Analyst
			state = touchFlower(state, 'flower_sunflower', 'explorer').state; // 7: Explorer
			const result = touchFlower(state, 'flower_iris', 'analyst');      // 8: Analyst

			expect(result.puzzleComplete).toBe(true);
			expect(result.state.solved).toBe(true);
			expect(result.state.data.correctCount).toBe(8);
		});
	});

	describe('bloomTimingPuzzle definition', () => {
		it('should have correct puzzle ID', () => {
			expect(bloomTimingPuzzle.id).toBe('room3_bloom_timing');
		});

		it('should be in garden_conservatory room', () => {
			expect(bloomTimingPuzzle.roomId).toBe('garden_conservatory');
		});

		it('should have 3 hint tiers', () => {
			expect(bloomTimingPuzzle.hints).toHaveLength(3);
		});
	});
});
