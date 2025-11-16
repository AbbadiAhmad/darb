import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  apiPrefix: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  security: {
    bcryptRounds: number;
  };
  cors: {
    origin: string;
  };
  audit: {
    retentionDays: number;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'darb',
    user: process.env.DB_USER || 'darb_user',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
  audit: {
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555', 10),
  },
};

export default config;
