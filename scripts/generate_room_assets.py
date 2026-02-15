#!/usr/bin/env python3
"""
Generate immersive room backgrounds, puzzle assets, UI elements, and particle effects
for EscapeTwogether using ComfyUI API.

Generates:
- 3 Room backgrounds (1920x1080, atmospheric Victorian)
- Additional puzzle-specific assets
- UI elements (victory, defeat, loading, etc.)
- Particle effect sprites
"""

import json
import urllib.request
import urllib.parse
import time
import os
import uuid
import random

COMFYUI_URL = "http://localhost:8188"
OUTPUT_DIR = "/home/viper/Code/your-claude-engineer/generations/EscapeTwogether/static/assets/images"
CHECKPOINT = "DreamShaper_8_pruned.safetensors"

# Room backgrounds (1920x1080, high resolution)
ROOM_BACKGROUNDS = [
    {
        "filename": "room-backgrounds/room1-attic.png",
        "prompt": "Victorian attic escape room background, dusty forgotten attic space with antique trunk, torn photographs scattered, old candle holders, mysterious boxes and chests, warm candlelight glow through dust motes, dark moody atmospheric, forgotten treasures, highly detailed, painting style, cinematic lighting, 8k quality, wide angle view",
        "negative": "blurry, low quality, modern, bright lights, clean, organized",
        "width": 1920,
        "height": 1080,
        "steps": 30
    },
    {
        "filename": "room-backgrounds/room2-clock-tower.png",
        "prompt": "Victorian clock tower interior escape room background, massive brass gears and clockwork mechanisms, golden warm light filtering through clock face, intricate machinery, telegraph apparatus, brass pipes and pressure gauges, steampunk aesthetic, dark moody atmospheric, highly detailed, painting style, cinematic lighting, 8k quality, wide angle view",
        "negative": "blurry, low quality, modern, digital, clean, simple",
        "width": 1920,
        "height": 1080,
        "steps": 30
    },
    {
        "filename": "room-backgrounds/room3-garden-conservatory.png",
        "prompt": "Victorian garden conservatory escape room background, glass roof with ethereal green light filtering through, exotic plants and botanical specimens, antique botanical illustrations on walls, mysterious hybrid flowers, brass plant containers, vine-covered trellis, atmospheric mysterious, highly detailed, painting style, cinematic lighting, 8k quality, wide angle view",
        "negative": "blurry, low quality, modern greenhouse, bright daylight, simple",
        "width": 1920,
        "height": 1080,
        "steps": 30
    }
]

# Additional puzzle-specific assets
PUZZLE_ASSETS = [
    {
        "filename": "puzzles/music-box.png",
        "prompt": "Victorian music box puzzle mechanism, ornate brass cylinder with pins, intricate gear mechanism, decorative wooden box with carved lid, mysterious musical notes visualized, dark moody atmospheric, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, plastic, bright"
    },
    {
        "filename": "puzzles/mirror-reflection.png",
        "prompt": "Victorian ornate mirror with mysterious reflection, antique gilded frame with intricate scrollwork, dark atmospheric room reflected, mysterious supernatural glow, cracked mirror effect, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern mirror, bright, clean"
    },
    {
        "filename": "puzzles/treasure-chest.png",
        "prompt": "Victorian treasure chest or strongbox, ornate brass fittings and lock, aged wood with carved details, mysterious glow from within, dark atmospheric, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, plastic, bright"
    },
    {
        "filename": "puzzles/cryptex.png",
        "prompt": "Victorian cryptex cylinder puzzle, brass rotating rings with letters, intricate mechanical puzzle device, mysterious and ornate, dark atmospheric lighting, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, plastic, bright"
    },
    {
        "filename": "puzzles/mysterious-painting.png",
        "prompt": "Victorian oil painting in ornate frame, mysterious portrait with hidden clues, dark moody atmosphere, aged canvas texture, supernatural elements, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern art, bright, photograph"
    },
    {
        "filename": "puzzles/pendulum.png",
        "prompt": "Victorian pendulum mechanism, ornate brass pendulum bob and rod, intricate clockwork, dark atmospheric lighting, mysterious time aesthetic, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright"
    },
    {
        "filename": "puzzles/bell-collection.png",
        "prompt": "Collection of Victorian brass bells of various sizes, ornate decorative bells, mysterious sound visualization, dark atmospheric lighting, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright"
    },
    {
        "filename": "puzzles/botanical-hybrid.png",
        "prompt": "Victorian botanical illustration of mysterious hybrid plant, scientific drawing style, exotic flower with unusual features, aged paper background, highly detailed, botanical art style, 8k quality",
        "negative": "blurry, low quality, cartoon, modern, bright"
    },
    {
        "filename": "puzzles/seed-packets.png",
        "prompt": "Collection of Victorian seed packets, antique paper packets with botanical illustrations, mysterious plant names, aged and weathered, dark atmospheric, highly detailed, vintage style, 8k quality",
        "negative": "blurry, low quality, modern, clean, bright"
    },
    {
        "filename": "puzzles/glass-vials.png",
        "prompt": "Collection of Victorian glass vials and potions, mysterious colored liquids, ornate brass stoppers, dark atmospheric lighting, alchemical aesthetic, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, plastic, bright"
    }
]

