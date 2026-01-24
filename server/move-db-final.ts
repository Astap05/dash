import Database from 'better-sqlite3'
import fs from 'fs'

const sourcePath = 'c:/Users/Admin/dashboard/db_fixed.sqlite'
const destPath = 'c:/Users/Admin/dashboard_data/db.sqlite'

async function migrate() {
    console.log(`Moving from ${sourcePath} to ${destPath}`)

    if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath)
    }

    const sourceDb = new Database(sourcePath, { readonly: true })
    const destDb = new Database(destPath)

    const tables = sourceDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()

    for (const table of tables.map((t: any) => t.name)) {
        const schema = sourceDb.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`).get() as any
        destDb.exec(schema.sql)

        const data = sourceDb.prepare(`SELECT * FROM ${table}`).all()
        if (data.length > 0) {
            const columns = Object.keys(data[0])
            const placeholders = columns.map(() => '?').join(',')
            const insert = destDb.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`)
            const insertMany = destDb.transaction((rows) => {
                for (const row of rows) insert.run(Object.values(row))
            })
            insertMany(data)
        }
    }

    sourceDb.close()
    destDb.close()
    console.log('Done!')
}

migrate().catch(console.error)
