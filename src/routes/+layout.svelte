<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AccessibilitySettings from '$lib/components/AccessibilitySettings.svelte';
	import { accessibilityClasses, accessibilitySettings } from '$lib/stores/accessibility';

	let showAccessibilitySettings = false;

	// Build class string from accessibility settings
	$: a11yClasses = Object.entries($accessibilityClasses)
		.filter(([, enabled]) => enabled)
		.map(([name]) => name)
		.join(' ');

	// Handle keyboard shortcuts
	function handleGlobalKeyDown(event: KeyboardEvent) {
		// Alt+A to open accessibility settings
		if (event.altKey && event.key === 'a') {
			event.preventDefault();
			showAccessibilitySettings = !showAccessibilitySettings;
		}

		// Alt+M to skip to main content
		if (event.altKey && event.key === 'm') {
			event.preventDefault();
			const mainContent = document.querySelector('main, [role="main"]');
			if (mainContent instanceof HTMLElement) {
				mainContent.focus();
			}
		}
	}

	function skipToMain() {
		const mainContent = document.querySelector('main, [role="main"]');
		if (mainContent instanceof HTMLElement) {
			mainContent.setAttribute('tabindex', '-1');
			mainContent.focus();
		}
	}

	function skipToNav() {
		const nav = document.querySelector('nav, [role="navigation"]');
		if (nav instanceof HTMLElement) {
			nav.setAttribute('tabindex', '-1');
			nav.focus();
		}
	}
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="mobile-web-app-capable" content="yes" />
	<html lang="en" />
</svelte:head>

<svelte:window on:keydown={handleGlobalKeyDown} />

<!-- Screen reader announcer for dynamic content -->
<div id="sr-announcer" aria-live="polite" aria-atomic="true"></div>

<!-- Skip Links for keyboard users -->
<div class="skip-links">
	<a href="#main-content" class="skip-link" on:click|preventDefault={skipToMain}>
		Skip to main content
	</a>
	<a href="#navigation" class="skip-link" on:click|preventDefault={skipToNav}>
		Skip to navigation
	</a>
</div>

<!-- Main app container with accessibility classes -->
<div class="app-container {a11yClasses}">
	<slot />
</div>

<!-- Accessibility Settings Button (floating) -->
<button
	class="fixed bottom-4 left-4 z-40 p-3 bg-deep-navy border border-dusty-rose/20 rounded-full text-dusty-rose hover:text-warm-amber hover:border-warm-amber/50 transition-colors shadow-lg"
	on:click={() => showAccessibilitySettings = true}
	aria-label="Open accessibility settings"
	title="Accessibility Settings (Alt+A)"
>
	<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
	</svg>
</button>

<!-- Accessibility Settings Panel -->
{#if showAccessibilitySettings}
	<AccessibilitySettings on:close={() => showAccessibilitySettings = false} />
{/if}

<style>
	.skip-links {
		position: relative;
		z-index: 100;
	}

	.skip-link {
		position: absolute;
		top: -100px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-warm-amber, #f4a460);
		color: var(--color-deep-navy, #1a1a2e);
		padding: 12px 24px;
		border-radius: 0 0 8px 8px;
		font-weight: 600;
		text-decoration: none;
		transition: top 0.2s;
		z-index: 1000;
	}

	.skip-link:focus {
		top: 0;
		outline: 3px solid var(--color-soft-teal, #4a9b8c);
		outline-offset: 2px;
	}

	.app-container {
		min-height: 100vh;
		min-height: 100dvh;
	}
</style>
