import axios from 'axios'
import Database from 'better-sqlite3'

const dbPath = 'c:/Users/Admin/dashboard_data/db.sqlite'
const db = new Database(dbPath)

async function debug() {
    const invoices = db.prepare("SELECT id, amount, memo, status FROM invoices WHERE network = 'ripple' AND (status = 'pending' OR status = 'expired')").all()
    console.log('Pending Invoices:', invoices.map((i: any) => `ID: ${i.id}, Amount: ${i.amount}, Tag: ${i.memo}`).join('\n'))

    const rpcUrl = 'https://testnet.xrpl-labs.com'
    const address = 'rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3'

    try {
        const response = await axios.post(rpcUrl, {
            method: 'account_tx',
            params: [{
                account: address,
                ledger_index_min: -1,
                ledger_index_max: -1,
                limit: 50,
                forward: false
            }]
        })

        const txs = response.data.result.transactions || []
        console.log('\nRecent Payments to Master Address:')
        txs.forEach((t: any) => {
            const tx = t.tx || t
            if (tx.TransactionType === 'Payment' && tx.Destination === address) {
                const amount = typeof tx.Amount === 'string' ? parseFloat(tx.Amount) / 1000000 : tx.Amount
                console.log(`Hash: ${tx.hash}, Tag: ${tx.DestinationTag}, Amount: ${amount} XRP`)
            }
        })
    } catch (e: any) {
        console.error('RPC Error:', e.message)
    }
}

debug()
