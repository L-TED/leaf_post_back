import { DataSource } from 'typeorm';

// Optional .env loading for CLI/seed usage.
// If dotenv isn't installed, this no-ops.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
} catch {
  // no-op
}

import { Users } from '../users/entities/user.entity';
import { Emails } from '../emails/entities/email.entity';
import { VillagerTones } from '../emails/entities/villager-tones.entity';
import { RefreshTokens } from '../auth/entities/refreshToken.entity';
import { Villagers } from '../villagers/entities/villager.entity';

const required = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const sslEnabled = (() => {
  const raw = String(process.env.DB_SSL ?? '');
  return raw.toLowerCase() === 'true' || raw === '1';
})();

const sslRejectUnauthorized = (() => {
  const raw = String(process.env.DB_SSL_REJECT_UNAUTHORIZED ?? 'true');
  return raw.toLowerCase() === 'true' || raw === '1';
})();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: required('DB_HOST'),
  port: Number(process.env.DB_PORT ?? 5432),
  username: required('DB_USERNAME'),
  password: required('DB_PASSWORD'),
  database: required('DB_DATABASE'),
  ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : undefined,
  synchronize: false,
  entities: [Users, Emails, VillagerTones, RefreshTokens, Villagers],
  migrations: [
    // Keep a clear, explicit path for CLI.
    `${__dirname}/migrations/*{.ts,.js}`,
  ],
});
