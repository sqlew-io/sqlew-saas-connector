// Configuration passed from mcp-sqlew
export interface CloudConfig {
  apiKey: string;
  projectId?: string;
}

// Health check result
export interface HealthCheckResult {
  ok: boolean;
  latency: number;
  message?: string;
}

// Backend type
export type BackendType = 'local' | 'saas';

// ToolBackend interface (compatible with mcp-sqlew)
export interface ToolBackend {
  execute<TResponse = unknown>(
    tool: string,
    action: string,
    params: Record<string, unknown>
  ): Promise<TResponse>;
  healthCheck(): Promise<HealthCheckResult>;
  disconnect(): Promise<void>;
  readonly backendType: BackendType;
  readonly pluginName?: string;
}

// Plugin module interface
export interface PluginModule {
  createBackend(config: CloudConfig): ToolBackend;
  version: string;
  minVersion?: string;
}

// API response format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
