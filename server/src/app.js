import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const uploadsPath = path.resolve('uploads');

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const allowedOrigins = (env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (for tools and same-machine checks).
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'faceattend-server' });
});

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
