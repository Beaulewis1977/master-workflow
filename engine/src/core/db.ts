import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createLogger } from './logging.js';

const logger = createLogger('db');

export const getDbPath = (): string => {
  const dataDir = process.env.MW_ENGINE_DATA || path.resolve(process.cwd(), '.ai-workflow', 'engine');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'engine.db');
};

export const openDb = (): Database.Database => {
  const dbPath = getDbPath();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
};

export const migrate = (): void => {
  const db = openDb();
  const migrationsDir = path.resolve(path.dirname(getDbPath()), 'migrations');
  if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });
  const initPath = path.resolve(process.cwd(), 'engine', 'migrations', '0001_init.sql');
  const sql = fs.readFileSync(initPath, 'utf8');
  db.exec(sql);
  logger.info({ db: getDbPath() }, 'Migrations applied');
};

// CLI helper
if (process.argv[1] && process.argv[1].endsWith('db.js') && process.argv[2] === 'migrate') {
  migrate();
}


