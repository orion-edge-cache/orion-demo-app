# AWS Lambda Serverless Deployment Implementation Plan

**Project:** GraphQL Edge Cache Demo Application  
**Goal:** Convert GraphQL app to run on AWS Lambda with persistent JSON-backed database  
**Deployment Tool:** graphql-deploy CLI  
**Environments:** localhost + AWS Lambda  
**Timeline:** Phased approach (Phase 1 → Phase 2 → Phase 3)  
**Architecture:** Simplified (No CloudFront, No Route 53)

---

## Executive Summary

This document outlines the complete plan to convert your GraphQL application (currently running on Express.js with json-server) to AWS Lambda with S3-backed persistent storage, automated deployment via Terraform, and a custom CLI tool for operations.

### Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database for Lambda | JSON files in S3 + Lambda /tmp cache | Lightweight, persistent, minimal complexity |
| Separate DB files | Keep users.json, posts.json, comments.json | Needed for reset functionality |
| AWS Domain | S3 + API Gateway URLs (AWS-generated) | Two separate endpoints, no custom domain needed |
| React Deployment | S3 Static Website Hosting | Simple, direct serving, no CDN needed for demo |
| CloudFront | **NOT USED** | Unnecessary complexity for demo, adds latency |
| Route 53 | **NOT USED** | No custom domain, not needed |
| Terraform Backend | Local state file | Solo dev, easy iteration; can migrate to S3 later |
| Deployment Tool | graphql-deploy CLI with @clack/prompts | User-friendly, interactive, clear feedback |
| CLI URL Injection | Auto-inject API Gateway URL into React build | Seamless deployment, no manual config |
| Environments | Only localhost and aws-lambda | Simplified, removes fastly/cloudfront/stellate overhead |

---

## Part 1: Understanding the Current Architecture

### Current Setup

```
Client (React)                    Server (Express)
├─ Vite dev server               ├─ Port 3002
├─ React 19 + Axios              ├─ GraphQL Yoga endpoint
├─ Auto-env detection            ├─ Express middleware
├─ Supports 4 environments        ├─ json-server for REST API
└─ Builds to dist/               ├─ File-based JSON database
                                 ├─ Separate user/post/comment files
                                 ├─ GraphQL resolvers call REST API
                                 └─ Reset mutation rebuilds db.json

Database Layer
├─ db.json (main database)
├─ users.json (reset source)
├─ posts.json (reset source)
├─ comments.json (reset source)
└─ json-server manages all I/O
```

### Current Resolver Pattern

Your GraphQL resolvers don't directly read JSON files. Instead:

1. `resolver.ts` calls `axios.get/post/put/delete` to REST endpoints
2. Express app routes `/api/*` to json-server
3. json-server handles file I/O and REST semantics
4. Reset mutation reads reset files, rebuilds db.json

**This is perfect for Lambda!** We keep this pattern intact.

---

## Part 2: Target Architecture

### Localhost Environment (No Changes)

```
Developer Machine
├─ npm run dev (server)
│  ├─ Express server on :3002
│  ├─ json-server reads from local ./db/json/db.json
│  └─ Detects DEPLOYMENT_ENV=localhost
├─ npm run dev (client)
│  ├─ Vite dev server on :5173
│  └─ Auto-detects localhost
└─ Everything works exactly as today
```

### AWS Lambda Environment (New)

```
AWS Account (us-east-1)
│
├─ S3 Bucket: graphql-app-client
│  ├─ Static website hosting enabled
│  ├─ Public read access
│  ├─ Serves React app (index.html, app.js, etc.)
│  └─ URL: http://bucket-name.s3-website-us-east-1.amazonaws.com
│
├─ API Gateway (HTTP API)
│  ├─ Routes to Lambda function
│  ├─ CORS enabled for S3 website + localhost
│  └─ URL: https://xxx.execute-api.us-east-1.amazonaws.com
│
├─ Lambda Function (Node.js 20.x)
│  ├─ 512 MB memory, 30 sec timeout
│  ├─ Source: ZIP file (built by CLI)
│  ├─ Entry point: lambda-handler.ts
│  ├─ Environment variables: DEPLOYMENT_ENV=aws-lambda, S3_BUCKET_NAME, AWS_REGION
│  │
│  └─ On invocation:
│     ├─ Cold start: Download db.json from S3 to /tmp
│     ├─ Warm start: Use cached /tmp/db.json
│     ├─ Run Express app + GraphQL Yoga
│     ├─ Mutations sync updated db.json back to S3
│     └─ Return response to API Gateway
│
└─ S3 Bucket: graphql-data
   └─ db.json (persistent database)
```

### Data Flow on Lambda

```
User loads React app:
  ↓
S3 Static Website (HTTP)
  ↓
React app loaded in browser
  ↓
GraphQL Request
  ↓
API Gateway (HTTPS)
  ↓
Lambda Function Handler
  ↓
Check /tmp/db.json exists?
  ├─ YES → Use cached copy
  └─ NO → Download from S3
  ↓
Start Express Server
  ↓
GraphQL/REST Request
  ├─ READ: json-server reads /tmp/db.json
  └─ WRITE: json-server writes /tmp/db.json → Sync to S3
  ↓
Return Response
  ↓
API Gateway
  ↓
Client receives response
```

### Two-URL Architecture

