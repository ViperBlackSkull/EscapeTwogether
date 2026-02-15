<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { recentActions } from '$lib/utils/multiplayer';
  import { browser } from '$app/environment';
  import type { PlayerAction } from '$lib/utils/multiplayer';

  export let enabled = true;
  export let position: 'top' | 'bottom' = 'top';
  export let maxActions = 3;

  let unsubscribe: (() => void) | null = null;
  let actions: PlayerAction[] = [];
  let displayedActions: PlayerAction[] = [];

  onMount(() => {
    if (!browser || !enabled) return;

    // Subscribe to action updates
    unsubscribe = recentActions.subscribe((value) => {
      actions = value;
      updateDisplayedActions();
    });

    return () => {
      cleanup();
    };
  });

  onDestroy(() => {
    cleanup();
  });

  function cleanup() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  function updateDisplayedActions() {
    // Show only the most recent actions
    displayedActions = actions.slice(0, maxActions);
  }

  function getActionText(action: PlayerAction): string {
    const actionTexts: Record<string, string> = {
      'examining': 'is examining',
      'interacting': 'is interacting with',
      'moving': 'moved to',
      'picked_up': 'picked up',
      'solved': 'solved',
      'attempted': 'attempted',
      'hint_used': 'used a hint on',
      'room_changed': 'entered'
    };

    const verb = actionTexts[action.action] || action.action;
    const target = action.target ? ` ${action.target}` : '';

    return `${verb}${target}`;
  }

  function getPlayerColor(playerId: string): string {
    const hash = hashString(playerId);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
</script>

{#if enabled && browser && displayedActions.length > 0}
  <div class="action-banner action-banner-{position}">
    {#each displayedActions as action (action.timestamp)}
      <div
        class="action-item"
        style="--player-color: {getPlayerColor(action.playerId)};"
        class:action-item-new={Date.now() - action.timestamp < 1000}
      >
        <span class="action-player">{action.playerName}</span>
        <span class="action-text">{getActionText(action)}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .action-banner {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 20px;
  }

  .action-banner-top {
    top: 80px;
  }

  .action-banner-bottom {
    bottom: 100px;
  }

  .action-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 20px;
    border: 2px solid var(--player-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    font-size: 14px;
    color: white;
    white-space: nowrap;
    animation: actionSlideIn 0.3s ease-out, actionFadeOut 0.5s ease-in 4.5s forwards;
    backdrop-filter: blur(10px);
  }

  .action-item-new {
    animation: actionSlideIn 0.3s ease-out, actionPulse 0.5s ease-in-out;
  }

  .action-player {
    font-weight: bold;
    color: var(--player-color);
  }

  .action-text {
    color: rgba(255, 255, 255, 0.9);
  }

  @keyframes actionSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes actionPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @keyframes actionFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .action-banner {
      left: 10px;
      right: 10px;
      transform: none;
    }

    .action-item {
      font-size: 12px;
      padding: 6px 12px;
    }
  }
</style>
