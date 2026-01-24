import { query } from './src/db/index'

async function checkInvoices() {
    const result = await query("SELECT id, amount, currency, network, status, memo, payment_address FROM invoices WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5", [])
    console.log('Pending Invoices:', JSON.stringify(result.rows, null, 2))
}

checkInvoices().catch(console.error)
