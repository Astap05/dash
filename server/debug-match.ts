import axios from 'axios'
import Database from 'better-sqlite3'

const dbPath = 'c:/Users/Admin/dashboard_data/db.sqlite'
const db = new Database(dbPath)

async function debug() {
    console.log('--- Pending XRP Invoices ---')
    const invoices = db.prepare("SELECT id, amount, memo, status FROM invoices WHERE network = 'ripple' AND (status = 'pending' OR status = 'expired')").all()
    console.table(invoices)

    console.log('\n--- Recent XRP Transactions (Master Address) ---')
    const rpcUrl = 'https://testnet.xrpl-labs.com'
    const address = 'rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3'

    try {
        const response = await axios.post(rpcUrl, {
            method: 'account_tx',
            params: [{
                account: address,
                ledger_index_min: -1,
                ledger_index_max: -1,
                limit: 20,
                forward: false
            }]
        })

        const txs = response.data.result.transactions || []
        const simplified = txs.map((t: any) => {
            const tx = t.tx || t
            return {
                hash: tx.hash,
                type: tx.TransactionType,
                to: tx.Destination,
                tag: tx.DestinationTag,
                amount: typeof tx.Amount === 'string' ? parseFloat(tx.Amount) / 1000000 : tx.Amount
            }
        }).filter((t: any) => t.type === 'Payment' && t.to === address)

        console.table(simplified)
    } catch (e: any) {
        console.error('RPC Error:', e.message)
    }
}

debug()
