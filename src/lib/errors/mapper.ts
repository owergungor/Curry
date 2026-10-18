/**
 * Technical Error to Safe User Message Mapper
 * Maps raw Rust IPC errors, OS exceptions, and system rejections into
 * typed, plain-English user-facing errors with clear recovery options.
 */

import type { AppError, ErrorCode, ErrorCategory, ErrorSeverity, ErrorInput, ErrorInputObject, ErrorAction } from './types.ts';
import { redactSensitiveString, sanitizeContext } from './sanitizer.ts';
import { APP_VERSION } from '../version.ts';

function extractRawMessage(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw instanceof Error) return raw.message || raw.name;
  if (typeof raw === 'object' && raw !== null) {
    if ('message' in raw && typeof (raw as { message: unknown }).message === 'string') {
      return (raw as { message: string }).message;
    }
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  }
  return String(raw ?? '');
}

/**
 * Creates a unique fingerprint to prevent duplicate notifications for identical failures.
 */
export function createErrorFingerprint(code: ErrorCode, category: ErrorCategory, rawMsg: string): string {
  const norm = rawMsg.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  return `${category}:${code}:${norm}`;
}

export function mapTechnicalError(input: ErrorInput): AppError {
  const inputObj: ErrorInputObject =
    typeof input === 'string'
      ? { rawError: input }
      : input instanceof Error
      ? { rawError: input }
      : input || {};

  const rawMsg = extractRawMessage(inputObj.rawError ?? input);
  const lowerMsg = rawMsg.toLowerCase();

  let code: ErrorCode = inputObj.code || 'UNKNOWN_ERROR';
  let category: ErrorCategory = inputObj.category || 'general';
  let severity: ErrorSeverity = inputObj.severity || 'error';
  let title = inputObj.title || '';
  let message = inputObj.message || '';
  let suggestion = inputObj.suggestion || '';
  let recoverable = true;

  // 1. Storage & Database Errors
  if (lowerMsg.includes('database is locked') || lowerMsg.includes('sqlite busy') || lowerMsg.includes('storage busy')) {
    code = 'STORAGE_BUSY';
    category = 'storage';
    severity = 'warning';
    title = 'Storage Busy';
    message = 'The local database is temporarily busy. Curry will retry the operation automatically.';
    suggestion = 'Wait a moment while background operations complete, or retry manually.';
  } else if (lowerMsg.includes('disk full') || lowerMsg.includes('no space left')) {
    code = 'STORAGE_FULL';
    category = 'storage';
    severity = 'error';
    title = 'Storage Full';
    message = 'There is not enough disk space to write settings or local database records.';
    suggestion = 'Free up disk space on your drive and try the operation again.';
  } else if (lowerMsg.includes('access is denied') || lowerMsg.includes('permission denied')) {
    code = 'STORAGE_PERMISSION_DENIED';
    category = 'storage';
    severity = 'error';
    title = 'Permission Denied';
    message = 'Curry does not have permission to access the requested file or directory.';
    suggestion = 'Check folder write permissions or launch the application with appropriate access.';
  }

  // 2. Application Profile Errors
  else if (lowerMsg.includes('already exists') || lowerMsg.includes('duplicate profile')) {
    code = 'PROFILE_DUPLICATE';
    category = 'profile';
    title = 'Duplicate Profile';
    message = 'An illumination profile for this application already exists.';
    suggestion = 'Select the existing profile from the list to edit its glow color and animations.';
  } else if (lowerMsg.includes('executable name cannot be empty')) {
    code = 'PROFILE_INVALID';
    category = 'profile';
    title = 'Missing Executable Name';
    message = 'The application filename cannot be blank.';
    suggestion = 'Enter the executable filename (such as "Code.exe") or browse to pick an application.';
  } else if (lowerMsg.includes('border thickness') || lowerMsg.includes('corner rounding')) {
    code = 'PROFILE_INVALID';
    category = 'profile';
    title = 'Invalid Dimensions';
    message = 'Glow thickness or corner rounding values are outside allowable boundaries.';
    suggestion = 'Adjust the slider controls within the supported pixel limits.';
  } else if (lowerMsg.includes('not found') && (lowerMsg.includes('profile') || category === 'profile')) {
    code = 'PROFILE_DELETE_FAILED';
    category = 'profile';
    title = 'Profile Not Found';
    message = 'The selected application profile could not be located in settings.';
    suggestion = 'The profile may have already been removed. Refreshing your list will reflect current state.';
  }

  // 3. Executable / Launcher Errors
  else if (lowerMsg.includes('select application executable') || lowerMsg.includes('dialog')) {
    code = 'EXECUTABLE_PICK_FAILED';
    category = 'profile';
    title = 'File Selection Incomplete';
    message = 'The application file picker could not complete the selection.';
    suggestion = 'You can manually type the executable name into the field instead.';
  } else if (lowerMsg.includes('parse_executable') || lowerMsg.includes('invalid executable')) {
    code = 'EXECUTABLE_NOT_FOUND';
    category = 'profile';
    title = 'Application Not Found';
    message = 'Curry could not inspect the specified executable file.';
    suggestion = 'Check that the application is installed and that the file path is accessible.';
  }

  // 4. Settings Persistence Errors
  else if (lowerMsg.includes('settings storage is not initialized')) {
    code = 'SETTINGS_LOAD_FAILED';
    category = 'settings';
    severity = 'fatal';
    recoverable = false;
    title = 'Settings System Offline';
    message = 'Curry could not access local application storage.';
    suggestion = 'Restart Curry. If the issue persists, check folder write permissions for your profile.';
  } else if (lowerMsg.includes('failed to save')) {
    code = 'SETTINGS_SAVE_FAILED';
    category = 'settings';
    title = 'Unable to Save Changes';
    message = 'Curry could not write your updated settings to disk.';
    suggestion = 'Verify disk write permissions and free storage space, then try saving again.';
  }

  // 5. Media & Audio Device Errors
  else if (lowerMsg.includes('audio device') || lowerMsg.includes('output stream')) {
    code = 'MEDIA_AUDIO_DEVICE_ERROR';
    category = 'media';
    severity = 'warning';
    title = 'Audio Output Unavailable';
    message = 'Curry cannot access the audio device to play alert sounds.';
    suggestion = 'Check that your audio output device is connected, enabled, and unmuted.';
  } else if (lowerMsg.includes('sound') || lowerMsg.includes('audio') || category === 'media') {
    code = 'AUDIO_PLAYBACK_FAILED';
    category = 'media';
    severity = 'warning';
    title = 'Sound Playback Failed';
    message = 'Curry could not play the notification alert sound.';
    suggestion = 'Verify your system audio output device is connected and unmuted.';
  }

  // 6. Notification & Listener Errors
  else if (lowerMsg.includes('notification engine is not initialized')) {
    code = 'INITIALIZATION_FAILED';
    category = 'notification';
    severity = 'warning';
    title = 'Notification Engine Initializing';
    message = 'The background listener is still starting up.';
    suggestion = 'Wait a moment and try the action again.';
  } else if (lowerMsg.includes('notification permission') || lowerMsg.includes('usernotificationlistener') || lowerMsg.includes('access was denied') || lowerMsg.includes('access denied')) {
    code = 'NOTIFICATION_PERMISSION_DENIED';
    category = 'system';
    severity = 'warning';
    title = 'Notifications Disabled';
    message = 'Curry does not have permission or system notifications are disabled.';
    suggestion = 'Enable notification permissions in your system settings.';
  } else if (lowerMsg.includes('curry is disabled')) {
    code = 'NOTIFICATION_DISPATCH_FAILED';
    category = 'notification';
    severity = 'warning';
    title = 'Curry is Paused';
    message = 'Notifications and glow overlays are currently disabled.';
    suggestion = 'Turn on the master toggle in the top bar to resume ambient glow alerts.';
  }

  // 7. Window Coordinates & Displays
  else if (lowerMsg.includes('monitor coordinates') || lowerMsg.includes('display bounds') || lowerMsg.includes('display not found')) {
    code = 'WINDOW_DISPLAY_NOT_FOUND';
    category = 'window';
    severity = 'warning';
    title = 'Display Configuration Changed';
    message = 'The targeted monitor display could not be found or coordinates were out of range.';
    suggestion = 'Check display arrangement in your system settings.';
  }

  // 8. Network & Timeouts
  else if (lowerMsg.includes('connection timed out') || lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) {
    code = 'NETWORK_TIMEOUT';
    category = 'network';
    severity = 'warning';
    title = 'Connection Timed Out';
    message = 'The network request timed out while communicating with the remote server.';
    suggestion = 'Check your internet connection and retry the operation.';
  }

  // 9. System & Platform Integration
  else if (lowerMsg.includes('not supported on this platform')) {
    code = 'SYSTEM_UNSUPPORTED';
    category = 'system';
    severity = 'warning';
    title = 'Feature Unavailable on This OS';
    message = 'This operating system integration is not available on your current platform.';
    suggestion = 'Configure this setting directly inside your operating system preferences.';
  } else if (lowerMsg.includes('backend connection') || lowerMsg.includes('failed to fetch') || lowerMsg.includes('ipc')) {
    code = 'INITIALIZATION_FAILED';
    category = 'system';
    title = 'Backend Communication Interrupted';
    message = 'Curry could not communicate with its native background process.';
    suggestion = 'Ensure no background security software is blocking local IPC connections.';
  }

  // 10. Update Checks
  else if (lowerMsg.includes('update') || category === 'update') {
    code = 'UPDATE_CHECK_FAILED';
    category = 'update';
    severity = 'warning';
    title = 'Update Check Unavailable';
    message = 'Curry could not check for new releases right now.';
    suggestion = 'Check your network connection or try again later.';
  }

  // Apply explicit overrides from inputObj
  if (inputObj.code) code = inputObj.code;
  if (inputObj.category) category = inputObj.category;
  if (inputObj.severity) severity = inputObj.severity;
  if (inputObj.title) title = inputObj.title;
  if (inputObj.message) message = inputObj.message;
  if (inputObj.suggestion) suggestion = inputObj.suggestion;

  // Safe defaults if still empty
  if (!title) title = 'Unexpected Error';
  if (!message) message = 'An unexpected error occurred while processing your request.';
  if (!suggestion) suggestion = 'Try the operation again or check application settings.';

  const timestamp = Date.now();
  const id = `err-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
  const fingerprint = createErrorFingerprint(code, category, rawMsg || title);

  const platformName = typeof navigator !== 'undefined' ? navigator.userAgent : 'desktop';

  const diagnostics = {
    code,
    category,
    severity,
    timestamp: new Date(timestamp).toISOString(),
    platform: redactSensitiveString(platformName),
    appVersion: inputObj.appVersion || APP_VERSION,
    sanitizedMessage: message,
    technicalDetails: rawMsg ? redactSensitiveString(rawMsg) : undefined,
    context: sanitizeContext(inputObj.context),
  };

  // Build standard actions
  const actions: ErrorAction[] = [];

  if (inputObj.onRetry || code === 'STORAGE_BUSY' || code === 'NETWORK_TIMEOUT') {
    actions.push({
      label: 'Retry',
      type: 'retry',
      primary: true,
      action: inputObj.onRetry,
    });
  }

  if (
    inputObj.onOpenSettings ||
    code === 'NOTIFICATION_PERMISSION_REQUIRED' ||
    code === 'NOTIFICATION_PERMISSION_DENIED' ||
    code === 'STORAGE_PERMISSION_DENIED'
  ) {
    actions.push({
      label: 'Open Settings',
      type: 'settings',
      action: inputObj.onOpenSettings,
    });
  }

  actions.push({
    label: 'Dismiss',
    type: 'dismiss',
  });

  return {
    id,
    fingerprint,
    code,
    category,
    severity,
    title,
    message,
    suggestion,
    timestamp,
    rawError: inputObj.rawError ?? input,
    diagnostics,
    actions,
    recoverable,
  };
}
