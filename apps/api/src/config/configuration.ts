import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  apiPrefix: 'api/v1',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://petflow:petflow_secret@localhost:5432/petflow_dev?schema=public',
}));

export const redisConfig = registerAs('redis', () => {
  let host = process.env.REDIS_HOST || 'localhost';
  let port = parseInt(process.env.REDIS_PORT || '6379', 10);
  let password = process.env.REDIS_PASSWORD || undefined;
  let isTls = process.env.REDIS_TLS === 'true' || Boolean(process.env.REDIS_HOST && process.env.REDIS_HOST.includes('upstash.io'));

  if (process.env.REDIS_URL) {
    try {
      const parsedUrl = new URL(process.env.REDIS_URL);
      host = parsedUrl.hostname || host;
      port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (parsedUrl.protocol === 'rediss:' ? 6379 : port);
      if (parsedUrl.password) {
        password = decodeURIComponent(parsedUrl.password);
      }
      if (parsedUrl.protocol === 'rediss:' || parsedUrl.hostname.includes('upstash.io') || process.env.REDIS_TLS === 'true') {
        isTls = true;
      }
    } catch {
      // fallback to env vars
    }
  }

  return {
    url: process.env.REDIS_URL || `redis://${host}:${port}`,
    host,
    port,
    password,
    tls: isTls,
  };
});

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'petflow_super_secret_jwt_access_key_dev_only_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'petflow_super_secret_jwt_refresh_key_dev_only_change_in_prod',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
