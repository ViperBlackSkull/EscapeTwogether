import { describe, it, expect } from 'vitest';
import VictoryScreen from '$lib/components/VictoryScreen.svelte';
import { render, screen, fireEvent } from '@testing-library/svelte';

describe('VictoryScreen Component', () => {
	const defaultProps = {
		totalPlayTime: 1800000, // 30 minutes
		hintsUsed: 5,
		roomsCompleted: 3,
		playerNames: { playerA: 'Alice', playerB: 'Bob' },
		onRestart: () => {},
		onReturnToLobby: () => {},
	};

	describe('Rendering', () => {
		it('should render victory title', () => {
			render(VictoryScreen, { props: defaultProps });
			expect(screen.getByText('Congratulations!')).toBeTruthy();
		});

		it('should render victory subtitle', () => {
			render(VictoryScreen, { props: defaultProps });
			expect(screen.getByText('You escaped together!')).toBeTruthy();
		});

		it('should display player names', () => {
			render(VictoryScreen, { props: defaultProps });
			expect(screen.getByText('Alice')).toBeTruthy();
			expect(screen.getByText('Bob')).toBeTruthy();
		});

		it('should display formatted time', () => {
			render(VictoryScreen, { props: defaultProps });
			// 1800000ms = 30 minutes
			expect(screen.getByText('30:00')).toBeTruthy();
		});

		it('should display hints used count', () => {
			render(VictoryScreen, { props: defaultProps });
			expect(screen.getByText('5')).toBeTruthy();
		});

		it('should display rooms completed count', () => {
			render(VictoryScreen, { props: defaultProps });
			expect(screen.getByText('3')).toBeTruthy();
		});

		it('should render play again button', () => {
			render(VictoryScreen, { props: defaultProps });
			expect(screen.getByText('Play Again')).toBeTruthy();
		});

		it('should render return to lobby button', () => {
			render(VictoryScreen, { props: defaultProps });
			expect(screen.getByText('Return to Lobby')).toBeTruthy();
		});
	});

	describe('Time Formatting', () => {
		it('should format seconds correctly', () => {
			render(VictoryScreen, { props: { ...defaultProps, totalPlayTime: 45000 } });
			expect(screen.getByText('0:45')).toBeTruthy();
		});

		it('should format minutes correctly', () => {
			render(VictoryScreen, { props: { ...defaultProps, totalPlayTime: 125000 } });
			expect(screen.getByText('2:05')).toBeTruthy();
		});

		it('should format hours correctly', () => {
			render(VictoryScreen, { props: { ...defaultProps, totalPlayTime: 3725000 } });
			expect(screen.getByText('1:02:05')).toBeTruthy();
		});
	});

	describe('Interactions', () => {
		it('should call onRestart when play again button is clicked', async () => {
			let called = false;
			const onRestart = () => { called = true; };

			render(VictoryScreen, { props: { ...defaultProps, onRestart } });

			const button = screen.getByText('Play Again');
			await fireEvent.click(button);

			expect(called).toBe(true);
		});

		it('should call onReturnToLobby when return button is clicked', async () => {
			let called = false;
			const onReturnToLobby = () => { called = true; };

			render(VictoryScreen, { props: { ...defaultProps, onReturnToLobby } });

			const button = screen.getByText('Return to Lobby');
			await fireEvent.click(button);

			expect(called).toBe(true);
		});
	});

	describe('Star Rating', () => {
		it('should show 3 stars for good performance', () => {
			// Low hints, good time
			render(VictoryScreen, { props: { ...defaultProps, hintsUsed: 3, totalPlayTime: 1800000 } });

			// Should have 3 filled stars (gold color in SVG)
			const stars = document.querySelectorAll('.star.filled');
			expect(stars.length).toBe(3);
		});

		it('should show 2 stars for moderate hints', () => {
			// 15 hints used (> 10 threshold)
			render(VictoryScreen, { props: { ...defaultProps, hintsUsed: 15, totalPlayTime: 1800000 } });

			const filledStars = document.querySelectorAll('.star.filled');
			expect(filledStars.length).toBe(2);
		});

		it('should show 1 star for many hints', () => {
			// 25 hints used (> 20 threshold)
			render(VictoryScreen, { props: { ...defaultProps, hintsUsed: 25, totalPlayTime: 1800000 } });

			const filledStars = document.querySelectorAll('.star.filled');
			expect(filledStars.length).toBe(1);
		});

		it('should deduct star for slow time', () => {
			// 50 minutes (> 45 min threshold)
			render(VictoryScreen, { props: { ...defaultProps, hintsUsed: 0, totalPlayTime: 3000000 } });

			// 3 base - 1 for slow time = 2 stars, but minimum is 1
			const filledStars = document.querySelectorAll('.star.filled');
			expect(filledStars.length).toBe(2);
		});
	});
});
