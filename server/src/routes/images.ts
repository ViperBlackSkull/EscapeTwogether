import { Router, type Request, type Response } from 'express';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { getGeneratedDir } from '../services/imageService.js';

const imagesRouter = Router();

const CACHE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days — generated assets rarely change

imagesRouter.get('/:filename', async (req: Request, res: Response) => {
  const raw = req.params['filename'];
  const filename = Array.isArray(raw) ? raw[0] : raw;
  if (!filename) {
    res.status(400).json({ error: 'Filename required' });
    return;
  }

  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const filePath = join(getGeneratedDir(), filename);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);

    const data = await readFile(filePath);
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType =
      ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', data.length);
    res.send(data);
  } catch {
    res.status(404).json({ error: 'Image not found' });
  }
});

export default imagesRouter;