```
React App URL:    http://graphql-app-client.s3-website-us-east-1.amazonaws.com
GraphQL API URL:  https://xxx.execute-api.us-east-1.amazonaws.com/graphql
REST API URL:     https://xxx.execute-api.us-east-1.amazonaws.com/api
```

**Benefits of Two URLs:**
- Clear separation of concerns
- Direct API Gateway access (no CDN latency)
- Better demonstrates edge cache concept
- Simpler CORS configuration

---

## Part 3: Project Structure Changes

### New Directory Structure

```
basic_graphql_app/
├── .gitignore                       [MODIFIED] Add Terraform entries
│
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── json/
│   │   │   │   ├── users.json       [unchanged]
│   │   │   │   ├── posts.json       [unchanged]
│   │   │   │   ├── comments.json    [unchanged]
│   │   │   │   └── db.json          [unchanged]
│   │   │   └── s3-manager.ts        [NEW] Handle S3 I/O
│   │   ├── graphql/                 [unchanged]
│   │   ├── config.ts                [MODIFIED] Add aws-lambda env
│   │   ├── app.ts                   [MODIFIED] Add S3 init
│   │   └── server.ts                [unchanged]
│   │
│   ├── lambda-handler.ts            [NEW] Lambda entry point
│   ├── package.json                 [MODIFIED] Add AWS SDK deps
│   ├── tsconfig.json                [unchanged]
│   └── .env.example                 [MODIFIED] Add AWS vars
│
├── client/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts               [MODIFIED] Add aws-lambda detection
│   │   └── ...                      [unchanged]
│   └── package.json                 [unchanged]
│
├── terraform/                        [NEW] Infrastructure as Code
│   ├── main.tf                      Terraform config & providers
│   ├── variables.tf                 Input variables
│   ├── outputs.tf                   Output values
│   ├── terraform.tfvars             Variable values
│   ├── api_gateway.tf               API Gateway resource
│   ├── lambda.tf                    Lambda function & role
│   ├── iam.tf                       IAM policies
│   └── s3.tf                        S3 buckets (data + client website)
│
├── deploy-cli/                      [NEW] Deployment tool
│   ├── src/
│   │   ├── index.ts                 CLI entry point
│   │   ├── commands/
│   │   │   ├── build.ts             Build server & client
│   │   │   ├── package.ts           Create Lambda ZIP
│   │   │   ├── init.ts              terraform init
│   │   │   ├── plan.ts              terraform plan
│   │   │   ├── apply.ts             terraform apply
│   │   │   ├── destroy.ts           terraform destroy
│   │   │   └── logs.ts              CloudWatch logs (bonus)
│   │   └── utils/
│   │       ├── shell.ts             Shell command execution
│   │       ├── terraform.ts         Terraform helpers
│   │       ├── aws.ts               AWS helpers
│   │       ├── spinner.ts           @clack/prompts feedback
│   │       └── config.ts            CLI config management
│   │
│   ├── package.json                 CLI dependencies
│   ├── tsconfig.json                TypeScript config
│   └── README.md                    CLI usage guide
│
└── AWS_LAMBDA_IMPLEMENTATION_PLAN.md [This file] Reference guide
```

---

## Part 4: Phase 1 - Server-Side Modifications

### Objectives
- Add AWS Lambda support to existing Express app
- Implement S3 storage abstraction layer
- Create Lambda handler entry point
- Maintain backward compatibility with localhost

### 4.1 Update `.gitignore`

**Add these lines to existing `.gitignore`:**

```gitignore
# Terraform
terraform/.terraform/
terraform/terraform.tfstate
terraform/terraform.tfstate.backup
terraform/crash.log
terraform/*.tfvars.json
terraform/override.tf
terraform/override.tf.json

# CLI tool
deploy-cli/dist/
deploy-cli/node_modules/

# Build artifacts
*.zip
build/
lambda-function.zip
```

**Note:** `.terraform.lock.hcl` should NOT be in .gitignore (it should be committed)

### 4.2 Create S3 Storage Manager

**File: `server/src/db/s3-manager.ts`**

Purpose: Abstract S3 operations for database files. Handles:
- Downloading db.json from S3 on cold start
- Uploading updated db.json after mutations
- Caching in Lambda /tmp for warm starts
- Graceful fallback to local files for localhost

Key functions:
- `initializeS3Storage()`: Download from S3 to /tmp if needed
- `syncDBToS3()`: Upload updated file back to S3
- `getDBPath()`: Return path to db.json (local or /tmp)
- `isS3Enabled()`: Check if S3 manager is active

### 4.3 Modify `server/src/config.ts`

Changes needed:
- Add `'aws-lambda'` to `DeploymentEnv` type
- Add new environment variables to `CONFIG` object:
  - `AWS_REGION`: AWS region (from env var)
  - `S3_BUCKET_NAME`: S3 bucket for data (from env var)
- Update `getDeploymentEnv()` function:
  - Check `DEPLOYMENT_ENV` first
  - If "production" → default to "aws-lambda"
  - Otherwise → localhost

### 4.4 Modify `server/src/app.ts`

Changes needed:
- Import `s3-manager.ts`
- Add initialization logic:
  ```typescript
  if (CURRENT_CONFIG.environment === 'aws-lambda') {
    await initializeS3Storage();
  }
  ```
