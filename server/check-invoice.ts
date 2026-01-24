import { query } from './src/db/index'

async function check() {
    const id = 'inv_mklnvmww_1f422b82'
    const result = await query("SELECT id, amount, memo, status, network FROM invoices WHERE id = $1", [id])
    console.log('Invoice:', JSON.stringify(result.rows[0], null, 2))
}

check().catch(console.error)
