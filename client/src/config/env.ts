type DeploymentEnv = 'fastly' | 'cloudfront' | 'stellate' | 'localhost'

interface EnvConfig {
  graphqlUrl: string
  apiUrl: string
  environment: DeploymentEnv
}

const isValidEnv = (env: string): env is DeploymentEnv => {
  return ['fastly', 'cloudfront', 'stellate', 'localhost'].includes(env)
}

const getDeploymentEnv = (): DeploymentEnv => {
  // Priority 1: Explicit VITE_DEPLOYMENT_ENV (for testing/override)
  const explicit = import.meta.env.VITE_DEPLOYMENT_ENV as DeploymentEnv
  if (explicit && isValidEnv(explicit)) {
    return explicit
  }

  // Priority 2: Runtime hostname detection
  const hostname = window.location.hostname
  if (hostname.includes('vfa102.website')) return 'fastly'
  if (hostname.includes('cloudfront') || hostname.includes('dixw5rir038vz')) return 'cloudfront'
  if (hostname.includes('stellate') || hostname.includes('capstone.stellate.sh')) return 'stellate'

  // Default to localhost if running on localhost or 127.0.0.1
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

  return {
    fastly: {
      graphqlUrl: 'https://vfa102.website/graphql',
      apiUrl: 'https://vfa102.website/api',
      environment: 'fastly'
    },
    cloudfront: {
      graphqlUrl: 'https://dixw5rir038vz.cloudfront.net/graphql',
      apiUrl: 'https://dixw5rir038vz.cloudfront.net/api',
      environment: 'cloudfront'
    },
    stellate: {
      graphqlUrl: 'https://capstone.stellate.sh/graphql',
      apiUrl: 'https://capstone.stellate.sh/api',
      environment: 'stellate'
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
