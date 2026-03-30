import { existsSync, readFileSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { McpManifest, DiscoveryResult } from './types.js';

const execAsync = promisify(exec);

const TIMEOUT_MS = 10_000;

/**
 * Discover an MCP manifest from a local file path, URL, or domain.
 *
 * Resolution algorithm:
 * 1. If input is a local file path that exists, parse as manifest JSON.
 * 2. If input is a direct URL ending in .json, fetch and parse.
 * 3. Normalize to base URL (prepend https:// if needed).
 * 4. Try well-known URL: GET {base_url}/.well-known/mcp-manifest.json
 * 5. Fetch HTML page, parse for <link rel="mcp-manifest" href="..."> tags.
 * 6. Discovery failed.
 */
export async function discover(input: string): Promise<DiscoveryResult> {
  const errors: string[] = [];

  // Step 1: Local file
  try {
    if (existsSync(input)) {
      try {
        const raw = readFileSync(input, 'utf-8');
        const manifest = JSON.parse(raw) as McpManifest;
        return { manifest, source: `file: ${input}`, errors: [] };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { manifest: null, source: `file: ${input}`, errors: [`Failed to parse: ${msg}`] };
      }
    }
  } catch {
    // Not a file path — continue
  }

  // Step 2: Direct URL ending in .json
  if (input.startsWith('http') && input.endsWith('.json')) {
    try {
      const res = await fetch(input, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) {
        const manifest = (await res.json()) as McpManifest;
        return { manifest, source: `url: ${input}`, errors: [] };
      }
      errors.push(`${input} returned ${res.status}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${input}: ${msg}`);
    }
    return { manifest: null, source: input, errors };
  }

  // Step 3: Normalize to base URL
  let baseUrl = input;
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/+$/, '');

  // Step 4: Try well-known URL
  const wellKnown = `${baseUrl}/.well-known/mcp-manifest.json`;
  try {
    const res = await fetch(wellKnown, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) {
      const manifest = (await res.json()) as McpManifest;
      return { manifest, source: `well-known: ${wellKnown}`, errors: [] };
    }
    errors.push(`well-known: ${res.status}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`well-known: ${msg}`);
  }

  // Step 5: Fetch HTML and parse <link rel="mcp-manifest">
  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) {
      const html = await res.text();
      const match =
        html.match(/<link[^>]+rel\s*=\s*["']mcp-manifest["'][^>]+href\s*=\s*["']([^"']+)["']/i) ||
        html.match(/<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']mcp-manifest["']/i);

      if (match) {
        let href = match[1];
        if (href.startsWith('/')) {
          href = `${baseUrl}${href}`;
        } else if (!href.startsWith('http')) {
          href = `${baseUrl}/${href}`;
        }

        try {
          const mRes = await fetch(href, { signal: AbortSignal.timeout(TIMEOUT_MS) });
          if (mRes.ok) {
            const manifest = (await mRes.json()) as McpManifest;
            return { manifest, source: `link tag: ${href}`, errors: [] };
          }
          errors.push(`link tag href ${href}: ${mRes.status}`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`link tag href ${href}: ${msg}`);
        }
      } else {
        errors.push('no <link rel="mcp-manifest"> found in HTML');
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`HTML fetch: ${msg}`);
  }

  // Step 6: Discovery failed
  return { manifest: null, source: baseUrl, errors };
}

/**
 * Check if a command exists on PATH.
 */
export async function checkCommand(command: string): Promise<boolean> {
  const cmd = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
  try {
    await execAsync(cmd);
    return true;
  } catch {
    return false;
  }
}
