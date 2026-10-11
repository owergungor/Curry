/**
 * Sanitizer and Sensitive Data Redaction Layer
 * Ensures sensitive information (file contents, clipboard strings, credentials,
 * tokens, user profile names, and secrets) are never leaked in user diagnostics or logs.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /credential/i,
  /auth/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /bearer/i,
  /clipboard/i,
  /file_content/i,
  /payload/i,
];

// Patterns for token and secret values inside strings
const TOKEN_PATTERNS = [
  /\b(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]+\b/g, // GitHub tokens
  /\b(?:bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, // Bearer tokens
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, // JWT-like tokens
  /\b-----BEGIN [A-Z ]+-----[^-]+-----END [A-Z ]+-----\b/gs, // PEM certificates/keys
];

// Windows and Unix user directory redaction
const USER_DIR_PATTERNS = [
  /(?:[a-zA-Z]:\\(?:Users|Documents and Settings)\\[^\\]+)/gi,
  /(?:\/(?:home|Users)\/[^\/]+)/gi,
];

/**
 * Redacts personal user paths, tokens, and credentials from a string.
 */
export function redactSensitiveString(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // Redact known token signatures
  for (const pattern of TOKEN_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.toLowerCase().startsWith('bearer')) {
        return 'Bearer [REDACTED_TOKEN]';
      }
      return '[REDACTED_TOKEN]';
    });
  }

  // Redact key-value pairs (e.g. password=xyz, secret: "abc")
  sanitized = sanitized.replace(/\b(password|secret|token|api_key|apiKey)\s*([:=])\s*["']?[^"'\s,;]+["']?/gi, (_m, key, sep) => {
    return `${key}${sep}${sep === ':' ? ' ' : ''}[REDACTED]`;
  });

  // Redact excessively long base64 or binary chunks (> 100 continuous alphanumeric/base64 chars)
  sanitized = sanitized.replace(/\b[A-Za-z0-9+/=]{100,}\b/g, '[TRUNCATED_BINARY_DATA]');

  // Redact Windows user directories: "C:\Users\john_doe" -> "C:\Users\<redacted-user>"
  sanitized = sanitized.replace(USER_DIR_PATTERNS[0], (match) => {
    const drive = match.slice(0, 3);
    const folder = match.includes('Documents and Settings') ? 'Documents and Settings' : 'Users';
    return `${drive}${folder}\\<redacted-user>`;
  });

  // Redact Unix user directories: "/Users/john_doe" -> "/Users/<redacted-user>"
  sanitized = sanitized.replace(USER_DIR_PATTERNS[1], (match) => {
    const base = match.startsWith('/home') ? '/home' : '/Users';
    return `${base}/<redacted-user>`;
  });

  return sanitized;
}

/**
 * Creates a sanitized diagnostics payload for testing or reporting.
 */
export function sanitizeDiagnostics(
  technicalDetails?: string,
  context?: Record<string, unknown>,
  breadcrumbs?: string[]
): {
  timestamp: string;
  technicalDetails?: string;
  context?: Record<string, unknown>;
  breadcrumbs?: string[];
} {
  return {
    timestamp: new Date().toISOString(),
    technicalDetails: technicalDetails ? redactSensitiveString(technicalDetails) : undefined,
    context: sanitizeContext(context),
    breadcrumbs: breadcrumbs ? breadcrumbs.map((b) => redactSensitiveString(b)) : undefined,
  };
}

/**
 * Deeply sanitizes and redacts context objects, preventing sensitive
 * values from entering error logs or diagnostics.
 */
export function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context || typeof context !== 'object') return undefined;

  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(context)) {
    // If the key name itself indicates sensitive data, redact entirely
    const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key));
    if (isSensitiveKey) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (typeof val === 'string') {
      // If it looks like base64 payload or overly long payload, truncate and redact
      if (val.length > 500 && /^[A-Za-z0-9+/=]+$/.test(val.trim())) {
        sanitized[key] = '[REDACTED_BINARY_PAYLOAD]';
      } else {
        sanitized[key] = redactSensitiveString(val);
      }
    } else if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        sanitized[key] = val.map((item) => {
          if (typeof item === 'string') return redactSensitiveString(item);
          if (typeof item === 'object' && item !== null) {
            return sanitizeContext(item as Record<string, unknown>);
          }
          return item;
        });
      } else {
        sanitized[key] = sanitizeContext(val as Record<string, unknown>);
      }
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

/**
 * Formats diagnostic report ready for user clipboard copy or inspection.
 */
export function formatDiagnosticsForExport(diagnostics: {
  code?: string;
  category?: string;
  severity?: string;
  timestamp?: string;
  platform?: string;
  appVersion?: string;
  sanitizedMessage?: string;
  technicalDetails?: string;
  context?: Record<string, unknown>;
}): string {
  const parts = [
    `=== Curry Diagnostic Report ===`,
    `Timestamp: ${diagnostics.timestamp || new Date().toISOString()}`,
    `App Version: ${diagnostics.appVersion || 'unknown'}`,
    `Platform: ${diagnostics.platform || 'desktop'}`,
    `Error Code: ${diagnostics.code || 'UNKNOWN_ERROR'}`,
    `Category: ${diagnostics.category || 'general'}`,
    `Severity: ${(diagnostics.severity || 'error').toUpperCase()}`,
    `Summary: ${diagnostics.sanitizedMessage || ''}`,
  ];

  if (diagnostics.technicalDetails) {
    parts.push(`Technical Details: ${redactSensitiveString(diagnostics.technicalDetails)}`);
  }

  if (diagnostics.context && Object.keys(diagnostics.context).length > 0) {
    parts.push(`Context:\n${JSON.stringify(sanitizeContext(diagnostics.context), null, 2)}`);
  }

  parts.push(`======================================`);
  return parts.join('\n');
}
