import { ethers } from 'ethers'
import { Keypair, Connection, PublicKey } from '@solana/web3.js'
import { derivePath } from 'ed25519-hd-key'
import { mnemonicToSeedSync } from 'bip39'
import crypto from 'crypto'
import axios from 'axios'
import { logger } from '../utils/logger'
import { getBlockchainConfig } from '../types/blockchain'

// CRITICAL SECURITY: Master seed phrase MUST be set in environment variables!
const isTestnet = process.env.USE_TESTNET === 'true'
const isProduction = process.env.NODE_ENV === 'production'

let MASTER_SEED_PHRASE = isTestnet
  ? process.env.TESTNET_MASTER_SEED_PHRASE || process.env.MASTER_SEED_PHRASE
  : process.env.MASTER_SEED_PHRASE

let ENCRYPTION_KEY = isTestnet
  ? process.env.TESTNET_MASTER_SEED_ENCRYPTION_KEY || process.env.MASTER_SEED_ENCRYPTION_KEY
  : process.env.MASTER_SEED_ENCRYPTION_KEY

if (!MASTER_SEED_PHRASE) {
  if (isProduction && !isTestnet) {
    throw new Error('MASTER_SEED_PHRASE environment variable is required in production mainnet.')
  } else {
    MASTER_SEED_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  }
}

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  if (isProduction && !isTestnet) {
    throw new Error('MASTER_SEED_ENCRYPTION_KEY environment variable is required in production mainnet.')
  } else {
    ENCRYPTION_KEY = 'test-encryption-key-for-development-only-32-chars'
  }
}

// Base58 Alphabets
const BITCOIN_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const XRP_ALPHABET = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'

export class WalletService {
  private masterHDWallet: ethers.HDNodeWallet | null = null

  constructor() {
    this.initializeMasterHDWallet()
  }

  private async initializeMasterHDWallet() {
    try {
      const seedPhrase = MASTER_SEED_PHRASE as string
      const seed = mnemonicToSeedSync(seedPhrase)
      this.masterHDWallet = ethers.HDNodeWallet.fromSeed(seed)
      logger.info(`Master HD wallet initialized successfully at root`)
    } catch (error) {
      logger.error('Failed to initialize master HD wallet:', error)
      throw new Error('HD Wallet initialization failed')
    }
  }

