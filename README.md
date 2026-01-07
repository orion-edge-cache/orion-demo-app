# @orion/demo-app-deploy

Deploy a demo GraphQL application to AWS Lambda for testing Orion edge cache.

## Overview

This package provides a self-contained demo GraphQL application that can be deployed to AWS Lambda with a React frontend hosted on S3. It's designed to give users a working GraphQL endpoint to test Orion's edge caching capabilities without needing an existing GraphQL API.

## Features

- **Pre-built Lambda function**: GraphQL server with sample data (users, posts, comments)
- **React frontend**: Simple UI to interact with the GraphQL API
- **Terraform infrastructure**: Automated AWS resource provisioning
- **Credential management**: Integrates with Orion's credential storage

## Installation

```bash
npm install @orion/demo-app-deploy
```

## Requirements

- Node.js 18+
- Terraform CLI
- AWS credentials with permissions for:
  - Lambda
  - API Gateway
  - S3
  - IAM

## Usage

### Deploy

```typescript
import { deployDemoApp } from '@orion/demo-app-deploy';

const outputs = await deployDemoApp(
  {
    aws: {
      accessKeyId: 'YOUR_ACCESS_KEY',
      secretAccessKey: 'YOUR_SECRET_KEY',
      region: 'us-east-1',
    },
  },
  (event) => {
    console.log(`[${event.step}] ${event.message} (${event.progress}%)`);
  }
);

console.log('GraphQL Endpoint:', outputs.graphqlEndpoint);
console.log('React App:', outputs.s3WebsiteUrl);
```

### Using Environment Variables

```typescript
import { deployDemoApp } from '@orion/demo-app-deploy';

const outputs = await deployDemoApp({
  aws: {
    useEnv: true, // Uses AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    region: 'us-east-1',
  },
});
```

### Check Status

```typescript
import { getDemoAppStatus, checkDemoAppDeployed } from '@orion/demo-app-deploy';

// Quick check
if (checkDemoAppDeployed()) {
  console.log('Demo app is deployed');
}

// Full status with outputs
const status = await getDemoAppStatus();
if (status.deployed) {
  console.log('GraphQL:', status.outputs?.graphqlEndpoint);
  console.log('Deployed at:', status.deployedAt);
}
```

### Destroy

```typescript
import { destroyDemoApp } from '@orion/demo-app-deploy';

await destroyDemoApp(
  {
    aws: {
      useEnv: true,
      region: 'us-east-1',
    },
  },
  (event) => {
    console.log(`[${event.step}] ${event.message}`);
  }
);
```

## API

### `deployDemoApp(config, onProgress?)`

Deploys the demo app to AWS.

**Parameters:**
- `config.aws.accessKeyId` - AWS access key (optional if `useEnv` is true)
- `config.aws.secretAccessKey` - AWS secret key (optional if `useEnv` is true)
- `config.aws.region` - AWS region (required)
- `config.aws.useEnv` - Use environment variables for credentials
- `onProgress` - Callback for progress updates

**Returns:** `Promise<DemoAppOutputs>`

### `destroyDemoApp(config, onProgress?)`

Destroys all AWS resources created by the demo app.

### `getDemoAppStatus()`

Returns the current deployment status and outputs.

### `checkDemoAppDeployed()`

Returns `true` if the demo app Terraform state exists.

## Demo App Details

The demo app includes:

### GraphQL Schema

```graphql
type Query {
  users: [User!]!
  posts: [Post!]!
  comments: [Comment!]!
  user(id: ID!): User
  post(id: ID!): Post
}

type Mutation {
  createUser(name: String!, email: String!): User
  createPost(title: String!, user_id: ID!, body: String!): Post
  createComment(post_id: ID!, user_id: ID!, body: String!): Comment
  updateUser(id: ID!, name: String!, email: String!): User
  updatePost(id: ID!, title: String!, user_id: ID!, body: String!): Post
  updateComment(id: ID!, post_id: ID!, user_id: ID!, body: String!): Comment
  deleteUser(id: ID!): User
  deletePost(id: ID!): Post
  deleteComment(id: ID!): Comment
  reset: DatabaseResetResult
}
```

### Sample Data

- 5 users
- 10 posts (2 per user)
- 20 comments

## File Storage

Deployment outputs are saved to `~/.config/orion/deployment-config.json` under the `demoApp` key:

```json
{
  "demoApp": {
    "graphqlEndpoint": "https://xxx.execute-api.us-east-1.amazonaws.com/graphql",
    "s3WebsiteUrl": "http://xxx.s3-website-us-east-1.amazonaws.com",
    "lambdaFunctionName": "orion-demo-app-function",
    "clientBucket": "orion-demo-app-client-123456789",
    "awsRegion": "us-east-1",
    "deployedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Terraform state is stored at `~/.config/orion/demo-app.tfstate`.

## License

MIT