- Ensure json-server points to correct db.json path:
  ```typescript
  const dbJsonPath = CURRENT_CONFIG.environment === 'aws-lambda'
    ? '/tmp/db.json'
    : path.join(__dirname, 'db/json/db.json');
  ```
- Add S3 sync hook after mutations (POST/PUT/DELETE to /api)

### 4.5 Create Lambda Handler

**File: `server/lambda-handler.ts`**

Purpose: Entry point for Lambda that wraps Express app

Implementation uses `serverless-http` library:
- Converts API Gateway events to HTTP requests
- Passes to Express app
- Converts Express responses back to Lambda format
- Simple, no code changes to existing app

### 4.6 Update `server/package.json`

Add dependencies:
```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.705.0",
    "serverless-http": "^3.2.0"
  }
}
```

Update scripts:
```json
{
  "scripts": {
    "dev": "npx tsx --watch src/server.ts",
    "build": "tsc && cpy 'src/graphql/schema.graphql' dist/ --parents && cpy src/db/json/*.json dist/ --parents && cpy package* dist/ --parents",
    "build:lambda": "npm run build"
  }
}
```

### 4.7 Update Client Configuration

**File: `client/src/config/env.ts`**

Add aws-lambda environment detection:
```typescript
function getDeploymentEnv(): DeploymentEnv {
  // 1. Explicit override
  const envOverride = import.meta.env.VITE_DEPLOYMENT_ENV;
  if (envOverride) return envOverride as DeploymentEnv;

  // 2. Auto-detect from hostname
  const hostname = window.location.hostname;
  
  if (hostname.includes('s3-website')) {
    return 'aws-lambda';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }

  // 3. Default
  return 'localhost';
}
```

Add aws-lambda config:
```typescript
const CONFIG = {
  localhost: {
    environment: 'localhost' as const,
    graphqlUrl: 'http://localhost:3002/graphql',
    corsOrigin: 'http://localhost:5173',
    port: 3002,
    apiUrl: 'http://localhost:3002/api',
  },
  'aws-lambda': {
    environment: 'aws-lambda' as const,
    graphqlUrl: import.meta.env.VITE_API_GATEWAY_URL || '',
    apiUrl: import.meta.env.VITE_API_GATEWAY_URL?.replace('/graphql', '/api') || '',
    corsOrigin: '', // Not used client-side
    port: 0, // Not used
  },
};
```

### Phase 1 Testing Checklist

- [ ] `npm run build` completes successfully in server/
- [ ] TypeScript compiles without errors
- [ ] `DEPLOYMENT_ENV=localhost npm run dev` works as before
- [ ] localhost queries/mutations still function
- [ ] Reset mutation still works with local files
- [ ] No changes to GraphQL schema or resolvers needed
- [ ] JSON files can be read and written normally
- [ ] Client builds successfully

---

## Part 5: Phase 2 - Terraform Infrastructure as Code

### Objectives
- Define all AWS resources in code
- Enable reproducible deployments
- Support clean teardown
- Keep state local (can migrate to S3 backend later)

### 5.1 Directory Structure

Create `terraform/` directory with the following files:
- main.tf
- variables.tf
- outputs.tf
- terraform.tfvars
- api_gateway.tf
- lambda.tf
- iam.tf
- s3.tf

### 5.2 Main Configuration

**File: `terraform/main.tf`**

Contains:
- Terraform version requirements
- Provider configuration (AWS)
- Local state backend (no remote backend)
- Required provider versions

```terraform
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
```

### 5.3 Variables

**File: `terraform/variables.tf`**

Defines all input variables:
- `aws_region`: AWS region (default: us-east-1)
- `app_name`: Application name (default: graphql-app)
- `environment`: Environment name (default: prod)
- `lambda_memory`: Lambda memory in MB (default: 512)
- `lambda_timeout`: Lambda timeout in seconds (default: 30)

```terraform
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "graphql-app"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}
```

### 5.4 S3 Buckets

**File: `terraform/s3.tf`**

Creates two S3 buckets:

1. **Data Bucket** (`graphql-data-${account_id}`)
   - Stores `db.json`
   - Lambda has read/write access
   - Versioning enabled (for recovery)
   - Private (not public)

2. **Client Bucket** (`graphql-app-client-${account_id}`)
   - Stores React build files
   - Static website hosting enabled
   - Public read access
   - index.html as default document

```terraform
# Data bucket for database
resource "aws_s3_bucket" "data" {
  bucket = "${var.app_name}-data-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name        = "${var.app_name}-data"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Client bucket for React app with static website hosting
resource "aws_s3_bucket" "client" {
  bucket = "${var.app_name}-client-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name        = "${var.app_name}-client"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_website_configuration" "client" {
  bucket = aws_s3_bucket.client.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # SPA routing
  }
}

resource "aws_s3_bucket_public_access_block" "client" {
  bucket = aws_s3_bucket.client.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "client" {
  bucket = aws_s3_bucket.client.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.client.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.client]
}
```

### 5.5 IAM Roles and Policies

**File: `terraform/iam.tf`**

Creates IAM role for Lambda with policies to:
- Execute Lambda function (base execution role)
- Read/write to data bucket (S3)
- Write CloudWatch Logs

```terraform
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.app_name}-lambda-s3-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
      }
    ]
  })
}
```

### 5.6 Lambda Function

**File: `terraform/lambda.tf`**

