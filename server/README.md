# GraphQL Server

A Node.js/Express GraphQL server built with GraphQL Yoga and TypeScript. Supports multi-environment deployments with automatic configuration detection.

## Features

- **GraphQL API** - Full GraphQL schema with queries and mutations for users, posts, and comments
- **JSON Server Integration** - REST API integration for data persistence
- **Multi-Environment Support** - Automatic environment detection (localhost, fastly, cloudfront, stellate)
- **CORS Configuration** - Environment-specific CORS policies
- **Type Safety** - Full TypeScript support with generated types
- **GraphQL Yoga** - Modern GraphQL server implementation
- **Hot Reload** - Watch mode for development

## Tech Stack

- **Node.js 18+** - Runtime
- **Express 5.1.0** - Web framework
- **GraphQL Yoga 5.16.0** - GraphQL server
- **TypeScript 5.9.3** - Type safety
- **Axios 1.13.1** - HTTP client
- **JSON Server 0.16.3** - REST API/data persistence
- **dotenv 17.2.3** - Environment variable management

## Project Structure

```
src/
├── config.ts               # Multi-environment configuration & detection
├── server.ts               # Server entry point with environment logging
├── app.ts                  # Express app setup with CORS and middleware
├── db/
│   └── json/
│       ├── db.json         # Combined database
│       ├── users.json      # User seed data
│       ├── posts.json      # Post seed data
│       └── comments.json   # Comment seed data
└── graphql/
    ├── schema.ts           # GraphQL schema setup
    ├── schema.graphql      # GraphQL type definitions
    ├── resolvers.ts        # GraphQL query/mutation resolvers
    └── resolvers-types.ts  # Generated TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Environment variables configured (see Configuration section)

### Installation

```bash
# Install dependencies
npm install
```

### Environment Configuration

The server automatically detects its deployment environment. Configure via `.env`:

```env
# Primary Configuration
DEPLOYMENT_ENV=localhost  # Options: localhost, fastly, cloudfront, stellate

# Fastly Configuration
FASTLY_PORT=3002
FASTLY_ORIGIN_URL=https://vfa102.website

# CloudFront Configuration
CLOUDFRONT_PORT=3002
CLOUDFRONT_ORIGIN_URL=https://dixw5rir038vz.cloudfront.net

# Stellate Configuration
STELLATE_PORT=3002
STELLATE_ORIGIN_URL=https://capstone.stellate.sh

# Localhost Configuration
LOCALHOST_URL=http://localhost
LOCALHOST_PORT=3002
```

### Environment Detection Logic

The server determines its environment in this priority order:

1. **`DEPLOYMENT_ENV` variable** - Explicit environment flag (recommended for deployment)
2. **`NODE_ENV` mapping** - Falls back to `production` → fastly, otherwise localhost
3. **Default** - localhost

Example deployment:
```bash
DEPLOYMENT_ENV=fastly npm run start
DEPLOYMENT_ENV=cloudfront npm run start
DEPLOYMENT_ENV=stellate npm run start
```

## Development

### Start Development Server

```bash
# Start with hot reload
npm run dev

# Server will start on configured port (default: 3002)
# Environment output:
# 🚀 Server starting in localhost environment
# 📍 CORS Origin: http://localhost:5173
```

### Run Separate JSON Server

```bash
# Start JSON Server on port 3001 (for REST API testing)
npm run json-server
```

### GraphQL Code Generation

```bash
# Generate TypeScript types from schema
npm run codegen
```

## Building & Deployment

### Build for Production

```bash
# Compile TypeScript and package files
npm run build

# Output: dist/ directory ready for deployment
```

### Deploy to Remote Server

```bash
# Build and sync to remote via rsync
npm run deploy

# Requires SSH access configured in package.json
```

## Multi-Environment Setup

### Environment Configurations

Each environment has its own configuration that controls:
- Port the server listens on
- CORS origin (which domains can call the API)
- API base URL used by GraphQL resolvers

| Environment | Port | CORS Origin | API URL |
|------------|------|-------------|---------|
| localhost | 3002 | http://localhost:5173 | http://localhost:3002/api |
| fastly | 3002 | https://vfa102.website | https://vfa102.website/api |
| cloudfront | 3002 | https://dixw5rir038vz.cloudfront.net | https://dixw5rir038vz.cloudfront.net/api |
| stellate | 3002 | https://capstone.stellate.sh | https://capstone.stellate.sh/api |

### Environment Detection Output

The server logs its detected environment on startup:

```
🚀 Server starting in [environment] environment
📍 CORS Origin: [origin-url]
Server running, listening on Port [port]
📡 GraphQL request in [environment] environment
```

## GraphQL API

### Endpoints

- **GraphQL** - `POST /graphql` - All queries and mutations
- **REST API** - `/api/*` - JSON Server REST interface
- **Health** - `GET /` - Server status

### Query Examples

```graphql
query {
  users { id name email }
  posts { id title body user_id }
  comments { id body user_id post_id }
}
```

### Mutation Examples

```graphql
mutation {
  createUser(name: "John", email: "john@example.com") { id name email }
  createPost(title: "Hello", user_id: "1", body: "World") { id title body }
  createComment(post_id: "1", user_id: "1", body: "Great!") { id body }
}
```

## Logging

### Startup Logging

When the server starts, it logs which environment was detected:

```
🚀 Server starting in fastly environment
📍 CORS Origin: https://vfa102.website
```

### GraphQL Request Logging

Each GraphQL request logs its environment:

```
📡 GraphQL request in fastly environment
```

## Error Handling

### Invalid DEPLOYMENT_ENV

If an invalid `DEPLOYMENT_ENV` is provided, the server will:
1. Check `NODE_ENV` as fallback
2. Default to localhost
3. Log the detected environment on startup

### CORS Errors

If you get CORS errors:
1. Verify `DEPLOYMENT_ENV` is correctly set
2. Check the origin matches the configured CORS origin
3. Ensure client is accessing from the correct URL

## Database

### JSON Server Database

Data is persisted in JSON files:
- `src/db/json/db.json` - Combined database
- `src/db/json/users.json` - User seed data
- `src/db/json/posts.json` - Post seed data
- `src/db/json/comments.json` - Comment seed data

### Reset Database

Use the `reset` mutation to restore the database to seed data:

```graphql
mutation {
  reset {
    users { id name email }
    posts { id title body }
    comments { id body }
  }
}
```

## Troubleshooting

### Port Already in Use

If port 3002 is already in use:
1. Change `LOCALHOST_PORT` in `.env`
2. Ensure only one instance is running

### CORS Origin Mismatch

If the client can't reach the server:
1. Verify `DEPLOYMENT_ENV` matches your deployment target
2. Check `FASTLY_ORIGIN_URL`, `CLOUDFRONT_ORIGIN_URL`, etc. are correct
3. Ensure client is accessing from the configured origin

### GraphQL Type Errors

If schema types are out of sync:
```bash
npm run codegen
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf dist node_modules
npm install
npm run build
```

## Development Workflow

### Making Changes

1. Update GraphQL schema in `src/graphql/schema.graphql`
2. Update resolvers in `src/graphql/resolvers.ts`
3. Regenerate types: `npm run codegen`
4. Restart dev server for hot reload

### Testing Changes

```bash
# Start dev server
npm run dev

# In another terminal, test GraphQL endpoint
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ users { id name } }"}'
```

## Contributing

When contributing:
1. Follow TypeScript strict mode
2. Update GraphQL schema for data changes
3. Regenerate types: `npm run codegen`
4. Test all environments before deploying

## License

This project is part of a LaunchSchool Capstone project.
