import test from 'node:test';
import assert from 'node:assert/strict';
import {
  redactSensitiveString,
  sanitizeContext,
  sanitizeDiagnostics,
  formatDiagnosticsForExport,
} from '../src/lib/errors/sanitizer.ts';

test('redactSensitiveString masks GitHub personal access tokens', () => {
  const input = 'Error connecting to git with token ghp_ABC1234567890abcdefghijklmnopqrstuvwxyz';
  const redacted = redactSensitiveString(input);
  assert.doesNotMatch(redacted, /ghp_ABC/);
  assert.match(redacted, /\[REDACTED_TOKEN\]/);
});

test('redactSensitiveString masks Bearer tokens', () => {
  const input = 'Authorization failed for Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
  const redacted = redactSensitiveString(input);
  assert.doesNotMatch(redacted, /eyJhbGci/);
  assert.match(redacted, /Bearer \[REDACTED_TOKEN\]/);
});

test('redactSensitiveString masks passwords and secrets in key-value pairs', () => {
  const input = 'Failed: password=SuperSecretPassword123 and secret: "MyVerySecretKey"';
  const redacted = redactSensitiveString(input);
  assert.doesNotMatch(redacted, /SuperSecretPassword123/);
  assert.doesNotMatch(redacted, /MyVerySecretKey/);
  assert.match(redacted, /password=\[REDACTED\]/);
  assert.match(redacted, /secret: \[REDACTED\]/);
});

test('redactSensitiveString masks Windows and macOS user home directory paths', () => {
  const winPath = 'Failed to load file at C:\\Users\\omer\\AppData\\Local\\Curry\\data.db';
  const macPath = 'Failed to load file at /Users/omer/Library/Application Support/Curry/data.db';

  const redactedWin = redactSensitiveString(winPath);
  assert.doesNotMatch(redactedWin, /\\Users\\omer\\/);
  assert.match(redactedWin, /\\Users\\<redacted-user>\\/);

  const redactedMac = redactSensitiveString(macPath);
  assert.doesNotMatch(redactedMac, /\/Users\/omer\//);
  assert.match(redactedMac, /\/Users\/<redacted-user>\//);
});

test('redactSensitiveString truncates excessively large base64 or binary chunks', () => {
  const largeBlob = 'a'.repeat(250);
  const input = `Payload received: ${largeBlob}`;
  const redacted = redactSensitiveString(input);
  assert.doesNotMatch(redacted, /a{250}/);
  assert.match(redacted, /\[TRUNCATED_BINARY_DATA\]/);
});

test('sanitizeContext recursively redacts sensitive fields in objects and arrays', () => {
  const context = {
    apiKey: 'secret-key-12345',
    token: 'tok-abcde',
    userDirectory: 'C:\\Users\\admin\\Desktop',
    nested: {
      password: 'password123',
      normalField: 'all-clear',
      list: ['/Users/dev/project', 'safe-string'],
    },
  };

  const sanitized = sanitizeContext(context) as Record<string, any>;
  assert.equal(sanitized.apiKey, '[REDACTED]');
  assert.equal(sanitized.token, '[REDACTED]');
  assert.match(sanitized.userDirectory, /<redacted-user>/);
  assert.equal(sanitized.nested.password, '[REDACTED]');
  assert.equal(sanitized.nested.normalField, 'all-clear');
  assert.match(sanitized.nested.list[0], /<redacted-user>/);
  assert.equal(sanitized.nested.list[1], 'safe-string');
});

test('sanitizeDiagnostics produces sanitized diagnostic structure', () => {
  const diag = sanitizeDiagnostics(
    'C:\\Users\\developer\\config.json: access denied with token ghp_SECRET',
    { token: 'secret-123' },
    ['Failed to open', 'Retrying']
  );

  assert.ok(diag.timestamp);
  assert.match(diag.technicalDetails || '', /<redacted-user>/);
  assert.match(diag.technicalDetails || '', /\[REDACTED_TOKEN\]/);
  assert.equal((diag.context as any).token, '[REDACTED]');
  assert.deepEqual(diag.breadcrumbs, ['Failed to open', 'Retrying']);
});

test('formatDiagnosticsForExport outputs clean text report without secrets', () => {
  const diag = sanitizeDiagnostics(
    'Failed to bind socket for token ghp_9876543210zyxwvutsrqponmlkjihgfedcba',
    { port: 8080 }
  );

  const formatted = formatDiagnosticsForExport(diag);
  assert.match(formatted, /=== Curry Diagnostic Report ===/);
  assert.match(formatted, /App Version: unknown/);
  assert.doesNotMatch(formatted, /ghp_9876543210/);
  assert.match(formatted, /\[REDACTED_TOKEN\]/);
  assert.match(formatted, /"port": 8080/);
});

test('formatDiagnosticsForExport includes provided appVersion when available', () => {
  const diag = {
    ...sanitizeDiagnostics('Connection failed'),
    appVersion: '2.0.0',
  };

  const formatted = formatDiagnosticsForExport(diag);
  assert.match(formatted, /=== Curry Diagnostic Report ===/);
  assert.match(formatted, /App Version: 2\.0\.0/);
});