Creates Lambda function with:
- Source: ZIP file (path: `../lambda-function.zip`)
- Runtime: nodejs20.x
- Handler: `dist/lambda-handler.handler`
- Memory: 512 MB (configurable)
- Timeout: 30 seconds (configurable)
- Environment variables

```terraform
resource "aws_lambda_function" "graphql" {
  filename      = "${path.module}/../lambda-function.zip"
  function_name = "${var.app_name}-function"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/lambda-handler.handler"
  runtime       = "nodejs20.x"
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout
  
  source_code_hash = filebase64sha256("${path.module}/../lambda-function.zip")

  environment {
    variables = {
      DEPLOYMENT_ENV = "aws-lambda"
      S3_BUCKET_NAME = aws_s3_bucket.data.id
      AWS_REGION     = var.aws_region
      NODE_ENV       = "production"
    }
  }

  tags = {
    Name        = "${var.app_name}-function"
    Environment = var.environment
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.graphql.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.graphql.execution_arn}/*/*"
}
```

### 5.7 API Gateway

**File: `terraform/api_gateway.tf`**

Creates HTTP API with:
- ANY method for all paths (catch-all)
- Integration with Lambda function
- CORS enabled for localhost + S3 website domain
- Stage: "$default"

```terraform
resource "aws_apigatewayv2_api" "graphql" {
  name          = "${var.app_name}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = [
      "http://localhost:5173",
      "http://${aws_s3_bucket.client.bucket}.s3-website-${var.aws_region}.amazonaws.com"
    ]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = {
    Name        = "${var.app_name}-api"
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.graphql.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Name        = "${var.app_name}-api-stage"
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.graphql.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.graphql.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.graphql.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}
```

### 5.8 Outputs

**File: `terraform/outputs.tf`**

Exports useful values:
- API Gateway endpoint URL
- S3 website endpoint
- S3 bucket names
- Lambda function name

```terraform
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.graphql.api_endpoint
}

output "graphql_endpoint" {
  description = "GraphQL endpoint URL"
  value       = "${aws_apigatewayv2_api.graphql.api_endpoint}/graphql"
}

output "api_url" {
  description = "REST API endpoint URL"
  value       = "${aws_apigatewayv2_api.graphql.api_endpoint}/api"
}

output "s3_website_endpoint" {
  description = "S3 static website endpoint"
  value       = aws_s3_bucket_website_configuration.client.website_endpoint
}

output "s3_website_url" {
  description = "S3 static website URL"
  value       = "http://${aws_s3_bucket.client.bucket}.s3-website-${var.aws_region}.amazonaws.com"
}

output "data_bucket" {
  description = "S3 bucket for database"
  value       = aws_s3_bucket.data.id
}

output "client_bucket" {
  description = "S3 bucket for client files"
  value       = aws_s3_bucket.client.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.graphql.function_name
}
```

### 5.9 Variable Values

**File: `terraform/terraform.tfvars`**

Concrete values for variables:
```hcl
aws_region     = "us-east-1"
app_name       = "graphql-app"
environment    = "prod"
lambda_memory  = 512
lambda_timeout = 30
```

### Phase 2 Testing Checklist

- [ ] `terraform init` completes successfully
- [ ] `terraform validate` shows no errors
- [ ] `terraform plan` shows expected resources
- [ ] Can review all resource definitions
- [ ] S3 buckets will be created with correct names
- [ ] Lambda execution role has correct permissions
- [ ] API Gateway CORS configured properly
- [ ] No resources deployed yet (waiting for Phase 3)

---

## Part 6: Phase 3 - Deployment CLI Tool

### Objectives
- Automate build, package, and deployment workflow
- Provide user-friendly interactive prompts
- Handle Terraform operations
- Show clear status and output
- Auto-inject API Gateway URL into React build

### 6.1 Directory Structure

```
deploy-cli/
├── src/
│   ├── index.ts                Main entry point
│   ├── commands/
│   │   ├── build.ts            Build server & client
│   │   ├── package.ts          Package Lambda ZIP
│   │   ├── init.ts             terraform init
│   │   ├── plan.ts             terraform plan (preview)
│   │   ├── apply.ts            terraform apply (deploy)
│   │   ├── destroy.ts          terraform destroy (cleanup)
│   │   └── logs.ts             CloudWatch logs (bonus)
│   └── utils/
│       ├── shell.ts            Execute bash commands
│       ├── terraform.ts        Terraform helpers
│       ├── aws.ts              AWS CLI helpers
│       ├── spinner.ts          Progress indicators
│       └── config.ts           CLI configuration
├── package.json
├── tsconfig.json
└── README.md
```

### 6.2 CLI Commands

#### Command: `graphql-deploy build`

**Purpose:** Build TypeScript to JavaScript for both server and client

**Steps:**
1. Run `npm run build` in server/
2. Get API Gateway URL from Terraform outputs
3. Build client with injected URL: `VITE_API_GATEWAY_URL=<url> npm run build`
4. Show completion status

**Output:**
```
✓ Built server
✓ Retrieved API Gateway URL
✓ Built client with injected URL
Ready for packaging
```

#### Command: `graphql-deploy package`

**Purpose:** Create Lambda deployment package

**Steps:**
1. Verify server build exists (`dist/` folder)
2. Install production dependencies in dist/
3. Create ZIP file with server build + node_modules
4. Create `lambda-function.zip` in project root
5. Show file size

