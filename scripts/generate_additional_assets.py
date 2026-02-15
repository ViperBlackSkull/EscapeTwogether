#!/usr/bin/env python3
"""
Generate additional puzzle assets for EscapeTwogether using ComfyUI API.
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

# Additional puzzle assets
ADDITIONAL_ASSETS = [
    {
        "filename": "clock-hands.png",
        "prompt": "Victorian ornate clock hands, antique brass hour and minute hands for clock face, intricate decorative filigree design, steampunk aesthetic, dark moody atmospheric lighting, elegant baroque style, highly detailed, isolated on dark background, painting style",
        "negative": "blurry, low quality, modern, digital, bright colors, cartoon"
    },
    {
        "filename": "gears-collection.png",
        "prompt": "Collection of Victorian steampunk gears and cogs, brass and copper mechanical parts, various sizes of interlocking gear wheels, intricate tooth details, aged metal patina, dark atmospheric lighting, mechanical aesthetic, highly detailed, painting style",
        "negative": "blurry, low quality, modern, plastic, bright colors, clean"
    },
    {
        "filename": "telegraph-key.png",
        "prompt": "Antique Victorian telegraph key Morse code transmitter, brass telegraph tapping key on wooden base, vintage communication device, intricate mechanical details, dark moody atmospheric lighting, steampunk aesthetic, highly detailed, painting style",
        "negative": "blurry, low quality, modern, electronic, bright colors"
    },
    {
        "filename": "botanical-illustration.png",
        "prompt": "Victorian botanical illustration vintage style, scientific plant drawing with flowers and leaves, antique naturalist field guide aesthetic, sepia tones and muted colors, detailed botanical artwork, aged paper background, dark atmospheric, highly detailed",
        "negative": "blurry, low quality, modern, bright colors, photograph"
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
    """Generate additional puzzle assets."""
    print("=" * 60)
    print("EscapeTwogether - Additional Puzzle Asset Generator")
    print("=" * 60)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Checkpoint: {CHECKPOINT}")
    print(f"Total assets to generate: {len(ADDITIONAL_ASSETS)}")

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate each asset
    successful = 0
    failed = 0

    for i, asset in enumerate(ADDITIONAL_ASSETS):
        if generate_asset(asset, i, len(ADDITIONAL_ASSETS)):
            successful += 1
        else:
            failed += 1

        # Small delay between generations
        if i < len(ADDITIONAL_ASSETS) - 1:
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
