import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(dirname, '../.env')
});

export const config = {
  port: Number(process.env.PORT || 3333),
  host: process.env.HOST || '127.0.0.1',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 3333}`,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'copa_bolao'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'OFFICE CONT Bolao <bolao@officecont.cnt.br>'
  },
  enableReminders: String(process.env.ENABLE_REMINDERS || 'false') === 'true'
};
