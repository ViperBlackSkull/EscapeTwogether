<script lang="ts">
	import { soundManager, audioState, isMuted, masterVolume, musicVolume, sfxVolume, ambienceVolume } from '$lib/audio';
	import { onMount } from 'svelte';

	let showSettings = $state(false);
	let isInitializing = $state(false);

	// Local state for sliders (use two-way binding with get/set)
	let localMasterVolume = $state(0.7);
	let localMusicVolume = $state(0.6);
	let localSfxVolume = $state(0.8);
	let localAmbienceVolume = $state(0.5);

	// Sync local state with store
	$effect(() => {
		localMasterVolume = $masterVolume;
		localMusicVolume = $musicVolume;
		localSfxVolume = $sfxVolume;
		localAmbienceVolume = $ambienceVolume;
	});

	function handleMasterVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		soundManager.setMasterVolume(value);
	}

	function handleMusicVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		soundManager.setMusicVolume(value);
	}

	function handleSfxVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		soundManager.setSfxVolume(value);
	}

	function handleAmbienceVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		soundManager.setAmbientVolume(value);
	}

	function toggleMute() {
		soundManager.toggleMute();
		soundManager.playClick();
	}

	function testSound(type: 'sfx' | 'music' | 'ambience') {
		switch (type) {
			case 'sfx':
				soundManager.playNotification();
				break;
			case 'music':
				// Briefly play music then stop
				soundManager.playMusic('music-exploration', 0.5);
				setTimeout(() => soundManager.stopMusic(0.5), 2000);
				break;
			case 'ambience':
				// Briefly play attic ambience then stop
				soundManager.playAmbient('ambient-attic', 0.5);
				setTimeout(() => soundManager.stopAmbient(0.5), 2000);
				break;
		}
	}

	onMount(() => {
		// Initialize audio system on mount
		isInitializing = true;
		soundManager.init().then(() => {
			isInitializing = false;
		});
	});

	// Format volume percentage
	function formatVolume(value: number): string {
		return `${Math.round(value * 100)}%`;
	}
</script>

