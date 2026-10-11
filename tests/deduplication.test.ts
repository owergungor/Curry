import test from 'node:test';
import assert from 'node:assert/strict';
import { createErrorFingerprint, mapTechnicalError } from '../src/lib/errors/mapper.ts';

test('createErrorFingerprint produces identical fingerprints for identical errors', () => {
  const fp1 = createErrorFingerprint('STORAGE_BUSY', 'storage', 'database is locked: busy timeout');
  const fp2 = createErrorFingerprint('STORAGE_BUSY', 'storage', 'database is locked: busy timeout');

  assert.equal(fp1, fp2);
  assert.match(fp1, /^storage:STORAGE_BUSY:/);
});

test('createErrorFingerprint normalizes minor punctuation differences', () => {
  const fp1 = createErrorFingerprint('NETWORK_TIMEOUT', 'network', 'connection timed out (HTTP 504)');
  const fp2 = createErrorFingerprint('NETWORK_TIMEOUT', 'network', 'connection timed out... http 504');

  assert.equal(fp1, fp2);
});

test('deduplication logic suppresses rapid repeated errors within window', () => {
  const recentFingerprints = new Map<string, number>();
  const deduplicationWindowMs = 3500;

  function shouldDisplayError(rawErr: string): boolean {
    const error = mapTechnicalError(rawErr);
    const now = Date.now();
    const lastSeen = recentFingerprints.get(error.fingerprint);
    if (lastSeen && now - lastSeen < deduplicationWindowMs) {
      recentFingerprints.set(error.fingerprint, now);
      return false; // Suppress duplicate notification
    }
    recentFingerprints.set(error.fingerprint, now);
    return true; // Display first occurrence
  }

  const firstOccurrence = shouldDisplayError('Access is denied when saving config');
  assert.equal(firstOccurrence, true);

  const immediateRepeat = shouldDisplayError('Access is denied when saving config');
  assert.equal(immediateRepeat, false);

  const differentError = shouldDisplayError('database is locked: sqlite busy');
  assert.equal(differentError, true);
});
