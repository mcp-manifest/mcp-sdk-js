import type { McpManifest, ValidationResult } from './types.js';

/**
 * Validate an MCP manifest object.
 *
 * Checks:
 * - Required top-level fields (version, server, install, transport)
 * - Required server fields (name, displayName, description, version)
 * - Install array is non-empty with required fields per entry
 * - Transport/endpoint consistency (sse and streamable-http require endpoint)
 * - No duplicate config keys
 * - settings_template variables reference real config keys
 */
export function validate(manifest: McpManifest): ValidationResult {
  const errors: string[] = [];

  // Required top-level fields
  if (!manifest.version) {
    errors.push('missing required field: version');
  } else if (manifest.version !== '0.1') {
    errors.push(`unsupported version "${manifest.version}", expected "0.1"`);
  }

  if (!manifest.server) {
    errors.push('missing required field: server');
  } else {
    if (!manifest.server.name) errors.push('missing required field: server.name');
    if (!manifest.server.displayName) errors.push('missing required field: server.displayName');
    if (!manifest.server.description) errors.push('missing required field: server.description');
    if (!manifest.server.version) errors.push('missing required field: server.version');
  }

  if (!manifest.install) {
    errors.push('missing required field: install');
  } else if (!Array.isArray(manifest.install) || manifest.install.length === 0) {
    errors.push('install must be a non-empty array');
  } else {
    for (let i = 0; i < manifest.install.length; i++) {
      const entry = manifest.install[i];
      if (!entry.method) errors.push(`install[${i}]: missing required field "method"`);
      if (!entry.package) errors.push(`install[${i}]: missing required field "package"`);
      if (!entry.command) errors.push(`install[${i}]: missing required field "command"`);
    }
  }

  if (!manifest.transport) {
    errors.push('missing required field: transport');
  } else {
    const validTransports = ['stdio', 'sse', 'streamable-http'];
    if (!validTransports.includes(manifest.transport)) {
      errors.push(`invalid transport "${manifest.transport}", expected one of: ${validTransports.join(', ')}`);
    }
  }

  // Transport/endpoint match
  if (manifest.transport === 'sse' || manifest.transport === 'streamable-http') {
    if (!manifest.endpoint) {
      errors.push(`transport "${manifest.transport}" requires an "endpoint" URL`);
    }
  }

  // No duplicate config keys
  if (manifest.config) {
    const keys = manifest.config.map(c => c.key);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (dupes.length > 0) {
      errors.push(`duplicate config keys: ${[...new Set(dupes)].join(', ')}`);
    }
  }

  // Template vars reference real keys
  if (manifest.settings_template) {
    const templateStr = JSON.stringify(manifest.settings_template);
    const varRefs = [...templateStr.matchAll(/\$\{([^}]+)\}/g)].map(m => m[1]);
    const configKeys = (manifest.config || []).map(c => c.key);
    for (const ref of varRefs) {
      if (!configKeys.includes(ref)) {
        errors.push(`settings_template references "\${${ref}}" but no config entry has key "${ref}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