<div class="audio-settings">
	<button
		class="audio-toggle-btn"
		class:muted={$isMuted}
		onclick={() => {
			showSettings = !showSettings;
			soundManager.playClick();
		}}
		aria-label="Audio settings"
		title="Audio settings"
	>
		{#if $isMuted}
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M11 5L6 9H2v6h4l5 4V5z" />
				<line x1="23" y1="9" x2="17" y2="15" />
				<line x1="17" y1="9" x2="23" y2="15" />
			</svg>
		{:else}
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M11 5L6 9H2v6h4l5 4V5z" />
				<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
				<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
			</svg>
		{/if}
	</button>

	{#if showSettings}
		<div class="audio-settings-panel">
			<div class="panel-header">
				<h3>Audio Settings</h3>
				<button
					class="close-btn"
					onclick={() => {
						showSettings = false;
						soundManager.playClick();
					}}
					aria-label="Close audio settings"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<div class="panel-content">
				<!-- Master Controls -->
				<div class="control-group">
					<div class="control-header">
						<button
							class="mute-toggle"
							class:muted={$isMuted}
							onclick={toggleMute}
							aria-label={$isMuted ? 'Unmute' : 'Mute'}
						>
							{#if $isMuted}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M11 5L6 9H2v6h4l5 4V5z" />
									<line x1="23" y1="9" x2="17" y2="15" />
									<line x1="17" y1="9" x2="23" y2="15" />
								</svg>
								Unmute
							{:else}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M11 5L6 9H2v6h4l5 4V5z" />
								</svg>
								Mute
							{/if}
						</button>
						<span class="volume-label">{formatVolume(localMasterVolume)}</span>
					</div>

					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={localMasterVolume}
						oninput={handleMasterVolumeChange}
						disabled={$isMuted}
						class="volume-slider"
						aria-label="Master volume"
					/>
				</div>

				<hr class="divider" />

				<!-- Music Volume -->
				<div class="control-group">
					<div class="control-header">
						<div class="control-label">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M9 18V5l12-2v13" />
								<circle cx="6" cy="18" r="3" />
								<circle cx="18" cy="16" r="3" />
							</svg>
							<span>Music</span>
						</div>
						<span class="volume-label">{formatVolume(localMusicVolume)}</span>
					</div>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={localMusicVolume}
						oninput={handleMusicVolumeChange}
						disabled={$isMuted}
						class="volume-slider"
						aria-label="Music volume"
					/>
					<button
						class="test-btn"
						onclick={() => testSound('music')}
						disabled={$isMuted || isInitializing}
						title="Test music"
					>
						Test
					</button>
				</div>

				<!-- SFX Volume -->
				<div class="control-group">
					<div class="control-header">
						<div class="control-label">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M11 5L6 9H2v6h4l5 4V5z" />
								<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
							</svg>
							<span>Sound Effects</span>
						</div>
						<span class="volume-label">{formatVolume(localSfxVolume)}</span>
					</div>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={localSfxVolume}
						oninput={handleSfxVolumeChange}
						disabled={$isMuted}
						class="volume-slider"
						aria-label="Sound effects volume"
					/>
					<button
						class="test-btn"
						onclick={() => testSound('sfx')}
						disabled={$isMuted || isInitializing}
						title="Test sound effects"
					>
						Test
					</button>
				</div>

				<!-- Ambience Volume -->
				<div class="control-group">
					<div class="control-header">
						<div class="control-label">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
								<path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z" />
							</svg>
							<span>Ambience</span>
						</div>
						<span class="volume-label">{formatVolume(localAmbienceVolume)}</span>
					</div>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={localAmbienceVolume}
						oninput={handleAmbienceVolumeChange}
						disabled={$isMuted}
						class="volume-slider"
						aria-label="Ambience volume"
					/>
					<button
						class="test-btn"
						onclick={() => testSound('ambience')}
						disabled={$isMuted || isInitializing}
						title="Test ambience"
					>
						Test
					</button>
				</div>

				{#if isInitializing}
					<div class="initializing">
						<p>Initializing audio system...</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.audio-settings {
		position: relative;
		display: inline-block;
	}

	.audio-toggle-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.audio-toggle-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	.audio-toggle-btn.muted {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
	}

	.audio-settings-panel {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 320px;
		background: rgba(15, 23, 42, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		z-index: 1000;
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f1f5f9;
	}

	.panel-content {
		padding: 16px 20px;
	}

	.control-group {
		margin-bottom: 20px;
	}

	.control-group:last-child {
		margin-bottom: 0;
	}

	.control-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.mute-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		padding: 6px 12px;
		color: #f1f5f9;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.mute-toggle:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.mute-toggle.muted {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
		color: #fca5a5;
	}

	.control-label {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #cbd5e1;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.volume-label {
		color: #94a3b8;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.volume-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.1);
		outline: none;
		-webkit-appearance: none;
		margin-bottom: 8px;
	}

	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.volume-slider::-webkit-slider-thumb:hover {
		background: #60a5fa;
		transform: scale(1.1);
	}

	.volume-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	.volume-slider::-moz-range-thumb:hover {
		background: #60a5fa;
		transform: scale(1.1);
	}

	.volume-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.test-btn {
		background: rgba(59, 130, 246, 0.2);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 4px;
		padding: 4px 12px;
		color: #60a5fa;
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.2s ease;
		width: 100%;
	}

	.test-btn:hover:not(:disabled) {
		background: rgba(59, 130, 246, 0.3);
	}

	.test-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.divider {
		border: none;
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
		margin: 16px 0;
	}

	.initializing {
		text-align: center;
		padding: 12px;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 6px;
		margin-top: 16px;
	}

	.initializing p {
		margin: 0;
		color: #60a5fa;
		font-size: 0.9rem;
	}
</style>
