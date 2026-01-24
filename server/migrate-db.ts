import Database from 'better-sqlite3'
import path from 'path'

const sourcePath = 'c:/Users/Admin/dashboard/server/db.sqlite'
const destPath = 'c:/Users/Admin/dashboard/db_fixed.sqlite'

async function migrate() {
    console.log(`Migrating from ${sourcePath} to ${destPath}`)

    const sourceDb = new Database(sourcePath, { readonly: true })
    const destDb = new Database(destPath)

    // Get all tables
    const tables = sourceDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()

    for (const table of tables.map((t: any) => t.name)) {
        console.log(`Migrating table: ${table}`)

        // Get schema
        const schema = sourceDb.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`).get() as any
        destDb.exec(schema.sql)

        // Get data
        const data = sourceDb.prepare(`SELECT * FROM ${table}`).all()
        if (data.length > 0) {
            const columns = Object.keys(data[0])
            const placeholders = columns.map(() => '?').join(',')
            const insert = destDb.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`)

            const insertMany = destDb.transaction((rows) => {
                for (const row of rows) insert.run(Object.values(row))
            })

            insertMany(data)
            console.log(`Inserted ${data.length} rows into ${table}`)
        }
    }

    sourceDb.close()
    destDb.close()
    console.log('Migration complete!')
}

migrate().catch(console.error)
