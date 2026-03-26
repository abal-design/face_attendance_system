import dotenv from 'dotenv';

dotenv.config();

const cleanEnvValue = (value) => String(value || '').split('#')[0].trim();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_NAME: process.env.DB_NAME || 'faceattend',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SYNC: (process.env.DB_SYNC || 'false').toLowerCase() === 'true',
  DB_LOGGING: (process.env.DB_LOGGING || 'false').toLowerCase() === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  AI_REQUEST_TIMEOUT_MS: Number(process.env.AI_REQUEST_TIMEOUT_MS || 15000),
  MAIL_USER: cleanEnvValue(process.env.MAIL_USER),
  MAIL_PASS: cleanEnvValue(process.env.MAIL_PASS).replace(/\s+/g, ''),
  MAIL_FROM: cleanEnvValue(process.env.MAIL_FROM || process.env.MAIL_USER),
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
};

export default env;
