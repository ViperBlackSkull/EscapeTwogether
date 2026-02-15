// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// SVG module declaration for importing SVG files
declare module '*.svg' {
	const content: string;
	export default content;
}

export {};
