import Database from 'better-sqlite3'

const dbPath = 'c:/Users/Admin/dashboard_data/db.sqlite'
const db = new Database(dbPath)

function forceConfirm(invoiceId: string) {
    const now = new Date().toISOString()
    const result = db.prepare("UPDATE invoices SET status = 'paid', updated_at = ? WHERE id = ?").run(now, invoiceId)
    console.log(`Update result:`, result)

    const verify = db.prepare("SELECT status FROM invoices WHERE id = ?").get(invoiceId)
    console.log(`Verified status:`, verify)
}

// Use the ID from my previous debug output
forceConfirm('inv_mklnvmww_1f422b82')