  private encodeBase58(buffer: Buffer, alphabet: string): string {
    let x = BigInt('0x' + buffer.toString('hex'))
    let result = ''
    while (x > 0n) {
      result = alphabet[Number(x % 58n)] + result
      x /= 58n
    }
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = alphabet[0] + result
    }
    return result
  }

  private base58Check(payload: Buffer, alphabet: string): string {
    const checksum = crypto.createHash('sha256')
      .update(crypto.createHash('sha256').update(payload).digest())
      .digest()
      .slice(0, 4)
    return this.encodeBase58(Buffer.concat([payload, checksum]), alphabet)
  }

  private getAccountID(pubKey: string): Buffer {
    const pubKeyBuffer = Buffer.from(pubKey.startsWith('0x') ? pubKey.slice(2) : pubKey, 'hex')
    const sha256 = crypto.createHash('sha256').update(pubKeyBuffer).digest()
    return crypto.createHash('ripemd160').update(sha256).digest()
  }

  /**
   * Generate a unique payment address for an invoice
   */
  async generatePaymentAddress(invoiceId: string, currency: string = 'ETH', network: string = 'ethereum'): Promise<string> {
    try {
      const index = this.hashToIndex(invoiceId)
      const normalizedNetwork = network.toLowerCase()

      if (!this.masterHDWallet) throw new Error('Master HD wallet not initialized')

      // 1. Solana (Ed25519)
      if (normalizedNetwork === 'solana') {
        const seed = mnemonicToSeedSync(MASTER_SEED_PHRASE as string)
        const path = `m/44'/501'/${index}'/0'`
        const { key: derivedSeed } = derivePath(path, seed.toString('hex'))
        const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32))
        return keypair.publicKey.toString()
      }

      // 2. EVM Chains
      if (['ethereum', 'bsc', 'polygon', 'arbitrum', 'avax', 'avalanche'].includes(normalizedNetwork)) {
        const path = `m/44'/60'/0'/0/${index}`
        const wallet = this.masterHDWallet.derivePath(path)
        return wallet.address
      }

      // 3. Bitcoin
      if (normalizedNetwork === 'bitcoin') {
        const path = `m/44'/0'/0'/0/${index}`
        const wallet = this.masterHDWallet.derivePath(path)
        const accountID = this.getAccountID(wallet.publicKey)
        return this.base58Check(Buffer.concat([Buffer.from([0x00]), accountID]), BITCOIN_ALPHABET)
      }

      // 4. Ripple (XRP) - SHARED MASTER ADDRESS
      if (normalizedNetwork === 'ripple') {
        const path = `m/44'/144'/0'/0/0`
        const wallet = this.masterHDWallet.derivePath(path)
        const accountID = this.getAccountID(wallet.publicKey)
        return this.base58Check(Buffer.concat([Buffer.from([0x00]), accountID]), XRP_ALPHABET)
      }

      // 5. Stellar (XLM) - SHARED MASTER ADDRESS (to avoid 1 XLM reserve per account)
      if (normalizedNetwork === 'stellar') {
        const path = `m/44'/148'/0'/0/0`
        const wallet = this.masterHDWallet.derivePath(path)
        const accountID = this.getAccountID(wallet.publicKey)
        // Stellar uses Ed25519, but for simplicity we'll use a realistic looking G-address
        // In production, use stellar-base to generate real G-addresses
        return `G${this.encodeBase58(accountID, BITCOIN_ALPHABET).substring(0, 55).toUpperCase()}`
      }

      // 6. Tron
      if (normalizedNetwork === 'tron') {
        const path = `m/44'/195'/0'/0/${index}`
        const wallet = this.masterHDWallet.derivePath(path)
        const accountID = this.getAccountID(wallet.publicKey)
        return this.base58Check(Buffer.concat([Buffer.from([0x41]), accountID]), BITCOIN_ALPHABET)
      }

      // 7. Dogecoin
      if (normalizedNetwork === 'dogecoin') {
        const path = `m/44'/3'/0'/0/${index}`
        const wallet = this.masterHDWallet.derivePath(path)
        const accountID = this.getAccountID(wallet.publicKey)
        return this.base58Check(Buffer.concat([Buffer.from([0x1E]), accountID]), BITCOIN_ALPHABET)
      }

      // 8. Bitcoin Cash
      if (normalizedNetwork === 'bitcoincash') {
        const path = `m/44'/145'/0'/0/${index}`
        const wallet = this.masterHDWallet.derivePath(path)
        const accountID = this.getAccountID(wallet.publicKey)
        return this.base58Check(Buffer.concat([Buffer.from([0x00]), accountID]), BITCOIN_ALPHABET)
      }

      // 9. TON
      if (normalizedNetwork === 'ton') {
        const hash = crypto.createHash('sha256').update(`ton-${invoiceId}-${index}`).digest()
        const payload = Buffer.concat([Buffer.from([0x11, 0x00]), hash])
        const crc = this.crc16(payload)
        const crcBuffer = Buffer.alloc(2)
        crcBuffer.writeUInt16BE(crc)
        return Buffer.concat([payload, crcBuffer]).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
      }

      // Default fallback to EVM-style
      const path = `m/44'/60'/0'/0/${index}`
      const wallet = this.masterHDWallet.derivePath(path)
      return wallet.address
    } catch (error) {
      logger.error(`Failed to generate payment address for ${network}:`, error)
      throw new Error('Address generation failed')
    }
  }

  private crc16(data: Buffer): number {
    let crc = 0
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i] << 8
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1
      }
    }
    return crc & 0xFFFF
  }

  private hashToIndex(invoiceId: string): number {
    const hash = crypto.createHash('sha256').update(invoiceId).digest('hex')
    return parseInt(hash.substring(0, 8), 16) % 1000000
  }

  async validateAddressOwnership(address: string, invoiceId: string, currency: string = 'ETH', network: string = 'ethereum'): Promise<boolean> {
    try {
      const expectedAddress = await this.generatePaymentAddress(invoiceId, currency, network)
      return expectedAddress.toLowerCase() === address.toLowerCase()
    } catch {
      return false
    }
  }

  async getPrivateKey(invoiceId: string, currency: string = 'ETH', network: string = 'ethereum'): Promise<string> {
    const index = this.hashToIndex(invoiceId)
    const normalizedNetwork = network.toLowerCase()

    if (normalizedNetwork === 'solana') {
      const seed = mnemonicToSeedSync(MASTER_SEED_PHRASE as string)
      const path = `m/44'/501'/${index}'/0'`
      const { key: derivedSeed } = derivePath(path, seed.toString('hex'))
      const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32))
      return Buffer.from(keypair.secretKey).toString('hex')
    }

    let path = `m/44'/60'/0'/0/${index}`
    if (normalizedNetwork === 'bitcoin') path = `m/44'/0'/0'/0/${index}`
    if (normalizedNetwork === 'ripple') path = `m/44'/144'/0'/0/0`
    if (normalizedNetwork === 'stellar') path = `m/44'/148'/0'/0/0`
    if (normalizedNetwork === 'tron') path = `m/44'/195'/0'/0/${index}`
    if (normalizedNetwork === 'bitcoincash') path = `m/44'/145'/0'/0/${index}`

    const wallet = this.masterHDWallet!.derivePath(path)
    return wallet.privateKey
  }

  /**
   * Get balance of an address on specified network
   */
  async getAddressBalance(address: string, network: string): Promise<{ balance: string, error?: string }> {
    try {
      const normalizedNetwork = network.toLowerCase()
      const config = getBlockchainConfig(normalizedNetwork)

      if (!config) {
        return { balance: '0', error: 'Unsupported network' }
      }

      // EVM networks
      if (config.isEVM) {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl.replace('${INFURA_PROJECT_ID}', process.env.INFURA_PROJECT_ID || 'your-infura-project-id'))
        const balance = await provider.getBalance(address)
        return { balance: ethers.formatEther(balance) }
      }

      // Solana
      if (normalizedNetwork === 'solana') {
        const connection = new Connection(config.rpcUrl, 'confirmed')
        const publicKey = new PublicKey(address)
        const balance = await connection.getBalance(publicKey)
        return { balance: (balance / 1e9).toString() } // Convert lamports to SOL
      }

      // Ripple - check account info
      if (normalizedNetwork === 'ripple') {
        const response = await axios.post(config.rpcUrl, {
          method: 'account_info',
          params: [{
            account: address,
            ledger_index: 'validated'
          }]
        }, { timeout: 10000 })

        if (response.data?.result?.account_data) {
          const balanceDrops = response.data.result.account_data.Balance
          return { balance: (parseInt(balanceDrops) / 1000000).toString() }
        }
        return { balance: '0' } // Account not found or no balance
      }

      // Stellar - check account balance
      if (normalizedNetwork === 'stellar') {
        const response = await axios.get(`${config.rpcUrl}/accounts/${address}`, { timeout: 10000 })
        const balances = response.data.balances || []
        const xlmBalance = balances.find((b: any) => b.asset_type === 'native')
        return { balance: xlmBalance ? xlmBalance.balance : '0' }
      }

      // Bitcoin and other UTXO chains - would need different implementation
      // For now, return unsupported
      return { balance: '0', error: 'Balance checking not implemented for this network' }

    } catch (error: any) {
      logger.warn(`Failed to get balance for ${address} on ${network}:`, error.message)
      return { balance: '0', error: error.message || 'Failed to fetch balance' }
    }
  }
}

export const walletService = new WalletService()