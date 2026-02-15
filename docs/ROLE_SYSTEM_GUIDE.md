# Role System Implementation Guide

## Overview

The EscapeTwogether role system creates asymmetric gameplay by assigning different capabilities to two players:
- **Explorer**: Can interact with puzzle elements directly
- **Analyst**: Has access to reference materials and clues

## Core Components

### 1. RoleBadge Component

Prominent display of the current player's role.

```svelte
<RoleBadge role={$currentPlayerRole} size="medium" showLabel={true} animated={true} />
```

**Props:**
- `role`: 'explorer' | 'analyst'
- `size`: 'small' | 'medium' | 'large'
- `showLabel`: boolean
- `animated`: boolean

### 2. RoleIndicator Component

Shows current role and capabilities, with role swap notifications.

```svelte
<RoleIndicator showCapabilities={true} />
```

**Props:**
- `playerId`: string | null
- `compact`: boolean
- `showCapabilities`: boolean

### 3. RolePrompt Component

Modal dialog encouraging cooperation between players.

```svelte
<RolePrompt bind:show={showPrompt} autoHide={true} delay={5000} />
```

**Props:**
- `show`: boolean
- `autoHide`: boolean
- `delay`: number (milliseconds)

### 4. RoleBasedPuzzleView Component

Wrapper for puzzles that provides role-specific UI.

```svelte
<RoleBasedPuzzleView
	playerRole={$currentPlayerRole}
	puzzleTitle="Music Box"
	puzzleDescription="Align the gears to unlock the melody"
>
	{#snippet children()}
		<!-- Puzzle content here -->
	{/snippet}

	{#snippet analystInfo()}
		<!-- Analyst-only reference information -->
	{/snippet}
</RoleBasedPuzzleView>
```

## Store Usage

### Import Role Stores

```typescript
import {
	currentPlayerRole,
	performRoleSwap,
	ROLE_COLORS,
	ROLE_CAPABILITIES
} from '$lib/stores/roles';
```

### Get Current Role

```svelte
<script>
	import { currentPlayerRole } from '$lib/stores/roles';

	$: role = $currentPlayerRole;
	$: isExplorer = role === 'explorer';
	$: isAnalyst = role === 'analyst';
</script>
```

### Swap Roles on Puzzle Completion

```typescript
function handlePuzzleSolved() {
	// Automatically swap roles
	performRoleSwap();

	// Show success narrative
	showStoryNarrative = true;
}
```

## Role-Based UI Patterns

### 1. Conditional Rendering

```svelte
{#if isExplorer}
	<button on:click={interact}>Interact</button>
{/if}

{#if isAnalyst}
	<div class="reference-material">
		<h3>Clue: Check the gear ratios</h3>
	</div>
{/if}
```

### 2. Role-Specific Styling

```svelte
<div
	class="puzzle-container"
	class:explorer={isExplorer}
	class:analyst={isAnalyst}
	style="border-color: {ROLE_COLORS[role].primary}"
>
	<!-- Content -->
</div>
```

### 3. Action Restrictions

```typescript
function handleClick() {
	if (!canPerformRoleAction(playerId, 'explorer')) {
		showError('Only Explorers can interact with this element');
		return;
	}
	// Perform action
}
```

## Utility Functions

```typescript
import {
	getRoleClasses,
	getRolePrompt,
	getCooperationMessage
} from '$lib/stores/roles';

// Get CSS classes for role styling
const classes = getRoleClasses(role);

// Get contextual prompt
const prompt = getRolePrompt(role, 'puzzle');

// Get cooperation message
const message = getCooperationMessage(playerRole, partnerRole);
```

## Best Practices

1. **Always show role prominently**: Display the player's role clearly in the UI
2. **Encourage communication**: Add prompts that remind players to talk to each other
3. **Balance information**: Ensure both roles have valuable but different information
4. **Swap regularly**: Change roles after each puzzle to keep gameplay fresh
5. **Clear feedback**: When an action isn't available for a role, explain why

## Example: Complete Puzzle Integration

```svelte
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { currentPlayerRole, performRoleSwap } from '$lib/stores/roles';
	import RoleBadge from '$lib/components/RoleBadge.svelte';
	import RoleBasedPuzzleView from '$lib/components/puzzles/RoleBasedPuzzleView.svelte';

	export let puzzleState;

	const dispatch = createEventDispatcher();

	$: role = $currentPlayerRole;
	$: isExplorer = role === 'explorer';

	function handleInteraction() {
		if (!isExplorer) {
			showMessage('Ask your Explorer to interact with this');
			return;
		}
		dispatch('interact');
	}

	function handleSolved() {
		performRoleSwap();
		dispatch('solved');
	}
</script>

<RoleBasedPuzzleView
	playerRole={role}
	puzzleTitle="Mysterious Lock"
	puzzleDescription="Find the combination and unlock it"
>
	{#snippet children()}
		<div class="puzzle-area">
			<RoleBadge role={role} size="small" />

			{#if isExplorer}
				<button on:click={handleInteraction}>
					Try Combination
				</button>
			{/if}

			<!-- Puzzle state display -->
			<p>Status: {puzzleState.status}</p>
		</div>
	{/snippet}

	{#snippet analystInfo()}
		<div class="analyst-clues">
			<h3>Reference Guide</h3>
			<p>The combination relates to the number of gears...</p>
		</div>
	{/snippet}
</RoleBasedPuzzleView>
```

## Testing Role System

### Test Page: `/test-roles`

Visit `/test-roles` to see and test all role components:

- Role badges (small, medium, large)
- Role indicators (compact, full)
- Role swap notifications
- Role prompts

## Role Swap Flow

1. Puzzle is solved → `handlePuzzleSolved()`
2. Call `performRoleSwap()`
3. Roles are exchanged in game state
4. Notification shown to both players
5. New puzzle starts with swapped roles
6. Players adapt to new capabilities

## Audio Feedback

Consider adding role-specific audio cues:

```typescript
if (role === 'explorer') {
	soundManager.play('explorer-action');
} else {
	soundManager.play('analyst-hint');
}
```

## Accessibility

All role components include:
- Proper ARIA labels
- Role announcements
- Keyboard navigation
- Screen reader support

```svelte
<div
	role="img"
	aria-label="{displayName} Role"
>
	<!-- Role badge content -->
</div>
```
