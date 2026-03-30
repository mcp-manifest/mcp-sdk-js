import { readFile } from 'node:fs/promises';
import type { McpManifest } from './types.js';

/**
 * Parse a JSON string into an McpManifest object.
 * Returns null if the string is not valid JSON.
 */
export function parse(json: string): McpManifest | null {
  try {
    return JSON.parse(json) as McpManifest;
  } catch {
    return null;
  }
}

/**
 * Load and parse an MCP manifest from a local file path.
 * Returns null if the file cannot be read or is not valid JSON.
 */
export async function loadFile(path: string): Promise<McpManifest | null> {
  try {
    const raw = await readFile(path, 'utf-8');
    return parse(raw);
  } catch {
    return null;
  }
}
