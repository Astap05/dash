
import { query } from '../db/index'

async function main() {
    try {
        const result = await query(
            "SELECT id, amount, memo, status, payment_address, network FROM invoices WHERE amount LIKE '16.939792%'",
            []
        )
        console.log('Invoices with amount 16.939792...:')
        console.log(JSON.stringify(result.rows, null, 2))
    } catch (error: any) {
        console.error('Error:', error.message)
    }
    process.exit(0)
}

main()
