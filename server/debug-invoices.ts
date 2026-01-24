import Database from 'better-sqlite3'

const dbPath = 'c:/Users/Admin/dashboard_data/db.sqlite'
const db = new Database(dbPath)

async function debug() {
    const invoices = db.prepare("SELECT id, amount, memo, status FROM invoices WHERE network = 'ripple' AND (status = 'pending' OR status = 'expired')").all()
    console.log('--- Pending XRP Invoices ---')
    invoices.forEach((i: any) => {
        console.log(`ID: ${i.id}, Amount: ${i.amount}, Tag: ${i.memo}, Status: ${i.status}`)
    })
}

debug()
