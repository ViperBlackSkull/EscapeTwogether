<script lang="ts">
	import { soundManager, isMuted, masterVolume, sfxVolume, musicVolume } from '$lib/audio';
	import { onMount } from 'svelte';

	let showSettings = false;
	let localMuted = false;
	let localMasterVolume = 0.7;
	let localSfxVolume = 0.8;
	let localMusicVolume = 0.5;

	onMount(() => {
		// Sync local state with store
		const unsubscribeMuted = isMuted.subscribe((v) => (localMuted = v));
		const unsubscribeMaster = masterVolume.subscribe((v) => (localMasterVolume = v));
		const unsubscribeSfx = sfxVolume.subscribe((v) => (localSfxVolume = v));
		const unsubscribeMusic = musicVolume.subscribe((v) => (localMusicVolume = v));

		return () => {
			unsubscribeMuted();
			unsubscribeMaster();
			unsubscribeSfx();
			unsubscribeMusic();
		};
	});

	function toggleMute() {
		soundManager.toggleMute();
	}

	function toggleSettings() {
		showSettings = !showSettings;
	}

	function handleMasterVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		localMasterVolume = value;
		soundManager.setMasterVolume(value);
	}

	function handleSfxVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		localSfxVolume = value;
		soundManager.setSfxVolume(value);
	}

	function handleMusicVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		localMusicVolume = value;
		soundManager.setMusicVolume(value);
	}
</script>

<div class="relative">
	<!-- Main mute/unmute button -->
	<button
		on:click={toggleMute}
		class="p-2 rounded-lg bg-soft-black/50 border border-dusty-rose/20 hover:border-dusty-rose/40 transition-colors"
		title={localMuted ? 'Unmute' : 'Mute'}
		aria-label={localMuted ? 'Unmute sound' : 'Mute sound'}
	>
		{#if localMuted}
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-dusty-rose/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
			</svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warm-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
			</svg>
		{/if}
	</button>

	<!-- Settings toggle -->
	<button
		on:click={toggleSettings}
		class="ml-1 p-2 rounded-lg bg-soft-black/50 border border-dusty-rose/20 hover:border-dusty-rose/40 transition-colors"
		title="Sound settings"
		aria-label="Open sound settings"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-dusty-rose/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
		</svg>
	</button>

	<!-- Settings dropdown -->
	{#if showSettings}
		<div class="absolute right-0 top-full mt-2 w-64 bg-deep-navy border border-dusty-rose/20 rounded-lg p-4 shadow-xl z-50">
			<h3 class="text-sm font-semibold text-antique-gold mb-4 uppercase tracking-wider">Sound Settings</h3>

			<!-- Master Volume -->
			<div class="mb-4">
				<div class="flex justify-between items-center mb-1">
					<label class="text-xs text-dusty-rose/60">Master Volume</label>
					<span class="text-xs text-dusty-rose">{Math.round(localMasterVolume * 100)}%</span>
				</div>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={localMasterVolume}
					on:change={handleMasterVolumeChange}
					on:input={handleMasterVolumeChange}
					class="w-full h-2 bg-soft-black rounded-lg appearance-none cursor-pointer accent-warm-amber"
				/>
			</div>

			<!-- SFX Volume -->
			<div class="mb-4">
				<div class="flex justify-between items-center mb-1">
					<label class="text-xs text-dusty-rose/60">Sound Effects</label>
					<span class="text-xs text-dusty-rose">{Math.round(localSfxVolume * 100)}%</span>
				</div>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={localSfxVolume}
					on:change={handleSfxVolumeChange}
					on:input={handleSfxVolumeChange}
					class="w-full h-2 bg-soft-black rounded-lg appearance-none cursor-pointer accent-warm-amber"
				/>
			</div>

			<!-- Music Volume -->
			<div class="mb-2">
				<div class="flex justify-between items-center mb-1">
					<label class="text-xs text-dusty-rose/60">Music</label>
					<span class="text-xs text-dusty-rose">{Math.round(localMusicVolume * 100)}%</span>
				</div>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={localMusicVolume}
					on:change={handleMusicVolumeChange}
					on:input={handleMusicVolumeChange}
					class="w-full h-2 bg-soft-black rounded-lg appearance-none cursor-pointer accent-warm-amber"
				/>
			</div>

			<!-- Close button -->
			<button
				on:click={toggleSettings}
				class="mt-3 w-full py-2 bg-warm-amber/20 text-warm-amber rounded-lg text-sm hover:bg-warm-amber/30 transition-colors"
			>
				Close
			</button>
		</div>
	{/if}
</div>
