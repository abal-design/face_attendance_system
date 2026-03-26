import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import env from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/**
 * Shared MySQL connection pool.
 * Import this in any module that needs to run raw SQL queries.
 *
 * Usage:
 *   import pool from '../database/db.js';
 *   const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
 */
const pool = mysql.createPool({
  host:               env.DB_HOST,
  port:               Number(env.DB_PORT),
  user:               env.DB_USER,
  password:           env.DB_PASSWORD,
  database:           env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
});

/**
 * Run every CREATE TABLE statement in database/schema.sql.
 *
 * - All statements use CREATE TABLE IF NOT EXISTS → safe to call on every start.
 * - The ALTER TABLE that adds the circular FK (departments → teachers) is
 *   skipped silently on subsequent runs when the constraint already exists.
 */
export async function initializeDatabase() {
  const schemaPath = join(__dirname, 'schema.sql');
  const sql        = readFileSync(schemaPath, 'utf8');

  // Split on semicolons; discard empty and comment-only blocks.
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      const meaningful = s
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      return meaningful.length > 0;
    });

  const conn = await pool.getConnection();
  try {
    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        // 1826 = ER_FK_DUP_NAME    — FK constraint already exists
        // 1061 = ER_DUP_KEY_NAME   — duplicate key name
        // 1060 = ER_DUP_FIELDNAME  — duplicate column name
        // These can happen on idempotent ALTER TABLE lines; safe to skip.
        if (err.errno === 1826 || err.errno === 1061 || err.errno === 1060) continue;
        throw err;
      }
    }
    console.log('Database schema initialized');
  } finally {
    conn.release();
  }
}

export default pool;

// ── Sequelize ORM connection ─────────────────────────────────────────────────
// Used by src/models/*.js and controllers that need transactions.
export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host:    env.DB_HOST,
  port:    Number(env.DB_PORT),
  dialect: 'mysql',
  logging: env.DB_LOGGING ? console.log : false,
  define: {
    underscored:     true,
    freezeTableName: true,
    timestamps:      true,
  },
});

export const connectDatabase = async () => {
  await sequelize.authenticate();
  console.log('MySQL connection established');
};