**Output:**
```
✓ Packaged Lambda function
  Size: 15.2 MB
  File: lambda-function.zip
```

#### Command: `graphql-deploy init`

**Purpose:** Initialize Terraform (one-time setup)

**Steps:**
1. Check if Terraform is installed
2. Ask for AWS region (default: us-east-1)
3. Create/update `terraform.tfvars`
4. Run `terraform init`
5. Run `terraform validate`

**Output:**
```
? AWS Region: [us-east-1]
? Application name: [graphql-app]
✓ Terraform initialized
✓ Configuration validated
```

#### Command: `graphql-deploy plan`

**Purpose:** Preview what Terraform will do

**Steps:**
1. Run `terraform plan`
2. Show resource changes summary
3. Ask user to confirm before apply

**Output:**
```
Plan: 8 to add, 0 to change, 0 to destroy

Resources to create:
  - aws_lambda_function
  - aws_s3_bucket (2)
  - aws_api_gateway_v2_api
  - aws_api_gateway_v2_integration
  - aws_iam_role
  ... and 2 more
```

#### Command: `graphql-deploy apply`

**Purpose:** Deploy everything (build → package → terraform apply → upload files)

**Steps:**
1. Prompt: "Deploy to AWS? (y/N)"
2. Run `graphql-deploy build`
3. Run `graphql-deploy package`
4. Run `terraform apply`
5. Upload initial `db.json` to S3 data bucket
6. Upload React build to S3 client bucket
7. Show deployment summary with URLs

**Output:**
```
Building application...
✓ Server built
✓ Client built with API URL injected

Packaging Lambda...
✓ Lambda function packaged (15.2 MB)

Deploying to AWS...
✓ Terraform apply complete
✓ Uploaded db.json to S3
✓ Uploaded React build to S3

Deployment Summary:
  GraphQL Endpoint: https://xxx.execute-api.us-east-1.amazonaws.com/graphql
  REST API Endpoint: https://xxx.execute-api.us-east-1.amazonaws.com/api
  React App URL: http://graphql-app-client-123456789.s3-website-us-east-1.amazonaws.com
  Data Bucket: graphql-data-123456789
  Client Bucket: graphql-app-client-123456789

Next steps:
  1. Test GraphQL: curl https://xxx.execute-api.us-east-1.amazonaws.com/graphql -X POST -d '{"query":"{users{id name}}"}'
  2. Open React app: http://graphql-app-client-123456789.s3-website-us-east-1.amazonaws.com
  3. View logs: graphql-deploy logs
```

#### Command: `graphql-deploy destroy`

**Purpose:** Tear down all AWS resources

**Steps:**
1. Prompt: "Delete all AWS resources? (y/N)"
2. Empty S3 buckets (required before deletion)
3. Run `terraform destroy`
4. Confirm state is destroyed

**Output:**
```
⚠ Are you sure you want to destroy all resources?
  - Lambda function
  - API Gateway
  - S3 buckets (will be emptied first)
  - IAM roles

Type 'yes' to confirm: yes
✓ Emptied S3 buckets
✓ All resources destroyed
```

#### Command: `graphql-deploy logs` (Bonus)

**Purpose:** View recent Lambda logs

**Steps:**
1. Query CloudWatch Logs for Lambda
2. Show last 50 lines
3. Optional: follow mode (-f flag)

### 6.3 Key Implementation Details

#### Auto-Inject API Gateway URL

The CLI will:
1. Run `terraform apply`
2. Get API Gateway URL from outputs: `terraform output -raw api_endpoint`
3. Build client with injected URL: `VITE_API_GATEWAY_URL=<url>/graphql npm run build`
4. Upload client build to S3

This ensures the React app always knows the correct GraphQL endpoint.

#### Shell Execution (`utils/shell.ts`)

Wraps child_process to execute bash commands:
```typescript
export async function executeCommand(
  command: string,
  options?: {
    cwd?: string;
    verbose?: boolean;
  }
): Promise<{stdout: string; stderr: string; code: number}>
```

#### Terraform Helpers (`utils/terraform.ts`)

Wraps Terraform CLI:
```typescript
export async function terraformInit(workDir: string): Promise<void>
export async function terraformPlan(workDir: string): Promise<string>
export async function terraformApply(workDir: string): Promise<void>
export async function terraformDestroy(workDir: string): Promise<void>
export async function getOutput(workDir: string, outputName: string): Promise<string>
```

#### AWS Helpers (`utils/aws.ts`)

AWS CLI wrappers:
```typescript
export async function uploadFileToS3(bucket: string, key: string, filePath: string): Promise<void>
export async function uploadDirectoryToS3(bucket: string, localDir: string): Promise<void>
export async function emptyS3Bucket(bucket: string): Promise<void>
export async function getLambdaLogs(functionName: string, lines?: number): Promise<string>
```

### 6.4 Dependencies

```json
{
  "name": "graphql-deploy",
  "version": "1.0.0",
  "bin": {
    "graphql-deploy": "./dist/index.js"
  },
  "dependencies": {
    "@clack/prompts": "^0.7.0",
    "commander": "^11.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  }
}
```

### 6.5 Entry Point

**File: `deploy-cli/src/index.ts`**

