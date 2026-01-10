/**
 * Configuration for the demo app Lambda function
 */
type DeploymentEnv = 'aws-lambda' | 'localhost';
interface EnvConfig {
    port: number;
    corsOrigin: string;
    environment: DeploymentEnv;
}
export declare const DEPLOYMENT_ENV: DeploymentEnv;
export declare const CONFIG: Record<DeploymentEnv, EnvConfig>;
export declare const CURRENT_CONFIG: EnvConfig;
export declare const logEnvironment: () => void;
export {};
//# sourceMappingURL=config.d.ts.map