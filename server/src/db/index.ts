import Database from 'better-sqlite3'
import path from 'path'
import { logger } from '../utils/logger'

// Move database to a completely separate directory to avoid triggering tsx watch restarts
const dbPath = 'c:/Users/Admin/dashboard_data/db.sqlite'

logger.info(`Connecting to SQLite database at: ${dbPath}`)

const db = new Database(dbPath)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

/**
 * Execute a query and return rows
 */
export const query = async (text: string, params: any[] = []) => {
  const start = Date.now()

  // Convert PostgreSQL style $1, $2 to SQLite style ?
  const sql = text.replace(/\$(\d+)/g, '?')
  const convertedParams = params

  try {
    const stmt = db.prepare(sql)
    const rows = stmt.all(...convertedParams)

    const duration = Date.now() - start
    // logger.debug(`Executed query { text: '${sql}', duration: ${duration}, rows: ${rows.length} }`)

    return { rows }
  } catch (error) {
    logger.error(`Database query error: ${error}`)
    throw error
  }
}

/**
 * Execute a command (INSERT, UPDATE, DELETE)
 */
export const runQuery = (text: string, params: any[] = []) => {
  const start = Date.now()

  const sql = text.replace(/\$(\d+)/g, '?')
  const convertedParams = params

  try {
    const stmt = db.prepare(sql)
    const result = stmt.run(...convertedParams)

    const duration = Date.now() - start
    // logger.debug(`Executed query { text: '${sql}', duration: ${duration}, changes: ${result.changes} }`)

    return result
  } catch (error) {
    logger.error(`Database runQuery error: ${error}`)
    throw error
  }
}

// Initialize database tables
export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      nickname TEXT,
      amount TEXT,
      currency TEXT,
      network TEXT,
      payment_address TEXT,
      memo TEXT,
      status TEXT DEFAULT 'pending',
      qr_code TEXT,
      expires_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT,
      tx_hash TEXT UNIQUE,
      amount REAL,
      status TEXT,
      confirmations INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );
  `)
}

// Run initialization
initDb()

export default db