Uses Commander.js to define CLI:
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { buildCommand } from './commands/build.js';
import { packageCommand } from './commands/package.js';
import { initCommand } from './commands/init.js';
import { planCommand } from './commands/plan.js';
import { applyCommand } from './commands/apply.js';
import { destroyCommand } from './commands/destroy.js';
import { logsCommand } from './commands/logs.js';

const program = new Command();

program
  .name('graphql-deploy')
  .description('Deploy GraphQL app to AWS Lambda')
  .version('1.0.0');

program
  .command('build')
  .description('Build server and client')
  .action(buildCommand);

program
  .command('package')
  .description('Package Lambda function')
  .action(packageCommand);

program
  .command('init')
  .description('Initialize Terraform')
  .action(initCommand);

program
  .command('plan')
  .description('Preview Terraform changes')
  .action(planCommand);

program
  .command('apply')
  .description('Deploy to AWS')
  .action(applyCommand);

program
  .command('destroy')
  .description('Destroy all AWS resources')
  .action(destroyCommand);

program
  .command('logs')
  .description('View Lambda logs')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action(logsCommand);

program.parse();
```

### Phase 3 Testing Checklist

- [ ] CLI help works: `graphql-deploy --help`
- [ ] `graphql-deploy build` compiles both projects
- [ ] `graphql-deploy package` creates lambda-function.zip
- [ ] `graphql-deploy init` runs terraform init
- [ ] `graphql-deploy plan` shows resource preview
- [ ] `graphql-deploy apply` successfully deploys
  - [ ] Lambda function created
  - [ ] API Gateway created
  - [ ] S3 buckets created
  - [ ] React build uploaded to S3
  - [ ] db.json uploaded to S3
  - [ ] Outputs show correct URLs
  - [ ] Client loads with correct GraphQL URL
- [ ] `graphql-deploy logs` shows Lambda logs
- [ ] `graphql-deploy destroy` tears down resources
- [ ] State file present: `terraform/terraform.tfstate`

---

## Part 7: Environment Configuration

### Environment Variables

#### Server `.env`

**Local development:**
```env
DEPLOYMENT_ENV=localhost
NODE_ENV=development
```

**Lambda (set by Terraform):**
```env
DEPLOYMENT_ENV=aws-lambda
NODE_ENV=production
AWS_REGION=us-east-1
S3_BUCKET_NAME=graphql-data-123456789
```

#### Client Configuration

**Client detects environment by:**
1. `VITE_DEPLOYMENT_ENV` environment variable (override)
2. Hostname pattern matching
3. Default: localhost

Hostname patterns:
- `s3-website` in hostname → aws-lambda
- `localhost` or `127.0.0.1` → localhost

API Gateway URL injection:
- Build time: `VITE_API_GATEWAY_URL` environment variable (set by CLI)
- Runtime: Client uses injected URL from build

### Configuration Priority

```
Server Environment Detection:
1. DEPLOYMENT_ENV environment variable (explicit)
2. NODE_ENV mapping (production → aws-lambda)
3. Default → localhost

Client Environment Detection:
1. VITE_DEPLOYMENT_ENV env var (override)
2. Hostname matching
3. Default → localhost

Client API URL:
1. VITE_API_GATEWAY_URL injected at build time (by CLI)
2. Fallback to localhost for development
```

---

## Part 8: Deployment Workflow

### Local Development (No Changes)

```bash
cd server
DEPLOYMENT_ENV=localhost npm run dev

# In another terminal
cd client
npm run dev
```

### Initial AWS Deployment

```bash
# From project root
graphql-deploy init      # Setup Terraform (one-time)
graphql-deploy apply     # Build, package, deploy everything
```

### Subsequent Updates

```bash
# After code changes
graphql-deploy apply     # Rebuild, repackage, redeploy
```

### View Logs

```bash
graphql-deploy logs
graphql-deploy logs -f   # Follow mode
graphql-deploy logs -n 100  # Show last 100 lines
```

### Teardown

```bash
graphql-deploy destroy
```

---

## Part 9: Data Flow

### Initial Data Setup

1. Build project: `graphql-deploy apply`
2. CLI uploads current `db.json` to S3 bucket
3. Lambda downloads on first invocation
4. Data is ready

### Cold Start Flow (Lambda)

```
1. API request hits API Gateway
2. Gateway invokes Lambda function
3. Lambda function starts (cold start ~3-5 sec)
   a. Node.js runtime starts
   b. lambda-handler.ts runs
   c. app.ts initializes
   d. S3 manager checks /tmp/db.json
4. File doesn't exist in /tmp (cold start)
5. Download db.json from S3 to /tmp
6. Start Express server with json-server
7. Route request to Express
8. GraphQL Yoga processes request
9. json-server reads from /tmp/db.json
10. Return response
11. Sync db.json back to S3 (if mutation)
```

**Total time:** ~3-5 seconds (first invocation)

### Warm Start Flow (Lambda)

```
1. API request hits API Gateway
2. Gateway invokes Lambda function (reused container)
3. Lambda function runs (warm start ~100ms)
   a. lambda-handler.ts already in memory
   b. S3 manager checks /tmp/db.json
