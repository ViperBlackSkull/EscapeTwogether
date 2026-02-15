import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import VictoryScreen from '$lib/components/VictoryScreen.svelte';

// Mock the sound manager
vi.mock('$lib/audio', () => ({
	soundManager: {
		playVictory: vi.fn(),
		playClick: vi.fn(),
	},
}));

describe('VictoryScreen Component', () => {
	const defaultProps = {
		totalPlayTime: 1800000, // 30 minutes
		hintsUsed: 5,
		roomsCompleted: 3,
		playerNames: { playerA: 'Alice', playerB: 'Bob' },
		onRestart: () => {},
		onReturnToLobby: () => {},
	};

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	describe('Rendering', () => {
		it('should render victory title', () => {
			render(VictoryScreen, defaultProps);
			expect(screen.getByText('Congratulations!')).toBeTruthy();
		});

		it('should render victory subtitle', () => {
			render(VictoryScreen, defaultProps);
			expect(screen.getByText('You escaped together!')).toBeTruthy();
		});
	});

	describe('Star Rating Logic', () => {
		it('should show 3 filled stars for good performance', () => {
			render(VictoryScreen, { ...defaultProps, hintsUsed: 3, totalPlayTime: 1800000 });

			const container = document.querySelector('.stars-container');
			expect(container).toBeTruthy();

			const stars = container?.querySelectorAll('.star');
			expect(stars?.length).toBe(3);

			const filledStars = container?.querySelectorAll('.star.filled');
			expect(filledStars?.length).toBe(3);
		});

		it('should show 2 filled stars for moderate hints', () => {
			render(VictoryScreen, { ...defaultProps, hintsUsed: 15, totalPlayTime: 1800000 });

			const container = document.querySelector('.stars-container');
			const filledStars = container?.querySelectorAll('.star.filled');
			expect(filledStars?.length).toBe(2);
		});

		it('should show 1 filled star for many hints', () => {
			render(VictoryScreen, { ...defaultProps, hintsUsed: 25, totalPlayTime: 1800000 });

			const container = document.querySelector('.stars-container');
			const filledStars = container?.querySelectorAll('.star.filled');
			expect(filledStars?.length).toBe(1);
		});

		it('should deduct star for slow time', () => {
			render(VictoryScreen, { ...defaultProps, hintsUsed: 0, totalPlayTime: 3000000 });

			const container = document.querySelector('.stars-container');
			const filledStars = container?.querySelectorAll('.star.filled');
			expect(filledStars?.length).toBe(2);
		});
	});

	describe('Component Structure', () => {
		it('should render stars container', () => {
			render(VictoryScreen, defaultProps);
			expect(document.querySelector('.stars-container')).toBeTruthy();
		});

		it('should render victory overlay', () => {
			render(VictoryScreen, defaultProps);
			expect(document.querySelector('.victory-overlay')).toBeTruthy();
		});

		it('should render victory content', () => {
			render(VictoryScreen, defaultProps);
			expect(document.querySelector('.victory-content')).toBeTruthy();
		});
	});
});
