# Multi-Environment Deployment Guide

This document describes the multi-environment deployment system implemented for the GraphQL application.

## Overview

Both the **server** and **client** applications now have automatic environment detection that supports four deployment targets:
- **localhost** - Local development
- **fastly** - Fastly CDN deployment
- **cloudfront** - AWS CloudFront deployment  
- **stellate** - Stellate GraphQL caching

The system automatically selects the correct configuration based on how the application is deployed.

## Architecture

### Environment Detection

#### Server (Node.js)

The server uses explicit environment detection via the `DEPLOYMENT_ENV` variable:

1. **Explicit** - `DEPLOYMENT_ENV` environment variable (recommended for deployment)
2. **Fallback** - `NODE_ENV` mapping (production → fastly, otherwise localhost)
3. **Default** - localhost

**Fail-fast behavior**: If an invalid `DEPLOYMENT_ENV` is provided, the server logs an error and falls back according to the priority order.

```bash
# Set environment at deployment time
DEPLOYMENT_ENV=fastly npm run start
DEPLOYMENT_ENV=cloudfront npm run start
DEPLOYMENT_ENV=stellate npm run start
DEPLOYMENT_ENV=localhost npm run dev
```

#### Client (React)

The client uses automatic detection via hostname with optional override:

1. **Explicit** - `VITE_DEPLOYMENT_ENV` environment variable (for testing)
2. **Hostname** - Auto-detect based on current domain
   - `vfa102.website` → fastly
   - `cloudfront` or `dixw5rir038vz` → cloudfront
   - `stellate` or `capstone.stellate.sh` → stellate
   - `localhost` or `127.0.0.1` → localhost
3. **Default** - localhost

```bash
# Test different environments locally
VITE_DEPLOYMENT_ENV=fastly npm run dev
VITE_DEPLOYMENT_ENV=cloudfront npm run dev
```

## Configuration Files

### Server `.env`

```env
# Primary Configuration
DEPLOYMENT_ENV=localhost

# Environment URLs
FASTLY_ORIGIN_URL=https://vfa102.website
CLOUDFRONT_ORIGIN_URL=https://dixw5rir038vz.cloudfront.net
STELLATE_ORIGIN_URL=https://capstone.stellate.sh

# Ports (all default to 3002)
FASTLY_PORT=3002
CLOUDFRONT_PORT=3002
STELLATE_PORT=3002
LOCALHOST_PORT=3002
```

### Client `.env`

```env
# Override detection for testing (leave commented for auto-detection)
# VITE_DEPLOYMENT_ENV=localhost
```

## Environment-Specific Configuration

| Setting | localhost | fastly | cloudfront | stellate |
|---------|-----------|--------|-----------|----------|
| **Server Port** | 3002 | 3002 | 3002 | 3002 |
| **Server CORS** | http://localhost:5173 | https://vfa102.website | https://dixw5rir038vz.cloudfront.net | https://capstone.stellate.sh |
| **Server API URL** | http://localhost:3002/api | https://vfa102.website/api | https://dixw5rir038vz.cloudfront.net/api | https://capstone.stellate.sh/api |
| **Client GraphQL** | http://localhost:3002/graphql | https://vfa102.website/graphql | https://dixw5rir038vz.cloudfront.net/graphql | https://capstone.stellate.sh/graphql |
| **Detection Method** | Variable/Fallback | Variable/Hostname | Variable/Hostname | Variable/Hostname |

## Startup Logging

Both applications log their detected environment on startup for easy verification.

### Server Startup

```
[dotenv] injecting env (9) from .env
🚀 Server starting in localhost environment
📍 CORS Origin: http://localhost:5173
Server running, listening on Port 3002
```

### Client Startup

```
🎨 Client running in localhost environment
```

### GraphQL Request Logging

Each GraphQL request logs its environment:

```
📡 GraphQL request in localhost environment
```

## Implementation Details

### Server Configuration Module

**File:** `server/src/config.ts`

- Defines `DeploymentEnv` type with 4 valid environments
- Implements `getDeploymentEnv()` with priority detection logic
- Builds `CONFIG` object from environment variables
- Exports `CURRENT_CONFIG` for use throughout server
- Provides `logEnvironment()` helper for startup logging

### Client Configuration Module