4. File exists in /tmp (from previous invocation)
5. Skip S3 download
6. Express server already initialized
7. Route request to Express
8. GraphQL Yoga processes request
9. json-server reads from /tmp/db.json
10. Return response
11. Sync db.json back to S3 (if mutation)
```

**Total time:** ~100ms

### Mutation Flow

```
1. Client sends GraphQL mutation
2. GraphQL resolver calls REST API endpoint
3. Express routes to json-server
4. json-server parses request (POST/PUT/DELETE)
5. Writes to /tmp/db.json
6. Returns response to resolver
7. Resolver returns result
8. S3 manager syncs /tmp/db.json to S3
9. Response sent back to client
```

**Key:** S3 sync happens after every write, ensuring durability.

---

## Part 10: Terraform State Management

### Local State (Current Choice)

State file location: `terraform/terraform.tfstate`

**Advantages:**
- Simple setup, no additional resources needed
- Fast iteration during development
- Easy to understand and debug
- Good for solo developers

**Disadvantages:**
- State only on your machine
- No team collaboration
- State loss if machine failure (but recoverable)

**Backup strategy:**
```bash
# Backup manually:
cp terraform/terraform.tfstate terraform/terraform.tfstate.backup

# Or use AWS CLI to query state:
aws lambda list-functions  # Query AWS directly to refresh
```

### Migration to S3 Backend (Future)

When ready to move to team collaboration or production:

1. Create S3 backend state bucket (via Terraform or AWS console)
2. Add to `terraform/main.tf`:
```terraform
terraform {
  backend "s3" {
    bucket         = "graphql-terraform-state"
    key            = "graphql-app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
  }
}
```
3. Run `terraform init` and migrate state
4. Remove `terraform.tfstate` from local filesystem

---

## Part 11: Cost Analysis

### Free Tier Estimates (Per Month)

| Service | Usage | Cost |
|---------|-------|------|
| **Lambda** | 1M requests | $0.00 (free tier) |
| **API Gateway** | 1M requests | $0.00 (HTTP API free tier for 12 months) |
| **S3 Storage** | <1 GB storage | ~$0.02 |
| **S3 Requests** | 1M GET/PUT requests | ~$0.01 |
| **S3 Transfer** | <1 GB transfer | $0.00 (free tier) |
| **CloudWatch Logs** | <5 GB logs | $0.00 (free tier) |
| **Total** | Demo usage | **< $1/month** |

**Note:** 
- First 12 months of AWS free tier includes generous limits
- This demo will not exceed them
- No CloudFront costs (not using CDN)
- S3 website hosting is free (only pay for storage and transfer)

---

## Part 12: Troubleshooting Guide

### Common Issues & Solutions

#### Lambda Timeout

**Symptom:** GraphQL requests timeout after 30 seconds

**Solutions:**
1. Increase timeout: Edit `terraform/variables.tf`, increase `lambda_timeout`
2. Check S3 download speed: Look at CloudWatch logs
3. Verify IAM role has S3 permissions

#### Cold Start Performance

**Symptom:** First request takes 3-5 seconds

**Solution:** This is expected! Lambda is architected for burst traffic, not guaranteed performance. For production, use:
- Provisioned concurrency (cost: ~$1.50/hour)
- Lambda@Edge (more complex)

For a demo, cold starts are acceptable.

#### CORS Errors

**Symptom:** Browser shows CORS error

**Solutions:**
1. Verify S3 website URL matches API Gateway CORS configuration
2. Check `terraform/api_gateway.tf` has correct allowed origins
3. Ensure API Gateway CORS includes S3 website domain
4. Check browser console for exact error message

#### S3 Permission Denied (Lambda accessing data bucket)

**Symptom:** Lambda logs show "Access Denied" to S3

**Solutions:**
1. Verify Lambda IAM role has S3 permissions (check `terraform/iam.tf`)
2. Check S3 bucket policy allows Lambda execution role
3. Verify bucket name in Lambda environment variables

#### S3 Website Hosting 403 Errors

**Symptom:** Browser shows AccessDenied when loading React app

**Solutions:**
1. Verify bucket policy allows public read (`s3:GetObject`)
2. Check public access block settings are disabled
3. Verify website hosting is enabled on bucket
4. Check index.html exists in root of bucket

#### db.json Upload Fails

**Symptom:** `graphql-deploy apply` fails on db.json upload

**Solutions:**
1. Verify S3 bucket was created: `aws s3 ls`
2. Verify AWS credentials are valid
3. Check S3 bucket exists before upload
4. Try manual upload: `aws s3 cp server/src/db/json/db.json s3://bucket-name/db.json`

#### Client Shows Empty GraphQL URL

**Symptom:** React app loads but API calls fail

**Solutions:**
1. Verify `VITE_API_GATEWAY_URL` was injected during build
2. Check CLI build step output for API Gateway URL
3. Rebuild client: `graphql-deploy build`
4. Check browser console for actual URL being used

---

## Part 13: Testing Checklist

### Pre-Deployment

- [ ] Localhost works as expected
- [ ] All GraphQL queries work
- [ ] All mutations work
- [ ] Reset mutation works
- [ ] Client builds successfully
- [ ] Server builds successfully
- [ ] `terraform validate` passes
- [ ] AWS credentials configured

### Post-Deployment

- [ ] API Gateway URL is accessible
- [ ] GraphQL query works via API Gateway
- [ ] Mutation updates db.json on S3
- [ ] S3 website serves React app
- [ ] Client can reach GraphQL endpoint
- [ ] Lambda logs show successful requests
- [ ] S3 data bucket has db.json
- [ ] S3 client bucket has React build files
- [ ] React app loads and displays data
- [ ] Mutations persist across Lambda invocations

