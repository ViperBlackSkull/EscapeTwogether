import type { Socket } from 'socket.io';
import type { Server } from 'socket.io';

interface RateBucket {
  count: number;
  resetAt: number;
}

const socketBuckets = new Map<string, Map<string, RateBucket>>();
const httpBuckets = new Map<string, RateBucket>();
const roomCreationBuckets = new Map<string, RateBucket>();

function getOrCreateBucket(buckets: Map<string, RateBucket>, key: string, windowMs: number): RateBucket {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  return bucket;
}

// --- Socket.io rate limiting ---

export const SOCKET_LIMITS = {
  messagesPerMinute: 30,
  puzzleActionsPerMinute: 10,
  windowMs: 60_000,
} as const;

function checkSocketRate(socketId: string, category: string, max: number): boolean {
  let categories = socketBuckets.get(socketId);
  if (!categories) {
    categories = new Map();
    socketBuckets.set(socketId, categories);
  }
  const bucket = getOrCreateBucket(categories, category, SOCKET_LIMITS.windowMs);
  bucket.count++;
  return bucket.count <= max;
}

export function socketRateExceeded(socketId: string, category: 'message' | 'puzzle-action'): boolean {
  const max = category === 'message'
    ? SOCKET_LIMITS.messagesPerMinute
    : SOCKET_LIMITS.puzzleActionsPerMinute;
  return !checkSocketRate(socketId, category, max);
}

export function cleanupSocketBucket(socketId: string): void {
  socketBuckets.delete(socketId);
}

// --- HTTP rate limiting ---

export const HTTP_LIMITS = {
  requestsPerMinute: 100,
  windowMs: 60_000,
} as const;

export function httpRateExceeded(ip: string): boolean {
  const bucket = getOrCreateBucket(httpBuckets, ip, HTTP_LIMITS.windowMs);
  bucket.count++;
  return bucket.count > HTTP_LIMITS.requestsPerMinute;
}

// --- Room creation rate limiting ---

export const ROOM_CREATION_LIMITS = {
  roomsPerMinute: 3,
  windowMs: 60_000,
} as const;

export function roomCreationExceeded(ip: string): boolean {
  const bucket = getOrCreateBucket(roomCreationBuckets, ip, ROOM_CREATION_LIMITS.windowMs);
  bucket.count++;
  return bucket.count > ROOM_CREATION_LIMITS.roomsPerMinute;
}

// --- Periodic cleanup of stale buckets ---

setInterval(() => {
  const now = Date.now();

  for (const [socketId, categories] of socketBuckets) {
    for (const [cat, bucket] of categories) {
      if (now >= bucket.resetAt) categories.delete(cat);
    }
    if (categories.size === 0) socketBuckets.delete(socketId);
  }

  for (const [ip, bucket] of httpBuckets) {
    if (now >= bucket.resetAt) httpBuckets.delete(ip);
  }

  for (const [ip, bucket] of roomCreationBuckets) {
    if (now >= bucket.resetAt) roomCreationBuckets.delete(ip);
  }
}, 60_000);

// --- Middleware wrappers ---

export function httpRateLimiter(req: { ip?: string; socket?: { remoteAddress?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }, next: () => void): void {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (httpRateExceeded(ip)) {
    res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
    return;
  }
  next();
}

export function setupSocketRateLimiting(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on('disconnect', () => {
      cleanupSocketBucket(socket.id);
    });
  });
}
