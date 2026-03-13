// Database code lives in database/db.js — this file re-exports from there
// so that existing imports in src/models/ and src/controllers/ keep working.
export { sequelize, connectDatabase } from '../../database/db.js';
