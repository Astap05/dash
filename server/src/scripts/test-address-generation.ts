import { walletService } from '../services/walletService'
import { BLOCKCHAIN_CONFIGS } from '../types/blockchain'
import { logger } from '../utils/logger'

// Mock environment variables if needed
process.env.MASTER_SEED_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
process.env.USE_TESTNET = 'true'

async function testAddressGeneration() {
    console.log('Starting address generation test...')
    const invoiceId = 'inv_test_12345'

    for (const [networkId, config] of Object.entries(BLOCKCHAIN_CONFIGS)) {
        try {
            console.log(`Testing ${config.name} (${networkId})...`)
            const address = await walletService.generatePaymentAddress(invoiceId, config.nativeCurrency.symbol, networkId)
            console.log(`✅ ${config.name}: ${address}`)

            // Basic validation
            if (!address) {
                console.error(`❌ ${config.name}: Address is empty`)
            }
        } catch (error) {
            console.error(`❌ ${config.name}: Failed to generate address`, error)
        }
    }
}

testAddressGeneration().catch(console.error)
