<script lang="ts">
	let count = 0;

	function increment() {
		count += 1;
	}
</script>

<main>
	<h1>EscapeTwogether</h1>
	<p>A cooperative puzzle escape game built with SvelteKit</p>

	<div class="counter">
		<p>Count: {count}</p>
		<button on:click={increment}>Increment</button>
	</div>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		font-size: 2.5rem;
		color: #ff3e00;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.2rem;
		color: #666;
		margin-bottom: 2rem;
	}

	.counter {
		background: #f4f4f4;
		padding: 2rem;
		border-radius: 8px;
		display: inline-block;
	}

	button {
		background: #ff3e00;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 1rem;
	}

	button:hover {
		background: #e63900;
	}
</style>
