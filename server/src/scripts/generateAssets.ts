import { preGenerateAssets } from '../services/assetPipeline.js';
import { isComfyuiAvailable, getComfyuiUrl } from '../services/imageService.js';

function log(message: string): void {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${message}`);
}

async function main(): Promise<void> {
  log('=== EscapeTwogether Asset Pre-Generation ===');
  log(`ComfyUI URL: ${getComfyuiUrl()}`);

  log('Checking ComfyUI availability...');
  const available = await isComfyuiAvailable();

  if (!available) {
    log('ERROR: ComfyUI is not reachable. Make sure it is running.');
    process.exit(1);
  }

  log('ComfyUI is available. Starting asset generation...\n');

  const result = await preGenerateAssets(log);

  log('\n=== Generation Summary ===');
  log(`Total assets:  ${result.total}`);
  log(`Succeeded:     ${result.succeeded}`);
  log(`Skipped:       ${result.skipped}`);
  log(`Failed:        ${result.failed}`);

  if (result.errors.length > 0) {
    log('\nErrors:');
    for (const error of result.errors) {
      log(`  - ${error}`);
    }
  }

  if (result.failed > 0) {
    log('\nSome assets failed to generate. Check errors above.');
    process.exit(1);
  }

  log('\nAll assets generated successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
