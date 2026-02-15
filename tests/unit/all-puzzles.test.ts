/**
 * ============================================================================
 * ALL PUZZLES INTEGRATION TEST - UNIT TESTS
 * ============================================================================
 *
 * Comprehensive test suite that validates all 18 puzzles in the game:
 * - Room 1 (Attic): 4 puzzles
 * - Room 2 (Clock Tower): 6 puzzles
 * - Room 3 (Greenhouse): 8 puzzles
 *
 * This test ensures:
 * - All puzzles have proper definitions
 * - All puzzles have validateSolution functions
 * - All puzzles have appropriate hints
 * - All puzzles have required roles defined
 * - Puzzle IDs are unique
 *
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';

// Import all puzzle definitions
import * as Room1Puzzles from '$lib/puzzles/room1/index';
import * as Room2Puzzles from '$lib/puzzles/room2/index';
import * as Room3Puzzles from '$lib/puzzles/room3/index';

// Expected puzzle counts
const EXPECTED_ROOM1_COUNT = 4;
const EXPECTED_ROOM2_COUNT = 6;
const EXPECTED_ROOM3_COUNT = 8;
const EXPECTED_TOTAL = 18;

describe('All Puzzles Integration', () => {
	describe('Puzzle Count Validation', () => {
		it('should have exactly 4 puzzles in Room 1 (Attic)', () => {
			const room1Puzzles = Object.values(Room1Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p
			);

			expect(room1Puzzles.length).toBe(EXPECTED_ROOM1_COUNT);
		});

		it('should have exactly 6 puzzles in Room 2 (Clock Tower)', () => {
			const room2Puzzles = Object.values(Room2Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p
			);

			expect(room2Puzzles.length).toBe(EXPECTED_ROOM2_COUNT);
		});

		it('should have exactly 8 puzzles in Room 3 (Greenhouse)', () => {
			const room3Puzzles = Object.values(Room3Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p
			);

			expect(room3Puzzles.length).toBe(EXPECTED_ROOM3_COUNT);
		});

		it('should have exactly 18 puzzles total', () => {
			const room1Puzzles = Object.values(Room1Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p
			);
			const room2Puzzles = Object.values(Room2Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p
			);
			const room3Puzzles = Object.values(Room3Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p
			);

			const total = room1Puzzles.length + room2Puzzles.length + room3Puzzles.length;
			expect(total).toBe(EXPECTED_TOTAL);
		});
	});

	describe('Puzzle Definition Completeness', () => {
		it('should have all puzzles with unique IDs', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p);

			const ids = allPuzzles.map((p: any) => p.id);
			const uniqueIds = new Set(ids);

			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should have all puzzles with validateSolution function', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p);

			const allHaveValidator = allPuzzles.every((p: any) =>
				typeof p.solutionValidator === 'function' ||
				typeof p.validateSolution === 'function'
			);

			expect(allHaveValidator).toBe(true);
		});

		it('should have all puzzles with requiredRoles defined', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p);

			const allHaveRoles = allPuzzles.every((p: any) =>
				Array.isArray(p.requiredRoles) && p.requiredRoles.length >= 2
			);

			expect(allHaveRoles).toBe(true);
		});

		it('should have all puzzles with hints array', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p);

			const allHaveHints = allPuzzles.every((p: any) =>
				Array.isArray(p.hints) && p.hints.length > 0
			);

			expect(allHaveHints).toBe(true);
		});

		it('should have all puzzles with roomId', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p);

			const allHaveRoomId = allPuzzles.every((p: any) =>
				typeof p.roomId === 'string' && p.roomId.length > 0
			);

			expect(allHaveRoomsId).toBe(true);
		});
	});

	describe('Room 1 Puzzles (Attic)', () => {
		it('should include Music Box puzzle', () => {
			const puzzle = Room1Puzzles.musicBoxPuzzle || Room1Puzzles.MusicBoxPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('music-box');
		});

		it('should include Torn Photographs puzzle', () => {
			const puzzle = Room1Puzzles.tornPhotographsPuzzle || Room1Puzzles.TornPhotographsPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('torn');
		});

		it('should include Secret Message puzzle', () => {
			const puzzle = Room1Puzzles.secretMessagePuzzle || Room1Puzzles.SecretMessagePuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('secret');
		});

		it('should include Trunk Lock puzzle', () => {
			const puzzle = Room1Puzzles.trunkLockPuzzle || Room1Puzzles.TrunkLockPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('trunk');
		});
	});

	describe('Room 2 Puzzles (Clock Tower)', () => {
		it('should include Bell Codes puzzle', () => {
			const puzzle = Room2Puzzles.bellCodesPuzzle || Room2Puzzles.BellCodesPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('bell');
		});

		it('should include Clock Face puzzle', () => {
			const puzzle = Room2Puzzles.clockFacePuzzle || Room2Puzzles.ClockFacePuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('clock');
		});

		it('should include Gear Alignment puzzle', () => {
			const puzzle = Room2Puzzles.gearAlignmentPuzzle || Room2Puzzles.GearAlignmentPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('gear');
		});

		it('should include Midnight Chime puzzle', () => {
			const puzzle = Room2Puzzles.midnightChimePuzzle || Room2Puzzles.MidnightChimePuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('chime');
		});

		it('should include Pendulum puzzle', () => {
			const puzzle = Room2Puzzles.pendulumPuzzle || Room2Puzzles.PendulumPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('pendulum');
		});

		it('should include Windup Key puzzle', () => {
			const puzzle = Room2Puzzles.windupKeyPuzzle || Room2Puzzles.WindupKeyPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('windup');
		});
	});

	describe('Room 3 Puzzles (Greenhouse)', () => {
		it('should include Bloom Timing puzzle', () => {
			const puzzle = Room3Puzzles.bloomTimingPuzzle || Room3Puzzles.BloomTimingPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('bloom');
		});

		it('should include Final Bloom puzzle', () => {
			const puzzle = Room3Puzzles.finalBloomPuzzle || Room3Puzzles.FinalBloomPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('final');
		});

		it('should include Hybridization puzzle', () => {
			const puzzle = Room3Puzzles.hybridizationPuzzle || Room3Puzzles.HybridizationPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('hybrid');
		});

		it('should include Light Spectrum puzzle', () => {
			const puzzle = Room3Puzzles.lightSpectrumPuzzle || Room3Puzzles.LightSpectrumPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('light');
		});

		it('should include Seed Packets puzzle', () => {
			const puzzle = Room3Puzzles.seedPacketsPuzzle || Room3Puzzles.SeedPacketsPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('seed');
		});

		it('should include Trellis puzzle', () => {
			const puzzle = Room3Puzzles.trellisPuzzle || Room3Puzzles.TrellisPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('trellis');
		});

		it('should include Water Flow puzzle', () => {
			const puzzle = Room3Puzzles.waterFlowPuzzle || Room3Puzzles.WaterFlowPuzzle;
			expect(puzzle).toBeDefined();
			expect(puzzle.id).toContain('water');
		});
	});

	describe('Hint System Validation', () => {
		it('should have progressive hints for all puzzles', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p && 'hints' in p);

			const allHaveProgressiveHints = allPuzzles.every((p: any) => {
				if (!Array.isArray(p.hints)) return false;

				// Check that hints have increasing tiers
				const tiers = p.hints.map((h: any) => h.tier).sort((a: number, b: number) => a - b);
				for (let i = 0; i < tiers.length - 1; i++) {
					if (tiers[i + 1] !== tiers[i] + 1) return false;
				}
				return true;
			});

			expect(allHaveProgressiveHints).toBe(true);
		});

		it('should have triggerAttempts defined for hints', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p && 'hints' in p);

			const allHaveTriggerAttempts = allPuzzles.every((p: any) => {
				if (!Array.isArray(p.hints)) return false;
				return p.hints.every((h: any) => typeof h.triggerAttempts === 'number');
			});

			expect(allHaveTriggerAttempts).toBe(true);
		});
	});

	describe('Role Assignment Validation', () => {
		it('should assign explorer role to all puzzles', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p && 'requiredRoles' in p);

			const allUseExplorer = allPuzzles.every((p: any) =>
				p.requiredRoles.includes('explorer')
			);

			expect(allUseExplorer).toBe(true);
		});

		it('should assign analyst role to all puzzles', () => {
			const allPuzzles = [
				...Object.values(Room1Puzzles),
				...Object.values(Room2Puzzles),
				...Object.values(Room3Puzzles)
			].filter(p => typeof p === 'object' && p !== null && 'id' in p && 'requiredRoles' in p);

			const allUseAnalyst = allPuzzles.every((p: any) =>
				p.requiredRoles.includes('analyst')
			);

			expect(allUseAnalyst).toBe(true);
		});
	});

	describe('Puzzle Room Assignment', () => {
		it('should have all Room 1 puzzles with correct roomId', () => {
			const room1Puzzles = Object.values(Room1Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p && 'roomId' in p
			);

			const allInAttic = room1Puzzles.every((p: any) =>
				p.roomId === 'attic' || p.roomId === 'room1'
			);

			expect(allInAttic).toBe(true);
		});

		it('should have all Room 2 puzzles with correct roomId', () => {
			const room2Puzzles = Object.values(Room2Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p && 'roomId' in p
			);

			const allInClockTower = room2Puzzles.every((p: any) =>
				p.roomId === 'clock_tower' || p.roomId === 'room2'
			);

			expect(allInClockTower).toBe(true);
		});

		it('should have all Room 3 puzzles with correct roomId', () => {
			const room3Puzzles = Object.values(Room3Puzzles).filter(
				p => typeof p === 'object' && p !== null && 'id' in p && 'roomId' in p
			);

			const allInGreenhouse = room3Puzzles.every((p: any) =>
				p.roomId === 'greenhouse' || p.roomId === 'room3'
			);

			expect(allInGreenhouse).toBe(true);
		});
	});
});
