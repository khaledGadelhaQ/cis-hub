export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  jwtSecret: string;
  apiPrefix: string;
  corsOrigins: string[];
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'mu-compass',
    ssl: process.env.DATABASE_SSL === 'true',
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
});
