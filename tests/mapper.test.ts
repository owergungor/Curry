import test from 'node:test';
import assert from 'node:assert/strict';
import { mapTechnicalError } from '../src/lib/errors/mapper.ts';

test('mapTechnicalError maps database locked errors into user-friendly message', () => {
  const error = mapTechnicalError('database is locked: sqlite busy timeout');

  assert.equal(error.code, 'STORAGE_BUSY');
  assert.equal(error.category, 'storage');
  assert.equal(error.severity, 'warning');
  assert.equal(error.title, 'Storage Busy');
  assert.equal(error.message, 'The local database is temporarily busy. Curry will retry the operation automatically.');
  assert.ok(error.suggestion);
  assert.ok(error.actions.some((a) => a.type === 'retry'));
});

test('mapTechnicalError maps disk full storage errors into clear actionable message', () => {
  const error = mapTechnicalError('disk full or no space left on device');

  assert.equal(error.code, 'STORAGE_FULL');
  assert.equal(error.category, 'storage');
  assert.equal(error.severity, 'error');
  assert.equal(error.title, 'Storage Full');
  assert.match(error.message, /not enough disk space/);
  assert.match(error.suggestion || '', /Free up disk space/);
});

test('mapTechnicalError maps permission denied errors with settings guidance', () => {
  const error = mapTechnicalError('os error 5: Access is denied when opening config.json');

  assert.equal(error.code, 'STORAGE_PERMISSION_DENIED');
  assert.equal(error.category, 'storage');
  assert.equal(error.severity, 'error');
  assert.equal(error.title, 'Permission Denied');
  assert.match(error.message, /does not have permission/);
  assert.ok(error.actions.some((a) => a.type === 'settings'));
});

test('mapTechnicalError maps audio device errors safely', () => {
  const error = mapTechnicalError('audio device unavailable: failed to initialize output stream');

  assert.equal(error.code, 'MEDIA_AUDIO_DEVICE_ERROR');
  assert.equal(error.category, 'media');
  assert.equal(error.severity, 'warning');
  assert.equal(error.title, 'Audio Output Unavailable');
  assert.match(error.message, /cannot access the audio device/);
});

test('mapTechnicalError maps notification permission errors into plain guidance', () => {
  const error = mapTechnicalError('notification permission disabled in system settings');

  assert.equal(error.code, 'NOTIFICATION_PERMISSION_DENIED');
  assert.equal(error.category, 'system');
  assert.equal(error.severity, 'warning');
  assert.equal(error.title, 'Notifications Disabled');
  assert.match(error.message, /system notifications are disabled/);
  assert.ok(error.actions.some((a) => a.type === 'settings'));
});

test('mapTechnicalError maps network update check timeouts', () => {
  const error = mapTechnicalError('failed to fetch release manifest: connection timed out');

  assert.equal(error.code, 'NETWORK_TIMEOUT');
  assert.equal(error.category, 'network');
  assert.equal(error.severity, 'warning');
  assert.equal(error.title, 'Connection Timed Out');
  assert.ok(error.actions.some((a) => a.type === 'retry'));
});

test('mapTechnicalError maps multi-monitor bounds errors', () => {
  const error = mapTechnicalError('invalid monitor coordinates: display bounds out of range');

  assert.equal(error.code, 'WINDOW_DISPLAY_NOT_FOUND');
  assert.equal(error.category, 'window');
  assert.equal(error.severity, 'warning');
  assert.equal(error.title, 'Display Configuration Changed');
});

test('mapTechnicalError redacts sensitive paths in diagnostic details of mapped errors', () => {
  const error = mapTechnicalError('Cannot open C:\\Users\\johndoe\\sensitive\\config.json');

  assert.doesNotMatch(error.diagnostics.technicalDetails || '', /\\Users\\johndoe\\/);
  assert.match(error.diagnostics.technicalDetails || '', /<redacted-user>/);
});

test('mapTechnicalError provides safe fallback for unknown technical exceptions', () => {
  const error = mapTechnicalError(new Error('InternalPanicException at 0xdeadbeef: null pointer dereference in module X'));

  assert.equal(error.code, 'UNKNOWN_ERROR');
  assert.equal(error.category, 'general');
  assert.equal(error.severity, 'error');
  assert.equal(error.title, 'Unexpected Error');
  assert.equal(error.message, 'An unexpected error occurred while processing your request.');
  // The raw panic is hidden from the user-facing message but preserved in sanitized diagnostics
  assert.doesNotMatch(error.message, /0xdeadbeef/);
  assert.match(error.diagnostics.technicalDetails || '', /0xdeadbeef/);
});

test('mapTechnicalError populates appVersion with 2.7.1 by default or custom appVersion', () => {
  const errorDefault = mapTechnicalError('some generic error');
  assert.equal(errorDefault.diagnostics.appVersion, '2.7.1');

  const errorCustom = mapTechnicalError({
    message: 'some custom error',
    appVersion: '2.8',
  });
  assert.equal(errorCustom.diagnostics.appVersion, '2.8');
});
