
import { query } from '../db/index'

async function main() {
    try {
        const result = await query(
            "SELECT id, amount, memo, status, payment_address FROM invoices WHERE memo = '286308426'",
            []
        )
        console.log('Invoice with memo 286308426:')
        console.log(JSON.stringify(result.rows, null, 2))
    } catch (error: any) {
        console.error('Error:', error.message)
    }
    process.exit(0)
}

main()