### Rollback Testing

- [ ] `graphql-deploy destroy` removes all resources
- [ ] S3 buckets are emptied and deleted
- [ ] AWS account is clean after destroy
- [ ] Can redeploy with `graphql-deploy apply`

---

## Part 14: Documentation Files to Create

After implementation:

1. **`deploy-cli/README.md`**
   - CLI usage guide
   - Command reference
   - Examples

2. **`terraform/README.md`**
   - Terraform module descriptions
   - Variable explanations
   - How to modify resources

3. **Update main `README.md`**
   - Add AWS deployment section
   - Link to other docs
   - Quick start guide

---

## Part 15: Next Steps

Implementation will proceed in 3 phases:

### Phase 1: Server Modifications (Est. 2-3 hours)
- [ ] Update .gitignore
- [ ] Create `s3-manager.ts`
- [ ] Modify `config.ts`
- [ ] Modify `app.ts`
- [ ] Create `lambda-handler.ts`
- [ ] Update `package.json`
- [ ] Update client `env.ts`
- [ ] Test locally

### Phase 2: Terraform Setup (Est. 2-3 hours)
- [ ] Create `terraform/` directory
- [ ] Write main.tf
- [ ] Write variables.tf
- [ ] Write s3.tf
- [ ] Write iam.tf
- [ ] Write lambda.tf
- [ ] Write api_gateway.tf
- [ ] Write outputs.tf
- [ ] Write terraform.tfvars
- [ ] Validate configuration
- [ ] Test with `terraform plan`

### Phase 3: CLI Tool (Est. 3-4 hours)
- [ ] Create `deploy-cli/` structure
- [ ] Implement build command
- [ ] Implement package command
- [ ] Implement init command
- [ ] Implement plan command
- [ ] Implement apply command (with URL injection)
- [ ] Implement destroy command
- [ ] Implement logs command
- [ ] Test each command
- [ ] Create CLI documentation

---

## Appendix A: Key AWS Services Overview

### Lambda
- Serverless compute
- Pay per invocation
- Auto-scales automatically
- 15-minute execution limit
- 512 MB to 10 GB memory
- /tmp storage: 512 MB (ephemeral)

### API Gateway (HTTP API)
- HTTP/REST API management
- Routes requests to Lambda
- Handles CORS automatically
- CloudWatch monitoring included
- Lower cost than REST API
- No caching (simpler)

### S3
- Object storage
- Durable (99.999999999% durability)
- Cost-effective for small files
- Versioning available
- Static website hosting
- Public or private access

### IAM
- Identity and access management
- Role-based access control
- Fine-grained permissions
- Service-to-service authentication

---

## Appendix B: Useful AWS CLI Commands

```bash
# List Lambda functions
aws lambda list-functions

# Get Lambda logs
aws logs tail /aws/lambda/graphql-app-function --follow

# List S3 buckets
aws s3 ls

# Upload file to S3
aws s3 cp db.json s3://bucket-name/db.json

# Sync directory to S3
aws s3 sync client/dist/ s3://bucket-name/ --delete

# Empty S3 bucket
aws s3 rm s3://bucket-name --recursive

# Get API Gateway endpoints
aws apigatewayv2 get-apis

# Invoke Lambda directly
aws lambda invoke --function-name graphql-app-function output.json

# Get Terraform outputs
cd terraform && terraform output
```

---

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **Cold Start** | First Lambda invocation after deployment; takes 3-5 seconds |
| **Warm Start** | Subsequent Lambda invocation reusing warm container; <100ms |
| **Ephemeral** | Temporary; not persisted between invocations |
| **IaC** | Infrastructure as Code; defining infrastructure in code files |
| **State** | Terraform's record of deployed resources |
| **CORS** | Cross-Origin Resource Sharing; allows cross-domain requests |
| **S3** | AWS Simple Storage Service (object storage) |
| **Lambda** | AWS serverless compute service |
| **API Gateway** | AWS service that creates REST/HTTP APIs |
| **HTTP API** | Simpler, cheaper version of API Gateway REST API |
| **Static Website Hosting** | S3 feature to serve HTML/JS/CSS directly |

---

## Appendix D: Architecture Comparison

### Before (Old Plan with CloudFront)

```
Pros:
  - Single domain for all resources
  - Global CDN caching for static assets
  - Familiar CDN pattern

Cons:
  - CloudFront adds latency for GraphQL
  - Complex caching policies needed
  - More AWS resources to manage
  - Higher cost (~$3/month)
  - Unnecessary for demo use case
```

### After (Current Plan - Simplified)

```
Pros:
  - Two URLs (better separation)
  - Direct API Gateway access (lower latency)
  - Simpler architecture (fewer resources)
  - Lower cost (<$1/month)
  - S3 website hosting (simple, effective)
  - Better for demonstrating edge cache concept

Cons:
  - Two URLs to manage (but preferred for demo)
  - No global CDN (not needed for demo)
  - S3 website is HTTP only (HTTPS requires CloudFront)
```

---

## Document History

- **2026-01-06**: Initial plan created
- **2026-01-06**: Updated to remove CloudFront and Route 53 (simplified architecture)
- **Status**: Ready for Phase 1 implementation
- **Next Review**: After Phase 1 completion

