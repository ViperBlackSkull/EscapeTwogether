<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { remoteCursors, sendCursorPosition } from '$lib/utils/multiplayer';
  import { getCurrentPlayerId } from '$lib/socket';
  import { browser } from '$app/environment';

  export let container: HTMLElement | null = null;
  export let enabled = true;

  let unsubscribe: (() => void) | null = null;
  let currentPlayerId: string | null = null;

  onMount(() => {
    if (!browser || !enabled) return;

    currentPlayerId = getCurrentPlayerId();

    // Subscribe to remote cursor updates
    unsubscribe = remoteCursors.subscribe((cursors) => {
      updateCursorElements(cursors);
    });

    // Set up mouse tracking
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

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

    if (container) {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    }

    // Remove all cursor elements
    document.querySelectorAll('.remote-cursor').forEach((el) => el.remove());
  }

  function handleMouseMove(event: MouseEvent) {
    if (!container || !enabled) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    sendCursorPosition(x, y);
  }

  function handleMouseLeave() {
    // Send cursor outside bounds
    if (container) {
      sendCursorPosition(-100, -100);
    }
  }

  function updateCursorElements(cursors: Map<string, any>) {
    if (!browser) return;

    // Remove cursors that no longer exist
    const existingElements = document.querySelectorAll('.remote-cursor');
    existingElements.forEach((el) => {
      const playerId = el.getAttribute('data-player-id');
      if (!cursors.has(playerId!)) {
        el.remove();
      }
    });

    // Update or create cursor elements
    cursors.forEach((cursor, playerId) => {
      // Don't show own cursor
      if (playerId === currentPlayerId) return;

      let cursorEl = document.querySelector(`.remote-cursor[data-player-id="${playerId}"]`) as HTMLElement;

      if (!cursorEl) {
        cursorEl = createCursorElement(cursor);
        if (container) {
          container.appendChild(cursorEl);
        }
      }

      // Update position
      cursorEl.style.left = `${cursor.x}px`;
      cursorEl.style.top = `${cursor.y}px`;
      cursorEl.style.transform = 'translate(-50%, -50%)';
    });
  }

  function createCursorElement(cursor: any): HTMLElement {
    const el = document.createElement('div');
    el.className = 'remote-cursor';
    el.setAttribute('data-player-id', cursor.playerId);

    // Generate color from player ID
    const hue = hashString(cursor.playerId) % 360;
    const color = `hsl(${hue}, 70%, 50%)`;

    el.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" style="filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.3));">
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"/>
      </svg>
      <span class="cursor-label" style="background-color: ${color};">${escapeHtml(cursor.playerName)}</span>
    `;

    // Add styles
    Object.assign(el.style, {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: '9999',
      transition: 'left 0.1s ease-out, top 0.1s ease-out'
    });

    // Add label styles
    const label = el.querySelector('.cursor-label') as HTMLElement;
    Object.assign(label.style, {
      position: 'absolute',
      left: '16px',
      top: '16px',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: 'white',
      whiteSpace: 'nowrap',
      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
    });

    return el;
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

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
</script>

{#if enabled && browser}
  <div class="shared-cursor-container" style="position: relative; width: 100%; height: 100%;">
    <slot />
  </div>
{:else}
  <slot />
{/if}

<style>
  .shared-cursor-container :global(.remote-cursor) {
    animation: cursorFadeIn 0.2s ease-out;
  }

  @keyframes cursorFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
</style>
