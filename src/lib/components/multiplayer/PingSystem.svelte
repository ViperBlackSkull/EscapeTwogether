<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { activePings, sendPing } from '$lib/utils/multiplayer';
  import { browser } from '$app/environment';

  export let container: HTMLElement | null = null;
  export let enabled = true;
  export let pingKey = 'Shift+Click'; // Key combination to trigger ping

  let unsubscribe: (() => void) | null = null;
  let pings: any[] = [];

  onMount(() => {
    if (!browser || !enabled) return;

    // Subscribe to ping updates
    unsubscribe = activePings.subscribe((value) => {
      pings = value;
      renderPings();
    });

    // Set up click handler for pings
    if (container) {
      container.addEventListener('click', handleClick);
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
      container.removeEventListener('click', handleClick);
    }

    // Remove all ping elements
    document.querySelectorAll('.ping-marker').forEach((el) => el.remove());
  }

  function handleClick(event: MouseEvent) {
    if (!enabled || !container) return;

    // Check if shift key is held (for ping)
    if (event.shiftKey) {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Send ping
      sendPing(x, y);

      // Prevent default behavior
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function renderPings() {
    if (!browser || !container) return;

    // Remove old ping elements
    const existingElements = container.querySelectorAll('.ping-marker');
    const activeTimestamps = new Set(pings.map((p) => p.timestamp));

    existingElements.forEach((el) => {
      const timestamp = parseInt(el.getAttribute('data-timestamp') || '0');
      if (!activeTimestamps.has(timestamp)) {
        el.remove();
      }
    });

    // Create or update ping elements
    pings.forEach((ping) => {
      let pingEl = container.querySelector(`.ping-marker[data-timestamp="${ping.timestamp}"]`) as HTMLElement;

      if (!pingEl) {
        pingEl = createPingElement(ping);
        container.appendChild(pingEl);

        // Trigger animation
        requestAnimationFrame(() => {
          pingEl.classList.add('ping-active');
        });
      }
    });
  }

  function createPingElement(ping: any): HTMLElement {
    const el = document.createElement('div');
    el.className = 'ping-marker';
    el.setAttribute('data-timestamp', ping.timestamp.toString());

    // Generate color from player ID
    const hue = hashString(ping.playerId) % 360;
    const color = `hsl(${hue}, 70%, 50%)`;

    // Create ping visual
    el.innerHTML = `
      <div class="ping-ring" style="border-color: ${color};"></div>
      <div class="ping-center" style="background-color: ${color};"></div>
      ${ping.message ? `<div class="ping-message" style="background-color: ${color};">${escapeHtml(ping.message)}</div>` : ''}
      <div class="ping-player">${escapeHtml(ping.playerName)}</div>
    `;

    // Position
    Object.assign(el.style, {
      position: 'absolute',
      left: `${ping.x}px`,
      top: `${ping.y}px`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: '10000'
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
  <div class="ping-system-container" style="position: relative; width: 100%; height: 100%;">
    <slot />
    <div class="ping-instruction" style="position: absolute; bottom: 10px; left: 10px; opacity: 0.6; font-size: 12px; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5); pointer-events: none; z-index: 10001;">
      Hold Shift + Click to ping
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  .ping-marker {
    animation: pingFadeIn 0.3s ease-out;
  }

  .ping-ring {
    position: absolute;
    width: 60px;
    height: 60px;
    border: 3px solid;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: pingRipple 1.5s ease-out infinite;
  }

  .ping-center {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px currentColor;
  }

  .ping-message {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    color: white;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    animation: pingBounce 0.5s ease-out;
  }

  .ping-player {
    position: absolute;
    top: 25px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 6px;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
    font-size: 11px;
    color: white;
    white-space: nowrap;
  }

  @keyframes pingFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes pingRipple {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }

  @keyframes pingBounce {
    0% {
      transform: translateX(-50%) translateY(10px);
      opacity: 0;
    }
    50% {
      transform: translateX(-50%) translateY(-5px);
    }
    100% {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  .ping-active .ping-ring {
    animation: pingRipple 1.5s ease-out infinite;
  }
</style>
