<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { accessibilitySettings } from '$lib/stores/accessibility';

	const dispatch = createEventDispatcher();

	$: settings = $accessibilitySettings;

	function toggleSetting(key: keyof typeof settings) {
		accessibilitySettings.toggle(key);
	}

	function handleClose() {
		dispatch('close');
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	function resetSettings() {
		accessibilitySettings.reset();
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- Backdrop -->
<button
	class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
	on:click={handleClose}
	aria-label="Close accessibility settings"
></button>

<!-- Settings Panel -->
<div
	class="fixed right-0 top-0 bottom-0 w-full max-w-md bg-deep-navy border-l border-dusty-rose/20 z-50 overflow-y-auto"
	role="dialog"
	aria-labelledby="accessibility-title"
	aria-modal="true"
>
	<!-- Header -->
	<header class="sticky top-0 bg-deep-navy border-b border-dusty-rose/20 px-6 py-4 flex items-center justify-between">
		<h2 id="accessibility-title" class="text-xl font-display font-bold text-warm-amber">
			Accessibility Settings
		</h2>
		<button
			on:click={handleClose}
			class="p-2 text-dusty-rose/60 hover:text-dusty-rose transition-colors rounded-lg hover:bg-dusty-rose/10"
			aria-label="Close settings"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</header>

	<!-- Settings Content -->
	<div class="p-6 space-y-6">
		<!-- Introduction -->
		<p class="text-sm text-dusty-rose/70">
			Adjust these settings to improve your experience. Changes are saved automatically.
		</p>

		<!-- Visual Settings Section -->
		<section aria-labelledby="visual-settings">
			<h3 id="visual-settings" class="text-sm font-semibold text-antique-gold uppercase tracking-wider mb-4">
				Visual
			</h3>

			<div class="space-y-4">
				<!-- High Contrast -->
				<div class="flex items-center justify-between p-4 bg-soft-black/30 rounded-lg border border-dusty-rose/10">
					<div class="flex-1">
						<label for="high-contrast" class="block text-dusty-rose font-medium">
							High Contrast Mode
						</label>
						<p class="text-xs text-dusty-rose/50 mt-1">
							Increases color contrast for better visibility
						</p>
					</div>
					<button
						id="high-contrast"
						role="switch"
						aria-checked={settings.highContrast}
						on:click={() => toggleSetting('highContrast')}
						class="relative w-12 h-6 rounded-full transition-colors {settings.highContrast
							? 'bg-warm-amber'
							: 'bg-dusty-rose/30'}"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {settings.highContrast
								? 'translate-x-6'
								: ''}"
							aria-hidden="true"
						></span>
						<span class="sr-only">High contrast mode {settings.highContrast ? 'on' : 'off'}</span>
					</button>
				</div>

				<!-- Reduced Motion -->
				<div class="flex items-center justify-between p-4 bg-soft-black/30 rounded-lg border border-dusty-rose/10">
					<div class="flex-1">
						<label for="reduced-motion" class="block text-dusty-rose font-medium">
							Reduced Motion
						</label>
						<p class="text-xs text-dusty-rose/50 mt-1">
							Minimizes animations and motion effects
						</p>
					</div>
					<button
						id="reduced-motion"
						role="switch"
						aria-checked={settings.reducedMotion}
						on:click={() => toggleSetting('reducedMotion')}
						class="relative w-12 h-6 rounded-full transition-colors {settings.reducedMotion
							? 'bg-warm-amber'
							: 'bg-dusty-rose/30'}"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {settings.reducedMotion
								? 'translate-x-6'
								: ''}"
							aria-hidden="true"
						></span>
						<span class="sr-only">Reduced motion {settings.reducedMotion ? 'on' : 'off'}</span>
					</button>
				</div>

				<!-- Large Text -->
				<div class="flex items-center justify-between p-4 bg-soft-black/30 rounded-lg border border-dusty-rose/10">
					<div class="flex-1">
						<label for="large-text" class="block text-dusty-rose font-medium">
							Larger Text
						</label>
						<p class="text-xs text-dusty-rose/50 mt-1">
							Increases text size throughout the game
						</p>
					</div>
					<button
						id="large-text"
						role="switch"
						aria-checked={settings.largeText}
						on:click={() => toggleSetting('largeText')}
						class="relative w-12 h-6 rounded-full transition-colors {settings.largeText
							? 'bg-warm-amber'
							: 'bg-dusty-rose/30'}"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {settings.largeText
								? 'translate-x-6'
								: ''}"
							aria-hidden="true"
						></span>
						<span class="sr-only">Larger text {settings.largeText ? 'on' : 'off'}</span>
					</button>
				</div>

				<!-- Enhanced Focus Indicators -->
				<div class="flex items-center justify-between p-4 bg-soft-black/30 rounded-lg border border-dusty-rose/10">
					<div class="flex-1">
						<label for="focus-indicators" class="block text-dusty-rose font-medium">
							Enhanced Focus Indicators
						</label>
						<p class="text-xs text-dusty-rose/50 mt-1">
							Shows more visible focus outlines for keyboard navigation
						</p>
					</div>
					<button
						id="focus-indicators"
						role="switch"
						aria-checked={settings.focusIndicators}
						on:click={() => toggleSetting('focusIndicators')}
						class="relative w-12 h-6 rounded-full transition-colors {settings.focusIndicators
							? 'bg-warm-amber'
							: 'bg-dusty-rose/30'}"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {settings.focusIndicators
								? 'translate-x-6'
								: ''}"
							aria-hidden="true"
						></span>
						<span class="sr-only">Enhanced focus indicators {settings.focusIndicators ? 'on' : 'off'}</span>
					</button>
				</div>
			</div>
		</section>

		<!-- Screen Reader Section -->
		<section aria-labelledby="screen-reader-settings">
			<h3 id="screen-reader-settings" class="text-sm font-semibold text-antique-gold uppercase tracking-wider mb-4">
				Screen Reader
			</h3>

			<div class="space-y-4">
				<!-- Screen Reader Mode -->
				<div class="flex items-center justify-between p-4 bg-soft-black/30 rounded-lg border border-dusty-rose/10">
					<div class="flex-1">
						<label for="screen-reader-mode" class="block text-dusty-rose font-medium">
							Screen Reader Mode
						</label>
						<p class="text-xs text-dusty-rose/50 mt-1">
							Enables additional announcements and simplifies visual elements
						</p>
					</div>
					<button
						id="screen-reader-mode"
						role="switch"
						aria-checked={settings.screenReaderMode}
						on:click={() => toggleSetting('screenReaderMode')}
						class="relative w-12 h-6 rounded-full transition-colors {settings.screenReaderMode
							? 'bg-warm-amber'
							: 'bg-dusty-rose/30'}"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {settings.screenReaderMode
								? 'translate-x-6'
								: ''}"
							aria-hidden="true"
						></span>
						<span class="sr-only">Screen reader mode {settings.screenReaderMode ? 'on' : 'off'}</span>
					</button>
				</div>
			</div>
		</section>

		<!-- Keyboard Shortcuts Section -->
		<section aria-labelledby="keyboard-shortcuts">
			<h3 id="keyboard-shortcuts" class="text-sm font-semibold text-antique-gold uppercase tracking-wider mb-4">
				Keyboard Shortcuts
			</h3>

			<div class="bg-soft-black/30 rounded-lg border border-dusty-rose/10 p-4">
				<dl class="space-y-3 text-sm">
					<div class="flex justify-between">
						<dt class="text-dusty-rose/70">Navigate elements</dt>
						<dd><kbd class="px-2 py-1 bg-dusty-rose/20 rounded text-dusty-rose">Tab</kbd></dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-dusty-rose/70">Activate button</dt>
						<dd><kbd class="px-2 py-1 bg-dusty-rose/20 rounded text-dusty-rose">Enter</kbd> / <kbd class="px-2 py-1 bg-dusty-rose/20 rounded text-dusty-rose">Space</kbd></dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-dusty-rose/70">Close dialogs</dt>
						<dd><kbd class="px-2 py-1 bg-dusty-rose/20 rounded text-dusty-rose">Escape</kbd></dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-dusty-rose/70">Navigate puzzles</dt>
						<dd><kbd class="px-2 py-1 bg-dusty-rose/20 rounded text-dusty-rose">Arrow Keys</kbd></dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-dusty-rose/70">Skip to main content</dt>
						<dd><kbd class="px-2 py-1 bg-dusty-rose/20 rounded text-dusty-rose">Alt + M</kbd></dd>
					</div>
				</dl>
			</div>
		</section>

		<!-- Reset Button -->
		<div class="pt-4 border-t border-dusty-rose/20">
			<button
				on:click={resetSettings}
				class="w-full py-3 border border-dusty-rose/30 text-dusty-rose rounded-lg hover:bg-dusty-rose/10 transition-colors"
			>
				Reset to Defaults
			</button>
		</div>
	</div>
</div>
