import { describe, it, expect } from 'vitest';
import {
	createLightSpectrumState,
	rotatePrism,
	selectPrism,
	toggleMixMode,
	addToMix,
	getMixedColor,
	directLightToFlower,
	getLightRequirementsChart,
	getHint,
	lightSpectrumPuzzle
} from '$lib/puzzles/room3/light-spectrum';

describe('Light Spectrum Puzzle', () => {
	describe('createLightSpectrumState', () => {
		it('should create initial state with 3 prisms and 5 flowers', () => {
			const state = createLightSpectrumState();

			expect(state.data.prisms).toHaveLength(3);
			expect(state.data.flowers).toHaveLength(5);
			expect(state.solved).toBe(false);
		});

		it('should have prisms at angle 0 initially', () => {
			const state = createLightSpectrumState();

			state.data.prisms.forEach(prism => {
				expect(prism.angle).toBe(0);
			});
		});

		it('should have no completed flowers initially', () => {
			const state = createLightSpectrumState();

			expect(state.data.completedFlowers).toHaveLength(0);
		});
	});

	describe('rotatePrism', () => {
		it('should set prism angle', () => {
			let state = createLightSpectrumState();
			const prismId = state.data.prisms[0].id;

			state = rotatePrism(state, prismId, 90);

			const prism = state.data.prisms.find(p => p.id === prismId);
			expect(prism?.angle).toBe(90);
		});

		it('should clamp angle between 0 and 180', () => {
			let state = createLightSpectrumState();
			const prismId = state.data.prisms[0].id;

			state = rotatePrism(state, prismId, 200);
			expect(state.data.prisms[0].angle).toBe(180);

			state = rotatePrism(state, prismId, -50);
			expect(state.data.prisms[0].angle).toBe(0);
		});

		it('should update output color based on angle', () => {
			let state = createLightSpectrumState();

			// prism_red at 0-60 should output red
			state = rotatePrism(state, 'prism_red', 30);
			expect(state.data.prisms[0].outputColor).toBe('red');
		});
	});

	describe('selectPrism', () => {
		it('should select a prism', () => {
			let state = createLightSpectrumState();

			state = selectPrism(state, 'prism_red');

			expect(state.data.selectedPrism).toBe('prism_red');
		});

		it('should deselect when same prism selected', () => {
			let state = createLightSpectrumState();

			state = selectPrism(state, 'prism_red');
			state = selectPrism(state, 'prism_red');

			expect(state.data.selectedPrism).toBeNull();
		});
	});

	describe('toggleMixMode', () => {
		it('should toggle mix mode on', () => {
			let state = createLightSpectrumState();

			state = toggleMixMode(state);

			expect(state.data.mixMode).toBe(true);
		});

		it('should toggle mix mode off', () => {
			let state = createLightSpectrumState();
			state = toggleMixMode(state);

			state = toggleMixMode(state);

			expect(state.data.mixMode).toBe(false);
		});

		it('should clear active outputs when toggling', () => {
			let state = createLightSpectrumState();
			state = { ...state, data: { ...state.data, activeOutputs: ['red', 'blue'] } };

			state = toggleMixMode(state);

			expect(state.data.activeOutputs).toHaveLength(0);
		});
	});

	describe('addToMix', () => {
		it('should add color to active outputs', () => {
			let state = createLightSpectrumState();
			state = rotatePrism(state, 'prism_red', 30); // outputs red

			state = addToMix(state, 'prism_red');

			expect(state.data.activeOutputs).toContain('red');
		});

		it('should remove color if already active', () => {
			let state = createLightSpectrumState();
			state = rotatePrism(state, 'prism_red', 30);
			state = addToMix(state, 'prism_red');

			state = addToMix(state, 'prism_red');

			expect(state.data.activeOutputs).not.toContain('red');
		});
	});

	describe('getMixedColor', () => {
		it('should return white for empty outputs', () => {
			expect(getMixedColor([])).toBe('white');
		});

		it('should return single color for one output', () => {
			expect(getMixedColor(['red'])).toBe('red');
		});

		it('should mix red and blue to violet', () => {
			expect(getMixedColor(['red', 'blue'])).toBe('violet');
		});

		it('should mix red and yellow to orange', () => {
			expect(getMixedColor(['red', 'yellow'])).toBe('orange');
		});
	});

	describe('directLightToFlower', () => {
		it('should fail without selection', () => {
			const state = createLightSpectrumState();

			const result = directLightToFlower(state, 'flower_sun_daisy', false);

			expect(result.success).toBe(false);
			expect(result.message).toContain('Select a prism');
		});

		it('should fail with wrong color', () => {
			let state = createLightSpectrumState();
			state = selectPrism(state, 'prism_red');
			state = rotatePrism(state, 'prism_red', 30); // red

			// Sun Daisy needs yellow
			const result = directLightToFlower(state, 'flower_sun_daisy', false);

			expect(result.success).toBe(false);
			expect(result.message).toContain('needs yellow');
		});

		it('should succeed with correct color', () => {
			let state = createLightSpectrumState();
			state = selectPrism(state, 'prism_red');
			state = rotatePrism(state, 'prism_red', 150); // yellow for prism_red

			const result = directLightToFlower(state, 'flower_sun_daisy', false);

			expect(result.success).toBe(true);
			expect(result.state.data.completedFlowers).toHaveLength(1);
		});

		it('should mark flower as satisfied on success', () => {
			let state = createLightSpectrumState();
			state = selectPrism(state, 'prism_red');
			state = rotatePrism(state, 'prism_red', 150);

			const result = directLightToFlower(state, 'flower_sun_daisy', false);

			const flower = result.state.data.flowers.find(f => f.id === 'flower_sun_daisy');
			expect(flower?.satisfied).toBe(true);
		});

		it('should not allow duplicate satisfaction', () => {
			let state = createLightSpectrumState();
			state = selectPrism(state, 'prism_red');
			state = rotatePrism(state, 'prism_red', 150);

			const result1 = directLightToFlower(state, 'flower_sun_daisy', false);
			const result2 = directLightToFlower(result1.state, 'flower_sun_daisy', false);

			expect(result2.success).toBe(false);
			expect(result2.message).toContain('already received');
		});
	});

	describe('getLightRequirementsChart', () => {
		it('should return requirements for all 5 flowers', () => {
			const chart = getLightRequirementsChart();

			expect(chart).toHaveLength(5);
		});

		it('should include color names and hints', () => {
			const chart = getLightRequirementsChart();

			chart.forEach(item => {
				expect(item.colorName).toBeDefined();
				expect(item.hint).toBeDefined();
			});
		});
	});

	describe('getHint', () => {
		it('should return null when attempts are below threshold', () => {
			const state = createLightSpectrumState();

			expect(getHint(state)).toBeNull();
		});

		it('should return tier 1 hint after 4 attempts', () => {
			let state = createLightSpectrumState();
			state = { ...state, attempts: 4 };

			const hint = getHint(state);

			expect(hint).not.toBeNull();
			expect(hint?.tier).toBe(1);
		});
	});

	describe('lightSpectrumPuzzle definition', () => {
		it('should have correct puzzle ID', () => {
			expect(lightSpectrumPuzzle.id).toBe('room3_light_spectrum');
		});

		it('should be in garden_conservatory room', () => {
			expect(lightSpectrumPuzzle.roomId).toBe('garden_conservatory');
		});

		it('should have 3 hint tiers', () => {
			expect(lightSpectrumPuzzle.hints).toHaveLength(3);
		});
	});
});
