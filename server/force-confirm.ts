import { query, runQuery } from './src/db/index'
import axios from 'axios'

async function forceConfirm() {
    const memo = '592517113'
    const txHash = '41F943F3595B9A02352828A7BEA2CB2333834541396D1862E20429506BD3791D'

    console.log('Force confirming invoice with memo:', memo)

    const result = await query('SELECT * FROM invoices WHERE memo = $1', [memo])
    if (result.rows.length === 0) {
        console.error('Invoice not found!')
        return
    }

    const invoice = result.rows[0]
    console.log('Found invoice:', invoice.id, 'Status:', invoice.status)

    if (invoice.status === 'paid') {
        console.log('Already paid!')
        return
    }

    const now = new Date().toISOString()

    console.log('Updating status to paid...')
    runQuery("UPDATE invoices SET status = 'paid', updated_at = $1 WHERE id = $2", [now, invoice.id])

    console.log('Inserting transaction...')
    runQuery(
        "INSERT INTO transactions (invoice_id, tx_hash, amount, status, confirmations, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [invoice.id, txHash, parseFloat(invoice.amount), 'confirmed', 1, now]
    )

    console.log('DONE! Invoice confirmed.')
}

forceConfirm().catch(console.error)
