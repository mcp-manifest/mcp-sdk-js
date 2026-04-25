[![MCP Manifest](https://mcp-manifest.dev/media/mcp-manifest-badge-light.svg)](https://mcp-manifest.dev)

# @mcp-manifest/sdk

TypeScript SDK for discovering and parsing [mcp-manifest.json](https://mcp-manifest.dev) files. Built for MCP client developers who want to auto-discover, validate, and consume server manifests.

## Install

```bash
npm install @mcp-manifest/sdk
```

## Usage

### Discover a manifest from a domain, URL, or file path

```ts
import { discover } from '@mcp-manifest/sdk';

// From a domain (tries well-known URL, then HTML link tag)
const result = await discover('ironlicensing.com');

// From a direct URL
const result = await discover('https://example.com/mcp-manifest.json');

// From a local file
const result = await discover('./mcp-manifest.json');

if (result.manifest) {
  console.log(`Found via ${result.source}`);
  console.log(result.manifest.server.displayName);
} else {
  console.error('Discovery failed:', result.errors);
}
```

### Validate a manifest

```ts
import { validate } from '@mcp-manifest/sdk';

const { valid, errors } = validate(manifest);

if (!valid) {
  console.error('Validation errors:', errors);
}
```

### Parse JSON

```ts
import { parse, loadFile } from '@mcp-manifest/sdk';

// Parse a JSON string
const manifest = parse(jsonString);

// Load from a file
const manifest = await loadFile('./mcp-manifest.json');
```

### Check if a command exists on PATH

```ts
import { checkCommand } from '@mcp-manifest/sdk';

const exists = await checkCommand('ironlicensing-mcp');
```

## Discovery Algorithm

1. If input is a local file path and exists, parse as manifest JSON.
2. If input is a direct URL ending in `.json`, fetch and parse.
3. Normalize to base URL (prepend `https://` if needed).
4. Try well-known URL: `GET {base_url}/.well-known/mcp-manifest.json`
5. Fetch HTML page, parse for `<link rel="mcp-manifest" href="...">` tags.
6. Discovery failed.

## Types

The SDK exports full TypeScript types for the manifest spec:

- `McpManifest` — top-level manifest
- `McpManifestServer` — server metadata
- `McpManifestInstall` — installation method
- `McpManifestConfig` — configuration parameter
- `McpManifestSettingsTemplate` — client settings template
- `DiscoveryResult` — result from `discover()`
- `ValidationResult` — result from `validate()`

## License

Apache-2.0 — see [LICENSE](LICENSE) for the full license text and [NOTICE](NOTICE) for attribution.
