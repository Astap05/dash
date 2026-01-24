
import axios from 'axios'

async function main() {
    try {
        const response = await axios.post('https://testnet.xrpl-labs.com', {
            method: 'server_info'
        }, { timeout: 10000 })

        console.log('Server Info:')
        console.log(JSON.stringify(response.data.result.info.validated_ledger, null, 2))
    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

main()