# UI elements
UI_ASSETS = [
    {
        "filename": "ui/victory-screen.png",
        "prompt": "Victorian victory celebration screen, ornate golden frame with Congratulations text visualized, warm golden light, confetti and celebration elements, elegant decorative borders, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright flat colors"
    },
    {
        "filename": "ui/defeat-screen.png",
        "prompt": "Victorian defeat or game over screen, dark moody atmosphere, ornate frame with mysterious elements, fading light, dramatic shadows, mysterious aesthetic, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, bright, cartoon"
    },
    {
        "filename": "ui/loading-screen.png",
        "prompt": "Victorian loading screen background, ornate decorative frame, mysterious clockwork or gears turning, atmospheric fog effects, mysterious aesthetic, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright"
    },
    {
        "filename": "ui/puzzle-frame.png",
        "prompt": "Victorian ornate puzzle frame, decorative border with baroque scrollwork, gold and bronze colors, intricate design, dark background, highly detailed, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright"
    },
    {
        "filename": "ui/dialog-box.png",
        "prompt": "Victorian dialog box background, aged parchment texture, ornate decorative border, elegant and mysterious, dark atmospheric, highly detailed, 8k quality",
        "negative": "blurry, low quality, modern, clean, bright"
    },
    {
        "filename": "ui/inventory-slot.png",
        "prompt": "Victorian inventory slot background, ornate decorative frame, antique aged texture, mysterious aesthetic, dark atmospheric, highly detailed, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright"
    },
    {
        "filename": "ui/hint-icon.png",
        "prompt": "Victorian hint icon or question mark, ornate decorative design, brass or gold, mysterious lightbulb visual, dark atmospheric, highly detailed, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright"
    },
    {
        "filename": "ui/settings-icon.png",
        "prompt": "Victorian settings or gear icon, ornate decorative gear design, brass or gold, mechanical aesthetic, dark atmospheric, highly detailed, 8k quality",
        "negative": "blurry, low quality, modern, simple, bright"
    }
]

# Particle effect sprites (transparent backgrounds for overlay)
PARTICLE_ASSETS = [
    {
        "filename": "particles/dust-motes.png",
        "prompt": "Victorian dust motes particle effect, floating dust particles in light beam, atmospheric fog, golden warm light, semi-transparent, highly detailed, on dark background for extraction, 8k quality",
        "negative": "blurry, low quality, solid objects, bright flat background"
    },
    {
        "filename": "particles/candle-glow.png",
        "prompt": "Victorian candlelight glow particle effect, warm golden light rays, flickering flame visualization, atmospheric lighting, semi-transparent, highly detailed, on dark background for extraction, 8k quality",
        "negative": "blurry, low quality, electric light, solid objects"
    },
    {
        "filename": "particles/magic-sparkles.png",
        "prompt": "Victorian mysterious magic sparkles particle effect, golden glowing particles, supernatural aesthetic, ethereal and mysterious, semi-transparent, highly detailed, on dark background for extraction, 8k quality",
        "negative": "blurry, low quality, cartoon, modern, solid objects"
    },
    {
        "filename": "particles/smoke-effect.png",
        "prompt": "Victorian smoke or fog particle effect, atmospheric swirling smoke, mysterious fog, dark moody, semi-transparent, highly detailed, on dark background for extraction, 8k quality",
        "negative": "blurry, low quality, cartoon, solid objects, bright"
    },
    {
        "filename": "particles/leaves-particles.png",
        "prompt": "Victorian garden leaves particle effect, falling autumn leaves, botanical aesthetic, dark atmospheric, semi-transparent, highly detailed, on dark background for extraction, 8k quality",
        "negative": "blurry, low quality, cartoon, modern, solid objects"
    },
    {
        "filename": "particles/clockwork-gears.png",
        "prompt": "Victorian clockwork gears particle effect, small gear silhouettes, mechanical aesthetic, brass and gold colors, semi-transparent, highly detailed, on dark background for extraction, 8k quality",
        "negative": "blurry, low quality, cartoon, modern, solid objects"
    }
]

# Combined all assets
ALL_ASSETS = ROOM_BACKGROUNDS + PUZZLE_ASSETS + UI_ASSETS + PARTICLE_ASSETS


