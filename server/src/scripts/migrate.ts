#!/usr/bin/env tsx

import { query, runQuery } from '../db/index'
import { logger } from '../utils/logger'

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    email TEXT,
    wallet_address TEXT,
    kyc_status TEXT DEFAULT 'none',
    created_at TEXT,
    updated_at TEXT
  )`,

  // Invoices table
  `CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    nickname TEXT NOT NULL,
    amount TEXT NOT NULL,
    currency TEXT NOT NULL,
    payment_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    qr_code TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT
  )`,

  // Transactions table
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id),
    tx_hash TEXT NOT NULL,
    amount TEXT NOT NULL,
    confirmations INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    block_number INTEGER,
    gas_used INTEGER,
    gas_price TEXT,
    created_at TEXT
  )`,

  // Audit log table
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    resource_id TEXT,
    ip TEXT,
    user_agent TEXT,
    details TEXT,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TEXT
  )`,

  // Add network column if not exists
  `ALTER TABLE invoices ADD COLUMN network TEXT`,

  // Add memo column for Solana payments
  `ALTER TABLE invoices ADD COLUMN memo TEXT`,

  // Add wallets column for user wallet addresses
  `ALTER TABLE users ADD COLUMN wallets TEXT DEFAULT '[]'`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_expires_at ON invoices(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`
]

async function runMigrations() {
  try {
    logger.info('Starting database migrations...')

    for (const migration of migrations) {
      logger.info('Running migration:', migration.split('\n')[0].slice(0, 50) + '...')
      try {
        runQuery(migration)
      } catch (err: any) {
        // Check if it's a duplicate column error, if so skip
        if (err.code === 'SQLITE_ERROR' && err.message.includes('duplicate column name')) {
          logger.info('Migration skipped (column already exists):', migration.split('\n')[0])
          continue
        }
        throw err
      }
    }

    logger.info('All migrations completed successfully!')
  } catch (error) {
    logger.error('Migration failed:', error)
    throw error
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Migration script failed:', error)
      process.exit(1)
    })
}

export { runMigrations }