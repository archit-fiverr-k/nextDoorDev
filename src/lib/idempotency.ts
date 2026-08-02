/**
 * NextDoorClinic — Idempotency Key Manager
 * Prevents duplicate booking creation and redundant financial transactions
 * caused by double-clicking or network retries.
 */

interface CachedIdempotencyRecord {
  result: any;
  createdAt: number;
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
const idempotencyStore = new Map<string, CachedIdempotencyRecord>();

export function getCachedIdempotencyResult<T>(key: string): T | null {
  if (!key) return null;
  const record = idempotencyStore.get(key);
  if (!record) return null;

  // Check TTL
  if (Date.now() - record.createdAt > IDEMPOTENCY_TTL_MS) {
    idempotencyStore.delete(key);
    return null;
  }

  return record.result as T;
}

export function setCachedIdempotencyResult<T>(key: string, result: T): void {
  if (!key) return;
  idempotencyStore.set(key, {
    result,
    createdAt: Date.now(),
  });
}
