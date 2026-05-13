# NMCP Export Service

An Express service that exports neuron reconstruction data from the [NMCP portal](https://morphology.allenneuraldynamics.org/) in multiple formats. It queries the NMCP API via GraphQL for atlas-space or specimen-space reconstructions, formats them, and returns individual results or bundled ZIP archives with citation metadata.

### Export Formats

| Format | Description |
|--------|-------------|
| SWC | Standard morphology format (index, structure, x, y, z, radius, parent) |
| JSON | Portal-native JSON with full reconstruction and metadata |
| Legacy JSON | Grouped by structure type (soma/axon/dendrite) with reindexed nodes |
| Parquet | Columnar binary format with typed columns and footer metadata |

## Setup

Requires [Node.js](https://nodejs.org/) 20.19+ or 22.12+.

```sh
npm install
```

### Cross-Platform Development (Windows + WSL)

The `overrides` in `package.json` replace `rollup` and `esbuild` with their WASM equivalents so that a single `node_modules` directory works from both Windows and WSL.

## Development & Testing

Type-check without emitting:

```sh
npx tsc --noEmit
```

Run tests:

```sh
npm test
```

Run the service locally:

```sh
npm run debug
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPORT_API_PORT` | `5000` | Port the service listens on |
| `NMCP_API_HOST` | `nmcp-api` | NMCP API hostname |
| `NMCP_API_PORT` | `5000` | NMCP API port |
| `NMCP_API_ENDPOINT` | `/graphql` | NMCP API GraphQL endpoint |
| `NMCP_AUTHENTICATION_KEY` | _(empty)_ | API authentication key |

## Deployment

Deployment is automated via GitHub Actions on push to `main`. The workflow compiles TypeScript, builds a Docker image, and pushes it to `ghcr.io/allenneuraldynamics/nmcp-export` with major, minor, patch, and `latest` tags.

To build and test the Docker image locally before pushing (requires [Task](https://taskfile.dev/)):

```sh
task docker-build
docker run -p 5000:5000 ghcr.io/allenneuraldynamics/nmcp-export:latest
```
