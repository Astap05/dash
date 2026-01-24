
import { query, runQuery } from '../db/index'

async function main() {
    try {
        const invoiceId = 'inv_mkswrup3_2764585c'
        const txHash = 'b7ee0b65cf234ffa8e24bc2c548fc656c1f9f8653d91a2887e31388fef0c8540'
        const amount = 16.939792
        const now = new Date().toISOString()

        // Update invoice status to paid
        runQuery("UPDATE invoices SET status = 'paid', updated_at = $1 WHERE id = $2", [now, invoiceId])

        // Insert transaction record
        runQuery(
            `INSERT INTO transactions (invoice_id, tx_hash, amount, status, confirmations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [invoiceId, txHash, amount, 'confirmed', 1, now]
        )

        console.log(`Invoice ${invoiceId} marked as PAID!`)
        console.log(`Transaction ${txHash} recorded.`)

        // Verify
        const verify = await query('SELECT status FROM invoices WHERE id = $1', [invoiceId])
        console.log('New status:', verify.rows[0]?.status)
    } catch (error: any) {
        console.error('Error:', error.message)
    }
    process.exit(0)
}

main()
