type DeploymentEnv = 'aws-lambda' | 'localhost'

interface EnvConfig {
  port: number
  corsOrigin: string
  apiUrl: string
  environment: DeploymentEnv
  awsRegion?: string
  s3BucketName?: string
}

const isValidEnv = (env: string): env is DeploymentEnv => {
  return ['aws-lambda', 'localhost'].includes(env)
}

const getDeploymentEnv = (): DeploymentEnv => {
  // Priority 1: Explicit DEPLOYMENT_ENV variable
  const explicit = process.env.DEPLOYMENT_ENV
  if (explicit && isValidEnv(explicit)) {
    return explicit
  }

  // Priority 2: NODE_ENV mapping (fallback)
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') {
    return 'aws-lambda'
  }

  // Default to localhost
  return 'localhost'
}

// Build config from environment variables with defaults
const buildConfig = (): Record<DeploymentEnv, EnvConfig> => ({
  'aws-lambda': {
    port: 0, // Not used in Lambda
    corsOrigin: process.env.CORS_ORIGIN || '*', // CORS handled by API Gateway
    apiUrl: '/api', // Relative path in Lambda
    environment: 'aws-lambda',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
  },
  localhost: {
    port: parseInt(process.env.LOCALHOST_PORT || '3002', 10),
    corsOrigin: 'http://localhost:5173',
    apiUrl: 'http://localhost:3002/api',
    environment: 'localhost',
  }
})

export const DEPLOYMENT_ENV = getDeploymentEnv()
export const CONFIG = buildConfig()
export const CURRENT_CONFIG = CONFIG[DEPLOYMENT_ENV]

// Log detected environment
export const logEnvironment = () => {
  console.log(`🚀 Server starting in ${DEPLOYMENT_ENV} environment`)
  console.log(`📍 CORS Origin: ${CURRENT_CONFIG.corsOrigin}`)
}
