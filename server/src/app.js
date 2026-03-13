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

app.use(
  cors({
    origin: env.CLIENT_URL,
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
