import { query } from './src/db/index'

async function findInvoice() {
    const id = 'inv_mklmsr3v_ade91b89'
    const result = await query("SELECT * FROM invoices WHERE id = $1", [id])
    console.log('Invoice found:', JSON.stringify(result.rows, null, 2))
}

findInvoice().catch(console.error)
