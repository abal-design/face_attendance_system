import { createServer } from 'node:http';
import app from './src/app.js';
import env from './src/config/env.js';
import { connectDatabase, sequelize, initializeDatabase } from './database/db.js';

const server = createServer(app);

const startServer = async () => {
  try {
    await connectDatabase();      // Sequelize: verify connection
    await initializeDatabase();   // mysql2:    create tables from schema.sql

    server.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Closing server...`);
  server.close(async () => {
    await sequelize.close();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
