import axios from 'axios'

async function debugRipple() {
    const address = 'rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3'
    const rpcUrl = 'https://testnet.xrpl-labs.com'
    const targetTag = 153960507

    try {
        const response = await axios.post(rpcUrl, {
            method: 'account_tx',
            params: [{
                account: address,
                ledger_index_min: -1,
                ledger_index_max: -1,
                limit: 100,
                forward: false
            }]
        })

        const transactions = response.data.result.transactions || []
        const match = transactions.find((t: any) => (t.tx || t).DestinationTag === targetTag)

        if (match) {
            const tx = match.tx || match
            console.log('Amount type:', typeof tx.Amount)
            console.log('Amount value:', tx.Amount)
        }

    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

debugRipple()
