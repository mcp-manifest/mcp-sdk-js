/**
 * MCP Manifest — top-level manifest object.
 * Conforms to the mcp-manifest.dev spec v0.1.
 */
export interface McpManifest {
  $schema?: string;
  version: string;
  server: McpManifestServer;
  install: McpManifestInstall[];
  transport: 'stdio' | 'sse' | 'streamable-http';
  endpoint?: string;
  config?: McpManifestConfig[];
  scopes?: Array<'global' | 'project' | 'both'>;
  settings_template?: McpManifestSettingsTemplate;
}

/**
 * Server metadata block.
 */
export interface McpManifestServer {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
}

/**
 * A single installation method.
 */
export interface McpManifestInstall {
  method: 'dotnet-tool' | 'npm' | 'pip' | 'cargo' | 'binary' | 'docker';
  package: string;
  source?: string;
  command: string;
  priority?: number;
}

/**
 * A single configuration parameter the server accepts.
 */
export interface McpManifestConfig {
  key: string;
  description: string;
  type: 'string' | 'boolean' | 'number' | 'path' | 'url' | 'secret';
  required?: boolean;
  default?: unknown;
  env_var?: string;
  arg?: string;
  prompt?: string;
}

/**
 * Pre-built template for client MCP server configuration.
 * Variables use ${key} syntax referencing config keys.
 */
export interface McpManifestSettingsTemplate {
  command?: string;
  args?: string[];
}

/**
 * Result returned by the discover() function.
 */
export interface DiscoveryResult {
  manifest: McpManifest | null;
  source: string;
  errors: string[];
}

/**
 * Result returned by the validate() function.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
