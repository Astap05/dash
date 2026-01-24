
import axios from 'axios'

async function main() {
    try {
        const response = await axios.post('https://testnet.xrpl-labs.com', {
            method: 'tx',
            params: [{
                transaction: 'CB0BD963BC8EFE4D3A254C2A913C1FA39FE1640D0ADA501397ABB8A0BFC14C3D'
            }]
        }, { timeout: 30000 })

        console.log('Transaction details:')
        console.log(JSON.stringify(response.data, null, 2))
    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

main()