def create_workflow(prompt: str, negative_prompt: str, width: int = 512, height: int = 512, steps: int = 25, seed: int = None) -> dict:
    """Create a ComfyUI workflow for image generation."""
    if seed is None:
        seed = random.randint(1, 999999999)

    workflow = {
        "3": {
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": 7.5,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "4": {
            "inputs": {
                "ckpt_name": CHECKPOINT
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "5": {
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "6": {
            "inputs": {
                "text": prompt,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "7": {
            "inputs": {
                "text": negative_prompt,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "8": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            },
            "class_type": "VAEDecode"
        },
        "9": {
            "inputs": {
                "filename_prefix": "asset",
                "images": ["8", 0]
            },
            "class_type": "SaveImage"
        }
    }
    return workflow


def queue_prompt(workflow: dict) -> tuple:
    """Queue a prompt and return the prompt ID."""
    client_id = str(uuid.uuid4())
    data = {
        "prompt": workflow,
        "client_id": client_id
    }

    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        return result.get('prompt_id'), client_id


def wait_for_completion(prompt_id: str, client_id: str, timeout: int = 300) -> bool:
    """Wait for the prompt to complete."""
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")
            with urllib.request.urlopen(req) as response:
                history = json.loads(response.read())

                if prompt_id in history:
                    return True

        except Exception as e:
            print(f"Error checking status: {e}")

        time.sleep(2)

    return False


def get_output_images(prompt_id: str) -> list:
    """Get the output images from a completed prompt."""
    req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")

    with urllib.request.urlopen(req) as response:
        history = json.loads(response.read())

        if prompt_id in history:
            outputs = history[prompt_id].get('outputs', {})
            images = []

            for node_id, output in outputs.items():
                if 'images' in output:
                    for image_info in output['images']:
                        images.append({
                            'filename': image_info['filename'],
                            'subfolder': image_info.get('subfolder', ''),
                            'type': image_info.get('type', 'output')
                        })

            return images

    return []


def download_image(image_info: dict, output_path: str) -> bool:
    """Download an image from ComfyUI."""
    params = urllib.parse.urlencode({
        'filename': image_info['filename'],
        'subfolder': image_info['subfolder'],
        'type': image_info['type']
    })

    url = f"{COMFYUI_URL}/view?{params}"

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            image_data = response.read()

            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(image_data)

        return True
    except Exception as e:
        print(f"Error downloading image: {e}")
        return False


def generate_asset(asset: dict, index: int, total: int) -> bool:
    """Generate a single asset."""
    print(f"\n[{index + 1}/{total}] Generating: {asset['filename']}")
    print(f"  Prompt: {asset['prompt'][:80]}...")

    # Get parameters
    width = asset.get('width', 512)
    height = asset.get('height', 512)
    steps = asset.get('steps', 25)

    # Create workflow
    workflow = create_workflow(asset['prompt'], asset['negative'], width, height, steps)

    # Queue prompt
    try:
        prompt_id, client_id = queue_prompt(workflow)
        print(f"  Queued with ID: {prompt_id}")
    except Exception as e:
        print(f"  Error queueing prompt: {e}")
        return False

    # Wait for completion
    print("  Waiting for completion...")
    if not wait_for_completion(prompt_id, client_id):
        print("  Timeout waiting for completion")
        return False

    # Get output images
    images = get_output_images(prompt_id)
    if not images:
        print("  No images generated")
        return False

    # Download image
    output_path = os.path.join(OUTPUT_DIR, asset['filename'])
    if download_image(images[0], output_path):
        print(f"  Saved to: {output_path}")
        return True
    else:
        print("  Failed to download image")
        return False


def main():
    """Generate all assets."""
    print("=" * 70)
    print("EscapeTwogether - Comprehensive Asset Generator")
    print("=" * 70)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Checkpoint: {CHECKPOINT}")
    print(f"\nGenerating:")
    print(f"  - {len(ROOM_BACKGROUNDS)} Room backgrounds (1920x1080)")
    print(f"  - {len(PUZZLE_ASSETS)} Puzzle-specific assets")
    print(f"  - {len(UI_ASSETS)} UI elements")
    print(f"  - {len(PARTICLE_ASSETS)} Particle effect sprites")
    print(f"  Total: {len(ALL_ASSETS)} assets")
    print("=" * 70)

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate each asset
    successful = 0
    failed = 0

    for i, asset in enumerate(ALL_ASSETS):
        if generate_asset(asset, i, len(ALL_ASSETS)):
            successful += 1
        else:
            failed += 1

        # Small delay between generations
        if i < len(ALL_ASSETS) - 1:
            time.sleep(1)

    print("\n" + "=" * 70)
    print("Generation Complete!")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print("=" * 70)

    return failed == 0


if __name__ == "__main__":
    import sys
    sys.exit(0 if main() else 1)
