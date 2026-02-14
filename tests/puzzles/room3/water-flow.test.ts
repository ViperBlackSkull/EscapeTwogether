import { describe, it, expect } from 'vitest';
import {
	createWaterFlowState,
	setValveLevel,
	confirmTemperature,
	getTemperatureFeedback,
	calculateTemperature,
	getHint,
	waterFlowPuzzle
} from '$lib/puzzles/room3/water-flow';

describe('Water Flow Puzzle', () => {
	describe('createWaterFlowState', () => {
		it('should create initial state with 4 plants', () => {
			const state = createWaterFlowState();

			expect(state.data.plants).toHaveLength(4);
			expect(state.solved).toBe(false);
			expect(state.attempts).toBe(0);
		});

		it('should have valves at level 0 initially', () => {
			const state = createWaterFlowState();

			expect(state.data.hotValve.level).toBe(0);
			expect(state.data.coldValve.level).toBe(0);
		});

		it('should start with first plant active', () => {
			const state = createWaterFlowState();

			expect(state.data.activePlantIndex).toBe(0);
			expect(state.data.completedPlants).toHaveLength(0);
		});
	});

	describe('calculateTemperature', () => {
		it('should return 50 for no flow', () => {
			expect(calculateTemperature(0, 0)).toBe(50);
		});

		it('should return 100 for full hot', () => {
			expect(calculateTemperature(100, 0)).toBe(100);
		});

		it('should return 0 for full cold', () => {
			expect(calculateTemperature(0, 100)).toBe(0);
		});

		it('should return 50 for equal hot and cold', () => {
			expect(calculateTemperature(50, 50)).toBe(50);
		});

		it('should calculate higher temp for more hot', () => {
			const temp1 = calculateTemperature(70, 0);
			const temp2 = calculateTemperature(80, 0);
			expect(temp2).toBeGreaterThan(temp1);
		});
	});

	describe('setValveLevel', () => {
		it('should set hot valve level', () => {
			let state = createWaterFlowState();

			state = setValveLevel(state, 'hot', 50);

			expect(state.data.hotValve.level).toBe(50);
		});

		it('should set cold valve level', () => {
			let state = createWaterFlowState();

			state = setValveLevel(state, 'cold', 75);

			expect(state.data.coldValve.level).toBe(75);
		});

		it('should clamp levels between 0 and 100', () => {
			let state = createWaterFlowState();

			state = setValveLevel(state, 'hot', 150);
			expect(state.data.hotValve.level).toBe(100);

			state = setValveLevel(state, 'cold', -50);
			expect(state.data.coldValve.level).toBe(0);
		});

		it('should update current temperature for active plant', () => {
			let state = createWaterFlowState();

			state = setValveLevel(state, 'hot', 80);

			expect(state.data.plants[0].currentTemp).toBeGreaterThan(50);
		});

		it('should record adjustment in history', () => {
			let state = createWaterFlowState();

			state = setValveLevel(state, 'hot', 50);

			expect(state.data.adjustmentHistory).toHaveLength(1);
			expect(state.data.adjustmentHistory[0].hotLevel).toBe(50);
		});
	});

	describe('getTemperatureFeedback', () => {
		it('should return too_cold when below minimum', () => {
			let state = createWaterFlowState();
			// Tropical Orchid needs 75-90
			state = setValveLevel(state, 'cold', 80);
			state = setValveLevel(state, 'hot', 0);

			const feedback = getTemperatureFeedback(state);

			expect(feedback.status).toBe('too_cold');
		});

		it('should return too_hot when above maximum', () => {
			let state = createWaterFlowState();
			// Tropical Orchid needs 75-90, hot=100 gives temp=100
			state = setValveLevel(state, 'hot', 100);

			const feedback = getTemperatureFeedback(state);

			expect(feedback.status).toBe('too_hot');
		});

		it('should return acceptable when within range', () => {
			let state = createWaterFlowState();
			// Tropical Orchid needs 75-90, hot=70 gives temp=85
			state = setValveLevel(state, 'hot', 70);

			const feedback = getTemperatureFeedback(state);

			expect(['acceptable', 'perfect']).toContain(feedback.status);
		});

		it('should return perfect when near optimal', () => {
			let state = createWaterFlowState();
			// Tropical Orchid optimal is 82, hot=60 gives temp=80
			state = setValveLevel(state, 'hot', 60);

			const feedback = getTemperatureFeedback(state);

			expect(feedback.status).toBe('perfect');
		});
	});

	describe('confirmTemperature', () => {
		it('should fail when temperature is out of range', () => {
			let state = createWaterFlowState();
			state = setValveLevel(state, 'cold', 100);

			const result = confirmTemperature(state);

			expect(result.success).toBe(false);
			expect(result.message).toContain('needs water between');
		});

		it('should succeed when temperature is within range', () => {
			let state = createWaterFlowState();
			// Tropical Orchid needs 75-90
			state = setValveLevel(state, 'hot', 80);

			const result = confirmTemperature(state);

			expect(result.success).toBe(true);
			expect(result.state.data.completedPlants).toHaveLength(1);
		});

		it('should move to next plant after success', () => {
			let state = createWaterFlowState();
			state = setValveLevel(state, 'hot', 80);

			const result = confirmTemperature(state);

			expect(result.state.data.activePlantIndex).toBe(1);
		});

		it('should reset valves after success', () => {
			let state = createWaterFlowState();
			state = setValveLevel(state, 'hot', 80);

			const result = confirmTemperature(state);

			expect(result.state.data.hotValve.level).toBe(0);
			expect(result.state.data.coldValve.level).toBe(0);
		});

		it('should complete puzzle when all plants are satisfied', () => {
			let state = createWaterFlowState();

			// Plant 0: Tropical Orchid (75-90)
			// With hot=70, cold=0: temp = 85
			state = setValveLevel(state, 'hot', 70);
			expect(state.data.plants[0].currentTemp).toBeGreaterThanOrEqual(75);
			state = confirmTemperature(state).state;
			expect(state.data.completedPlants).toHaveLength(1);

			// Plant 1: Alpine Violet (45-60)
			// With hot=40, cold=0: temp = 70, too hot
			// With hot=0, cold=0: temp = 50, perfect
			// Valves are reset to 0 after each success, so temp is 50
			expect(state.data.plants[1].currentTemp).toBeGreaterThanOrEqual(45);
			expect(state.data.plants[1].currentTemp).toBeLessThanOrEqual(60);
			state = confirmTemperature(state).state;
			expect(state.data.completedPlants).toHaveLength(2);

			// Plant 2: Desert Succulent (65-80)
			// With hot=60, cold=0: temp = 80
			state = setValveLevel(state, 'hot', 60);
			expect(state.data.plants[2].currentTemp).toBeGreaterThanOrEqual(65);
			expect(state.data.plants[2].currentTemp).toBeLessThanOrEqual(80);
			state = confirmTemperature(state).state;
			expect(state.data.completedPlants).toHaveLength(3);

			// Plant 3: Heritage Rose (55-70)
			// With hot=40, cold=0: temp = 70
			state = setValveLevel(state, 'hot', 40);
			expect(state.data.plants[3].currentTemp).toBeGreaterThanOrEqual(55);
			expect(state.data.plants[3].currentTemp).toBeLessThanOrEqual(70);
			state = confirmTemperature(state).state;

			expect(state.solved).toBe(true);
			expect(state.data.completedPlants).toHaveLength(4);
		});
	});

	describe('getHint', () => {
		it('should return null when attempts are below threshold', () => {
			const state = createWaterFlowState();

			expect(getHint(state)).toBeNull();
		});

		it('should return tier 1 hint after 5 attempts', () => {
			let state = createWaterFlowState();
			state = { ...state, attempts: 5 };

			const hint = getHint(state);

			expect(hint).not.toBeNull();
			expect(hint?.tier).toBe(1);
		});
	});

	describe('waterFlowPuzzle definition', () => {
		it('should have correct puzzle ID', () => {
			expect(waterFlowPuzzle.id).toBe('room3_water_flow');
		});

		it('should be in garden_conservatory room', () => {
			expect(waterFlowPuzzle.roomId).toBe('garden_conservatory');
		});

		it('should have 3 hint tiers', () => {
			expect(waterFlowPuzzle.hints).toHaveLength(3);
		});
	});
});
