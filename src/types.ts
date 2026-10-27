/**
 * MCP Manifest — top-level manifest object.
 * Conforms to the mcp-manifest.dev spec v1.0.
 *
 * Security-related fields are documented inline; see the spec's
 * THREAT-MODEL.md for the rationale behind each field.
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
  /** How clients should handle updates. Default 'manual'. (T4) */
  update_policy?: 'auto' | 'manual' | 'ask';
  /** URL to a human-readable changelog displayed during update prompts. (T4) */
  changelog_url?: string;
  /** Cryptographic publisher signature. (T1) */
  signature?: McpManifestSignature;
  /** Vendor extensions; keys MUST start with 'x-'. (T5) */
  extensions?: Record<string, unknown>;
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
  icon?: string;
  keywords?: string[];
}

/**
 * A single installation method.
 */
export interface McpManifestInstall {
  method: 'dotnet-tool' | 'npm' | 'pip' | 'cargo' | 'gem' | 'prebuilt-binary' | 'docker';
  package: string;
  command: string;
  /** Explicit registry origin URL. RECOMMENDED for non-default registries. (T2) */
  registry?: string;
  /** SHA-256 checksum 'sha256:HEX'. REQUIRED when method='prebuilt-binary'. (T2) */
  checksum?: string;
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
  options?: string[];
  options_from?: McpManifestOptionsFrom;
  /** Intended recipient origin for secrets (e.g., 'api.openai.com'). REQUIRED when type='secret'. (T3) */
  secret_target?: string;
  /** URL pattern this secret may be sent to. (T3) */
  secret_scope_url?: string;
}

export interface McpManifestOptionsFrom {
  /** Path to a local JSON file. ~ is expanded to the user's home directory. */
  file: string;
  /** JSONPath expression to extract values from the file. */
  path: string;
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
 * Cryptographic signature over the canonicalized manifest. (T1)
 *
 * The signed payload is the manifest JSON with the `signature` field removed,
 * canonicalized via RFC 8785 (JCS), then signed with Ed25519.
 */
export interface McpManifestSignature {
  /** Currently only 'Ed25519' is defined. */
  alg: 'Ed25519';
  /** Opaque identifier for the publisher's signing key. */
  key_id: string;
  /** Base64url-encoded signature (no padding). */
  value: string;
}

/**
 * Result returned by the discover() function.
 */
export interface DiscoveryResult {
  manifest: McpManifest | null;
  source: string;
  errors: string[];
  /** SHA-256 hex of the raw manifest bytes that were fetched. (T6) */
  manifest_hash?: string;
  /** Result of signature verification, if a signature was present. (T1) */
  signature_status?: 'unsigned' | 'verified' | 'invalid' | 'unknown-key';
}

/**
 * Result returned by the validate() function.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Result of verifying a prebuilt-binary checksum. (T2)
 */
export interface ChecksumResult {
  valid: boolean;
  expected: string;
  actual: string;
}
