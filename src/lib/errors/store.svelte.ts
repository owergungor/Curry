/**
 * Centralized Application Error Store (Svelte 5 Runes)
 * Manages active application errors, deduplication, diagnostics modals,
 * and recovery action execution.
 */

import type { AppError, ErrorInput } from './types';
import { mapTechnicalError } from './mapper';

class ErrorStore {
  // Active user-visible errors
  activeErrors = $state<AppError[]>([]);

  // Currently focused error for the "View Details" diagnostics modal
  inspectedError = $state<AppError | null>(null);

  // Timestamp tracker for deduplication: fingerprint -> last reported timestamp
  private recentFingerprints = new Map<string, number>();

  // Deduplication window: 3.5 seconds
  private deduplicationWindowMs = 3500;

  /**
   * Reports an error. Maps technical messages into user-friendly messages,
   * redacts sensitive data, and suppresses duplicate notifications.
   */
  report(input: ErrorInput): AppError {
    const appError = mapTechnicalError(input);
    const now = Date.now();

    // Deduplication check
    const lastSeen = this.recentFingerprints.get(appError.fingerprint);
    if (lastSeen && now - lastSeen < this.deduplicationWindowMs) {
      // Refresh timestamp and return existing without creating visual duplicate
      this.recentFingerprints.set(appError.fingerprint, now);
      const existing = this.activeErrors.find((e) => e.fingerprint === appError.fingerprint);
      if (existing) {
        return existing;
      }
    }

    this.recentFingerprints.set(appError.fingerprint, now);

    // Clean up old fingerprints periodically
    if (this.recentFingerprints.size > 50) {
      for (const [fp, time] of this.recentFingerprints.entries()) {
        if (now - time > this.deduplicationWindowMs * 3) {
          this.recentFingerprints.delete(fp);
        }
      }
    }

    // Limit active visible errors to 3 to prevent notification stacking
    if (this.activeErrors.length >= 3) {
      this.activeErrors = this.activeErrors.slice(1);
    }

    this.activeErrors.push(appError);
    return appError;
  }

  /**
   * Dismisses a specific error by ID.
   */
  dismiss(id: string) {
    this.activeErrors = this.activeErrors.filter((e) => e.id !== id);
    if (this.inspectedError?.id === id) {
      this.inspectedError = null;
    }
  }

  /**
   * Clears all active errors.
   */
  clear() {
    this.activeErrors = [];
    this.inspectedError = null;
  }

  /**
   * Opens the diagnostics details modal for an error.
   */
  inspect(error: AppError) {
    this.inspectedError = error;
  }

  /**
   * Closes the diagnostics details modal.
   */
  closeInspection() {
    this.inspectedError = null;
  }

  /**
   * Check if any fatal errors currently exist.
   */
  get hasFatal(): boolean {
    return this.activeErrors.some((e) => e.severity === 'fatal');
  }

  /**
   * Returns the primary fatal error if one is active.
   */
  get fatalError(): AppError | undefined {
    return this.activeErrors.find((e) => e.severity === 'fatal');
  }
}

export const errorStore = new ErrorStore();
