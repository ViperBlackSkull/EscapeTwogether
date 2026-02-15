#!/usr/bin/env python3
"""
Generate puzzle assets for EscapeTwogether using ComfyUI API.
"""

import json
import urllib.request
import urllib.parse
import time
import os
import uuid
import random

COMFYUI_URL = "http://localhost:8188"
OUTPUT_DIR = "/home/viper/Code/your-claude-engineer/generations/EscapeTwogether/static/assets/images/puzzles"
CHECKPOINT = "DreamShaper_8_pruned.safetensors"

# Puzzle asset prompts with Victorian mysterious aesthetic
ASSETS = [
    {
        "filename": "cipher-wheel.png",
        "prompt": "Victorian era antique cipher wheel decoder disk, brass and copper mechanical puzzle device, intricate engravings, mysterious symbols around the edge, ornate decorative design, dark moody atmospheric lighting, detailed steampunk aesthetic, highly detailed, painting style, 8k quality",
        "negative": "blurry, low quality, cartoon, anime, modern, bright colors"
    },
    {
        "filename": "treasure-map.png",
        "prompt": "Old weathered treasure map parchment, Victorian era antique paper, mysterious hand-drawn paths and X marks, aged edges, tea-stained, cryptic symbols and clues, dark moody atmosphere, highly detailed, vintage cartography style, dramatic lighting",
        "negative": "blurry, low quality, modern, clean, bright colors"
    },
    {
        "filename": "vintage-lock.png",
        "prompt": "Antique Victorian padlock mechanism, ornate brass lock with intricate keyhole, mysterious and detailed metalwork, aged patina, dark atmospheric lighting, steampunk aesthetic, highly detailed, dramatic shadows, painting style",
        "negative": "blurry, low quality, modern, plastic, bright colors"
    },
    {
        "filename": "antique-keys.png",
        "prompt": "Collection of antique Victorian keys, ornate brass and iron keys of various sizes, intricate decorative handles, aged patina, mysterious atmosphere, dark moody lighting, arranged on old wooden surface, highly detailed, painting style",
        "negative": "blurry, low quality, modern, shiny, bright colors"
    },
    {
        "filename": "mysterious-glyphs.png",
        "prompt": "Ancient mysterious symbols and glyphs carved in stone, occult mystical runes, Victorian esoteric engravings, arcane alphabet, dark atmospheric lighting, weathered texture, highly detailed, mysterious and ominous, painting style",
        "negative": "blurry, low quality, cartoon, modern, bright colors"
    },
    {
        "filename": "puzzle-texture.png",
        "prompt": "Victorian puzzle piece texture pattern, ornate decorative border design, antique paper texture with mysterious symbols, seamless pattern, dark moody aesthetic, aged and weathered, highly detailed, painting style",
        "negative": "blurry, low quality, modern, bright colors"
    },
    {
        "filename": "clue-letter.png",
        "prompt": "Antique Victorian letter with mysterious clue, aged parchment paper, elegant calligraphy handwriting, wax seal, folded edges, dark atmospheric lighting, mysterious atmosphere, highly detailed, vintage document style",
        "negative": "blurry, low quality, modern, clean paper, bright colors"
    },
    {
        "filename": "clue-note.png",
        "prompt": "Torn old note with cryptic message, Victorian era paper fragment, handwritten mysterious text, aged and weathered edges, dark moody atmosphere, ink stains, highly detailed, dramatic lighting, vintage style",
        "negative": "blurry, low quality, modern, clean, bright colors"
    },
    {
        "filename": "clue-photograph.png",
        "prompt": "Antique Victorian photograph sepia tone, mysterious old portrait, daguerreotype style, ornate decorative frame, aged and faded, dark atmospheric, mysterious Victorian aesthetic, highly detailed, vintage photography",
        "negative": "blurry, low quality, modern photo, color, bright"
    },
    {
        "filename": "victorian-ornament.png",
        "prompt": "Victorian era decorative ornament frame, ornate baroque scrollwork design, antique gold and bronze, intricate floral patterns, dark atmospheric lighting, mysterious gothic aesthetic, highly detailed, elegant and dramatic",
        "negative": "blurry, low quality, modern, simple, bright colors"
    },
    {
        "filename": "candle-holder.png",
        "prompt": "Antique Victorian candelabra brass candle holder, ornate decorative metalwork, flickering candlelight, dark moody atmosphere, mysterious shadows, dramatic lighting, highly detailed, gothic aesthetic, painting style",
        "negative": "blurry, low quality, modern, electric light, bright"
    },
    {
        "filename": "magnifying-glass.png",
        "prompt": "Antique Victorian magnifying glass detective tool, ornate brass handle with intricate engravings, round glass lens, dark atmospheric lighting, mysterious detective aesthetic, highly detailed, vintage style, dramatic shadows",
        "negative": "blurry, low quality, modern, plastic, bright colors"
    },
    {
        "filename": "secret-compartment.png",
        "prompt": "Victorian secret compartment in antique wooden furniture, hidden drawer mechanism, mysterious dark interior, ornate carved wood, dramatic lighting, hidden treasure aesthetic, highly detailed, atmospheric, painting style",
        "negative": "blurry, low quality, modern, bright colors, simple"
    },
    {
        "filename": "hourglass.png",
        "prompt": "Antique Victorian hourglass sand timer, ornate brass and glass construction, flowing sand, dark moody atmosphere, mysterious time running out aesthetic, dramatic lighting, highly detailed, vintage steampunk style",
        "negative": "blurry, low quality, modern, plastic, bright colors"
    },
    {
        "filename": "codebook.png",
        "prompt": "Ancient Victorian codebook cipher manual, leather-bound antique book, mysterious symbols and codes written inside, aged pages, ornate cover design, dark atmospheric lighting, highly detailed, vintage occult aesthetic",
        "negative": "blurry, low quality, modern, paperback, bright colors"
    },
    {
        "filename": "compass.png",
        "prompt": "Antique Victorian brass compass, ornate navigational instrument, intricate engravings, mysterious glowing needle, dark atmospheric lighting, adventure aesthetic, highly detailed, vintage steampunk style, dramatic shadows",
        "negative": "blurry, low quality, modern, plastic, digital, bright"
    }
]


def create_workflow(prompt: str, negative_prompt: str, seed: int = None) -> dict:
    """Create a ComfyUI workflow for image generation."""
    if seed is None:
        seed = random.randint(1, 999999999)

    workflow = {
        "3": {
            "inputs": {
                "seed": seed,
                "steps": 25,
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
                "width": 512,
                "height": 512,
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
                "filename_prefix": "puzzle_asset",
                "images": ["8", 0]
            },
            "class_type": "SaveImage"
        }
    }
    return workflow


def queue_prompt(workflow: dict) -> str:
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

    # Create workflow
    workflow = create_workflow(asset['prompt'], asset['negative'])

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
    """Generate all puzzle assets."""
    print("=" * 60)
    print("EscapeTwogether - Puzzle Asset Generator")
    print("=" * 60)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Checkpoint: {CHECKPOINT}")
    print(f"Total assets to generate: {len(ASSETS)}")

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate each asset
    successful = 0
    failed = 0

    for i, asset in enumerate(ASSETS):
        if generate_asset(asset, i, len(ASSETS)):
            successful += 1
        else:
            failed += 1

        # Small delay between generations
        if i < len(ASSETS) - 1:
            time.sleep(1)

    print("\n" + "=" * 60)
    print("Generation Complete!")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    import sys
    sys.exit(0 if main() else 1)
