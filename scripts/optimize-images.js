#!/usr/bin/env node

/**
 * Image optimization script for production
 * Converts images to WebP and generates responsive sizes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGE_DIRS = [
	'static/assets/images/puzzles',
	'static/assets/images/rooms'
];

const SIZES = [320, 640, 960, 1280, 1920];

function optimizeImages() {
	console.log('🖼️  Starting image optimization...');

	IMAGE_DIRS.forEach(dir => {
		if (!fs.existsSync(dir)) {
			console.log(`⚠️  Directory ${dir} does not exist, skipping...`);
			return;
		}

		const files = fs.readdirSync(dir);
		const images = files.filter(f => /\.(png|jpe?g)$/i.test(f));

		console.log(`\n📁 Processing ${dir}: ${images.length} images found`);

		images.forEach(file => {
			const filePath = path.join(dir, file);
			const ext = path.extname(file);
			const name = path.basename(file, ext);

			console.log(`  Processing ${file}...`);

			try {
				// Convert to WebP
				const webpPath = path.join(dir, `${name}.webp`);
				execSync(`cwebp -q 85 "${filePath}" -o "${webpPath}"`, {
					stdio: 'ignore'
				});

				// Generate responsive sizes (if image is large enough)
				const stats = fs.statSync(filePath);
				if (stats.size > 100 * 1024) { // Only process images > 100KB
					SIZES.forEach(size => {
						const sizedPath = path.join(dir, `${name}-${size}.webp`);
						execSync(`cwebp -q 85 -resize ${size} 0 "${filePath}" -o "${sizedPath}"`, {
							stdio: 'ignore'
						});
					});
				}

				console.log(`  ✅ Optimized ${file}`);
			} catch (error) {
				console.error(`  ❌ Failed to optimize ${file}:`, error.message);
			}
		});
	});

	console.log('\n✨ Image optimization complete!');
}

// Run if called directly
if (require.main === module) {
	optimizeImages();
}

module.exports = { optimizeImages };
