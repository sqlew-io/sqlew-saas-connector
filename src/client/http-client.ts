import { AuthManager } from '../auth/auth-manager';
import { ApiError } from '../errors/api-error';
import {
  API_ENDPOINT,
  MAX_RETRIES,
  INITIAL_RETRY_DELAY,
  MAX_RETRY_DELAY,
  REQUEST_TIMEOUT,
} from '../config/constants';
import type { ApiResponse, ConnectionIdentity } from './types';

export class HttpClient {
  constructor(
    private authManager: AuthManager,
    private projectId?: string,
    private connectionIdentity?: ConnectionIdentity
  ) {}

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${API_ENDPOINT}${path}`;
    const requestBody = {
      project_id: this.projectId,
      // Connection identification for seat-based billing (v5.0.0+)
      ...(this.connectionIdentity && {
        connection_hash: this.connectionIdentity.connectionHash,
        connection_display: {
          environment: this.connectionIdentity.environment,
          path_suffix: this.connectionIdentity.pathSuffix,
        },
      }),
      ...body,
    };

    return await this.executeWithRetry<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: this.authManager.getAuthorizationHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        return await this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  async get<T>(path: string): Promise<T> {
    const url = `${API_ENDPOINT}${path}`;

    return await this.executeWithRetry<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: this.authManager.getAuthorizationHeader(),
          },
          signal: controller.signal,
        });

        return await this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Handle abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out', 408);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(
          'NETWORK_ERROR',
          `Network error: ${error.message}`,
          0
        );
      }

      // Retry only on 429 (rate limited)
      if (
        error instanceof ApiError &&
        error.statusCode === 429 &&
        retryCount < MAX_RETRIES
      ) {
        const delay = this.calculateRetryDelay(
          retryCount,
          error.details?.retryAfter as string | undefined
        );
        await this.sleep(delay);
        return this.executeWithRetry(operation, retryCount + 1);
      }

      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Try to parse response body
    let body: ApiResponse<T>;
    try {
      body = (await response.json()) as ApiResponse<T>;
    } catch {
      // If response is not JSON
      if (!response.ok) {
        throw new ApiError(
          'INTERNAL_ERROR',
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      throw new ApiError(
        'INVALID_RESPONSE',
        'Invalid JSON response from server',
        500
      );
    }

    // Handle HTTP errors
    if (!response.ok) {
      const retryAfter = response.headers.get('Retry-After');
      throw new ApiError(
        body.error?.code || 'UNKNOWN_ERROR',
        body.error?.message || `HTTP ${response.status}`,
        response.status,
        retryAfter ? { retryAfter } : undefined
      );
    }

    // Handle API-level errors
    if (!body.success) {
      throw new ApiError(
        body.error?.code || 'API_ERROR',
        body.error?.message || 'Unknown API error',
        500
      );
    }

    return body.data as T;
  }

  private calculateRetryDelay(
    retryCount: number,
    retryAfter?: string
  ): number {
    // Use Retry-After header if available
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return Math.min(seconds * 1000, MAX_RETRY_DELAY);
      }
    }

    // Exponential backoff: 1s, 2s, 4s, ...
    return Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
      MAX_RETRY_DELAY
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
