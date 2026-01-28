import { SaaSBackend } from './backend/saas-backend';
import type { CloudConfig, PluginModule, ToolBackend } from './client/types';

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
const pluginModule: PluginModule = {
  createBackend,
  version,
  minVersion,
};

module.exports = pluginModule;
