import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(__dirname, '../../db.sqlite')
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

// Test the connection
console.log('Connected to SQLite database')

// Convert PostgreSQL style parameters to SQLite style
function convertSql(sql: string, params?: any[]): { sql: string, params: any[] } {
  if (!params || params.length === 0) {
    return { sql, params: [] }
  }

  const convertedParams = []
  let paramIndex = 1
  let convertedSql = sql.replace(/\$(\d+)/g, (match, num) => {
    const index = parseInt(num)
    if (index <= params.length) {
      convertedParams.push(params[index - 1])
      return '?'
    }
    return match
  })

  return { sql: convertedSql, params: convertedParams }
}

// Query helper function - emulate PostgreSQL result format
export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const { sql, params: convertedParams } = convertSql(text, params)
    let stmt
    if (convertedParams && convertedParams.length > 0) {
      stmt = db.prepare(sql)
      const rows = stmt.all(...convertedParams)
      const duration = Date.now() - start
      console.log('Executed query', { text, duration, rows: rows.length })
      return { rows: rows as any[], rowCount: rows.length }
    } else {
      stmt = db.prepare(sql)
      const rows = stmt.all()
      const duration = Date.now() - start
      console.log('Executed query', { text, duration, rows: rows.length })
      return { rows: rows as any[], rowCount: rows.length }
    }
  } catch (err) {
    console.error('Query error', { text, err })
    throw err
  }
}

// For INSERT/UPDATE/DELETE, we need to handle differently
export const runQuery = (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const { sql, params: convertedParams } = convertSql(text, params)
    console.log('runQuery call:', { originalText: text, params, convertedParams })
    const stmt = db.prepare(sql)
    let result
    if (convertedParams && convertedParams.length > 0) {
      result = stmt.run(...convertedParams)
    } else {
      result = stmt.run()
    }
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, changes: result.changes })
    return result
  } catch (err) {
    console.error('Query error', { text, err })
    throw err
  }
}

// Transaction helper - simplified
export const getClient = () => ({
  query: (text: string, params?: any[]) => query(text, params),
  release: () => {} // No-op for SQLite
})

export default db