type DeploymentEnv = 'aws-lambda' | 'localhost'

interface EnvConfig {
  graphqlUrl: string
  apiUrl: string
  environment: DeploymentEnv
}

const isValidEnv = (env: string): env is DeploymentEnv => {
  return ['aws-lambda', 'localhost'].includes(env)
}

const getDeploymentEnv = (): DeploymentEnv => {
  // Priority 1: Explicit VITE_DEPLOYMENT_ENV (for testing/override)
  const explicit = import.meta.env.VITE_DEPLOYMENT_ENV as DeploymentEnv
  if (explicit && isValidEnv(explicit)) {
    return explicit
  }

  // Priority 2: Runtime hostname detection
  const hostname = window.location.hostname
  
  // S3 static website hosting
  if (hostname.includes('s3-website')) {
    return 'aws-lambda'
  }
  
  // Localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost'
  }

  // Unknown hostname, default to localhost
  return 'localhost'
}

// Config lookup table with hardcoded URLs
const buildConfig = (): Record<DeploymentEnv, EnvConfig> => {
  const hostname = window.location.hostname
  const protocol = window.location.protocol

  // API Gateway URL injected at build time by CLI
  const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || ''

  return {
    'aws-lambda': {
      graphqlUrl: apiGatewayUrl ? `${apiGatewayUrl}/graphql` : '',
      apiUrl: apiGatewayUrl ? `${apiGatewayUrl}/api` : '',
      environment: 'aws-lambda'
    },
    localhost: {
      graphqlUrl: `${protocol}//${hostname}:3002/graphql`,
      apiUrl: `${protocol}//${hostname}:3002/api`,
      environment: 'localhost'
    }
  }
}

export const DEPLOYMENT_ENV = getDeploymentEnv()
export const CONFIG = buildConfig()
export const CURRENT_CONFIG = CONFIG[DEPLOYMENT_ENV]

// Log detected environment
export const logEnvironment = () => {
  console.log(`🎨 Client running in ${DEPLOYMENT_ENV} environment`)
}
