import { HttpClient } from '../client/http-client';
import { AuthManager } from '../auth/auth-manager';
import { ApiError } from '../errors/api-error';
import { SUPPORTED_TOOLS, isLocalOnlyAction } from '../config/constants';
import type {
  CloudConfig,
  ToolBackend,
  HealthCheckResult,
} from '../client/types';

export class SaaSBackend implements ToolBackend {
  readonly backendType = 'plugin' as const;
  readonly pluginName = 'saas-connector';

  private httpClient: HttpClient;

  constructor(config: CloudConfig) {
    const authManager = new AuthManager(config.apiKey);
    this.httpClient = new HttpClient(authManager, config.projectId);
  }

  async execute<T>(
    tool: string,
    action: string,
    params: Record<string, unknown>
  ): Promise<T> {
    // Check if this action should be handled locally (no DB access required)
    if (isLocalOnlyAction(tool, action)) {
      throw new ApiError(
        'LOCAL_ONLY_ACTION',
        `Action '${tool}.${action}' should be handled locally (no DB access required)`,
        200 // Not an error, just a signal to fallback
      );
    }

    // Validate supported tools
    if (!SUPPORTED_TOOLS.includes(tool as (typeof SUPPORTED_TOOLS)[number])) {
      throw new ApiError(
        'UNSUPPORTED_TOOL',
        `Tool '${tool}' is not supported in SaaS mode. Supported tools: ${SUPPORTED_TOOLS.join(', ')}`,
        400
      );
    }

    // Call SaaS API
    const endpoint = `/api/v1/${tool}/${action}`;
    return await this.httpClient.post<T>(endpoint, params);
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await this.httpClient.get<{ status: string }>('/health');
      return {
        ok: true,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        ok: false,
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async disconnect(): Promise<void> {
    // HTTP client doesn't need explicit disconnect
  }
}
