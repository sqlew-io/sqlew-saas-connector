import { SaaSBackend } from './backend/saas-backend';
import { resolveProject } from './client/http-client';
import type { CloudConfig, PluginModule, ToolBackend } from './client/types';

// Re-export resolveProject for use by mcp-sqlew
export { resolveProject };

/**
 * Create a SaaS backend instance
 */
export function createBackend(config: CloudConfig): ToolBackend {
  return new SaaSBackend(config);
}

/**
 * Plugin version (SemVer)
 */
export const version = '1.0.0';

/**
 * Minimum compatible mcp-sqlew version
 */
export const minVersion = '4.4.0';

// Export types for TypeScript users
export type {
  CloudConfig,
  ConnectionIdentity,
  Environment,
  ToolBackend,
  HealthCheckResult,
} from './client/types';
export { ApiError } from './errors/api-error';

// CommonJS compatibility
// Note: Named exports (resolveProject, ApiError) are available via ESM import
// The default export provides the plugin interface for mcp-sqlew
const pluginModule: PluginModule & { resolveProject: typeof resolveProject } = {
  createBackend,
  version,
  minVersion,
  resolveProject,
};

module.exports = pluginModule;
