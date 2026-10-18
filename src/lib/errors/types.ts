/**
 * Curry Desktop Application - Typed Error Management System
 * Standardized error categories, error codes, actions, and diagnostics interfaces.
 */

export type ErrorSeverity = 'error' | 'warning' | 'fatal';

export type ErrorCategory =
  | 'system'
  | 'settings'
  | 'storage'
  | 'notification'
  | 'profile'
  | 'window'
  | 'update'
  | 'network'
  | 'clipboard'
  | 'media'
  | 'general';

export type ErrorCode =
  | 'INITIALIZATION_FAILED'
  | 'SETTINGS_LOAD_FAILED'
  | 'SETTINGS_SAVE_FAILED'
  | 'STORAGE_BUSY'
  | 'STORAGE_FULL'
  | 'STORAGE_PERMISSION_DENIED'
  | 'STORAGE_WRITE_FAILED'
  | 'NOTIFICATION_PERMISSION_REQUIRED'
  | 'NOTIFICATION_PERMISSION_DENIED'
  | 'NOTIFICATION_DISPATCH_FAILED'
  | 'NOTIFICATION_CLEAR_FAILED'
  | 'PROFILE_DUPLICATE'
  | 'PROFILE_INVALID'
  | 'PROFILE_SAVE_FAILED'
  | 'PROFILE_DELETE_FAILED'
  | 'EXECUTABLE_PICK_FAILED'
  | 'EXECUTABLE_NOT_FOUND'
  | 'WINDOW_OPERATION_FAILED'
  | 'WINDOW_DISPLAY_NOT_FOUND'
  | 'UPDATE_CHECK_FAILED'
  | 'NETWORK_TIMEOUT'
  | 'AUDIO_PLAYBACK_FAILED'
  | 'MEDIA_AUDIO_DEVICE_ERROR'
  | 'CLIPBOARD_FAILED'
  | 'SYSTEM_UNSUPPORTED'
  | 'UNKNOWN_ERROR';

export type ErrorActionType = 'retry' | 'dismiss' | 'open_settings' | 'settings' | 'view_details';

export interface ErrorAction {
  label: string;
  type: ErrorActionType;
  primary?: boolean;
  action?: () => void | Promise<void>;
}

export interface SanitizedDiagnostics {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: string;
  platform: string;
  appVersion: string;
  sanitizedMessage: string;
  technicalDetails?: string;
  context?: Record<string, unknown>;
}

export interface AppError {
  id: string;
  fingerprint: string;
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  title: string;
  message: string;
  suggestion: string;
  timestamp: number;
  rawError?: unknown;
  diagnostics: SanitizedDiagnostics;
  actions: ErrorAction[];
  recoverable: boolean;
  dismissed?: boolean;
}

export interface ErrorInputObject {
  code?: ErrorCode;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  title?: string;
  message?: string;
  suggestion?: string;
  rawError?: unknown;
  context?: Record<string, unknown>;
  appVersion?: string;
  onRetry?: () => void | Promise<void>;
  onOpenSettings?: () => void | Promise<void>;
}

export type ErrorInput = string | Error | ErrorInputObject;
