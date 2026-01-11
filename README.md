# @sqlew/saas-connector

[![npm version](https://img.shields.io/npm/v/@sqlew/saas-connector.svg)](https://www.npmjs.com/package/@sqlew/saas-connector)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

> **SaaS Backend Connector for sqlew** - Cloud-based backend plugin enabling remote context storage and team collaboration

## Overview

`@sqlew/saas-connector` is an optional plugin for [sqlew](https://github.com/sqlew-io/sqlew) that enables cloud-based context storage instead of local SQLite databases. This allows:

- **Team Collaboration** - Share architectural decisions across team members
- **Cross-Device Access** - Access your context from any machine
- **Centralized Management** - Single source of truth for project decisions
- **Backup & Sync** - Automatic cloud backup of all context data

## Installation

This package is bundled with sqlew and typically doesn't need separate installation.

```bash
npm install -g sqlew
```

## Configuration

Configure the SaaS backend in `.sqlew/config.toml`:

```toml
[backend]
type = "saas"

[backend.saas]
api_key = "your-api-key"
project_id = "your-project-id"  # Optional
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   sqlew MCP     │────▶│  saas-connector  │────▶│   SaaS API      │
│   Server        │     │   (this plugin)  │     │   Backend       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Components

| Component | Description |
|-----------|-------------|
| `SaaSBackend` | Main backend implementation |
| `HttpClient` | HTTP client for API communication |
| `AuthManager` | API key authentication handler |
| `ApiError` | Standardized error handling |

## API

### createBackend(config)

Creates a new SaaS backend instance.

```typescript
import { createBackend } from '@sqlew/saas-connector';

const backend = createBackend({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});
```

### ToolBackend Interface

```typescript
interface ToolBackend {
  execute<T>(tool: string, action: string, params: Record<string, unknown>): Promise<T>;
  healthCheck(): Promise<HealthCheckResult>;
  disconnect(): Promise<void>;
  readonly backendType: 'local' | 'saas';
  readonly pluginName?: string;
}
```

## Supported Tools

The connector supports all core sqlew tools:
- `decision` - Architecture decision records
- `constraint` - Project constraints
- `suggest` - Decision suggestions

Some actions are handled locally (no network required):
- `help` actions
- `example` actions
- `use_case` actions

## Version Compatibility

| saas-connector | sqlew (min) |
|----------------|-------------|
| 1.0.x          | 4.4.0+      |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck
```

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

## Links

- [sqlew (main package)](https://github.com/sqlew-io/sqlew)
- [sqlew-plugin](https://github.com/sqlew-io/sqlew-plugin)
- [Issues](https://github.com/sqlew-io/sqlew-saas-connector/issues)
