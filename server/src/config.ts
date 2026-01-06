type DeploymentEnv = 'fastly' | 'cloudfront' | 'stellate' | 'localhost'

interface EnvConfig {
  port: number
  corsOrigin: string
  apiUrl: string
  environment: DeploymentEnv
}

const isValidEnv = (env: string): env is DeploymentEnv => {
  return ['fastly', 'cloudfront', 'stellate', 'localhost'].includes(env)
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
    return 'fastly'
  }

  // Default to localhost
  return 'localhost'
}

// Build config from environment variables with defaults
const buildConfig = (): Record<DeploymentEnv, EnvConfig> => ({
  fastly: {
    port: parseInt(process.env.FASTLY_PORT || '3002', 10),
    corsOrigin: process.env.FASTLY_ORIGIN_URL || 'https://vfa102.website',
    apiUrl: `${process.env.FASTLY_ORIGIN_URL || 'https://vfa102.website'}/api`,
    environment: 'fastly'
  },
  cloudfront: {
    port: parseInt(process.env.CLOUDFRONT_PORT || '3002', 10),
    corsOrigin: process.env.CLOUDFRONT_ORIGIN_URL || 'https://dixw5rir038vz.cloudfront.net',
    apiUrl: `${process.env.CLOUDFRONT_ORIGIN_URL || 'https://dixw5rir038vz.cloudfront.net'}/api`,
    environment: 'cloudfront'
  },
  stellate: {
    port: parseInt(process.env.STELLATE_PORT || '3002', 10),
    corsOrigin: process.env.STELLATE_ORIGIN_URL || 'https://capstone.stellate.sh',
    apiUrl: `${process.env.STELLATE_ORIGIN_URL || 'https://capstone.stellate.sh'}/api`,
    environment: 'stellate'
  },
  localhost: {
    port: parseInt(process.env.LOCALHOST_PORT || '3002', 10),
    corsOrigin: 'http://localhost:5173',
    apiUrl: 'http://localhost:3002/api',
    environment: 'localhost'
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