**File:** `client/src/config/env.ts`

- Defines `DeploymentEnv` type with 4 valid environments
- Implements `getDeploymentEnv()` with priority detection logic
- Builds `CONFIG` object with hardcoded URLs per environment
- Exports `CURRENT_CONFIG` for use throughout client
- Provides `logEnvironment()` helper for startup logging

### Usage Across Applications

**Server:**
- `src/config.ts` - Configuration module
- `src/server.ts` - Calls `logEnvironment()` on startup
- `src/app.ts` - Uses `CURRENT_CONFIG.corsOrigin` for CORS setup
- `src/graphql/resolvers.ts` - Uses `CURRENT_CONFIG.apiUrl` for API requests

**Client:**
- `src/config/env.ts` - Configuration module
- `src/App.tsx` - Calls `logEnvironment()` on mount
- `src/context/AppContext.tsx` - Uses `CURRENT_CONFIG.graphqlUrl` for GraphQL
- `src/services/api.ts` - Uses `CURRENT_CONFIG.graphqlUrl` for GraphQL

## Deployment Instructions

### Local Development

```bash
# Server
cd server
DEPLOYMENT_ENV=localhost npm run dev

# Client (in another terminal)
cd client
npm run dev
```

### Production Deployment

#### Fastly

```bash
# Server
DEPLOYMENT_ENV=fastly npm run build && npm run deploy

# Client
npm run build && upload dist/ to CDN
```

#### CloudFront

```bash
# Server
DEPLOYMENT_ENV=cloudfront npm run build && npm run deploy

# Client
npm run build && upload dist/ to CloudFront
```

#### Stellate

```bash
# Server
DEPLOYMENT_ENV=stellate npm run build && npm run deploy

# Client
npm run build && upload dist/ to CDN
```

### Client Single Build

The client is built once and deployed to all environments:

```bash
# Build once
npm run build

# Deploy dist/ to all CDN locations
# Client auto-detects environment based on hostname at runtime
```

## Troubleshooting

### Wrong Environment Detected

**Server:**
1. Verify `DEPLOYMENT_ENV` is set correctly
2. Check `NODE_ENV` if `DEPLOYMENT_ENV` is not set
3. Ensure environment variable is being passed to the process

**Client:**
1. Check browser console for detected environment
2. Verify hostname matches detection patterns
3. Override with `VITE_DEPLOYMENT_ENV` for testing

### CORS Errors

1. Verify server's `DEPLOYMENT_ENV` matches client's environment
2. Check that client origin matches server's `corsOrigin`
3. Ensure both are configured for the same environment

### GraphQL Connection Failures

1. Verify server is running in correct environment
2. Check that `CURRENT_CONFIG.graphqlUrl` matches server URL
3. Ensure CORS is properly configured on server
4. Check network tab in browser DevTools for actual URL being called

### Build Errors

```bash
# Server
npm run build

# Client
npm run build
```

Both should complete successfully. If not:
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build` shows detailed errors
- Verify all environment variables are set

## Testing Multi-Environment Behavior

### Test Server Environments

```bash
# Test fastly
DEPLOYMENT_ENV=fastly npm run dev

# Test cloudfront
DEPLOYMENT_ENV=cloudfront npm run dev

# Test stellate
DEPLOYMENT_ENV=stellate npm run dev

# Test localhost (default)
npm run dev
```

Each should log its environment on startup.

### Test Client Environments

```bash
# Test fastly
VITE_DEPLOYMENT_ENV=fastly npm run dev

# Test cloudfront
VITE_DEPLOYMENT_ENV=cloudfront npm run dev

# Test stellate
VITE_DEPLOYMENT_ENV=stellate npm run dev

# Test localhost (auto-detect, default)
npm run dev
```

## Summary

The multi-environment system provides:

✅ **Automatic detection** - Environment determined at startup/runtime  
✅ **Type-safe configuration** - TypeScript ensures valid environments  
✅ **Clear logging** - Know which environment is active  
✅ **Easy deployment** - One environment variable changes everything  
✅ **Single client build** - Same dist/ works everywhere  
✅ **Fail-fast on errors** - Invalid environment configs logged immediately

Both applications will always know which environment they're running in and use the correct API URLs and CORS settings accordingly.
