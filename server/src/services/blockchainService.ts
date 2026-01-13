import { ethers } from 'ethers'
import { Connection } from '@solana/web3.js'
import { logger } from '../utils/logger'
import { query } from '../db/index'
import { BlockchainConfig, BLOCKCHAIN_CONFIGS, getBlockchainConfig } from '../types/blockchain'

interface MonitoredAddress {
  address: string
  network: string
  invoiceId: string
}

export class BlockchainService {
  private providers: Map<string, ethers.JsonRpcProvider | Connection> = new Map()
  private monitoredAddresses: Set<MonitoredAddress> = new Set()

  constructor() {
    // Initialize providers for all supported networks
    this.initializeProviders()

    // Test connections (don't throw on failure for demo)
    this.testConnections().catch((error: any) => {
      logger.warn('Blockchain connection test failed, continuing without blockchain monitoring:', error.message)
    })

    // Start monitoring
    this.startMonitoring()
  }

  private initializeProviders() {
    Object.values(BLOCKCHAIN_CONFIGS).forEach(config => {
      try {
        if (config.isEVM) {
          const rpcUrl = config.rpcUrl.replace('${INFURA_PROJECT_ID}', process.env.INFURA_PROJECT_ID || 'your-infura-project-id')
          const provider = new ethers.JsonRpcProvider(rpcUrl)
          this.providers.set(config.id, provider)
        } else if (config.id === 'solana') {
          const connection = new Connection(config.rpcUrl, 'confirmed')
          this.providers.set(config.id, connection)
        }
        const networkMode = process.env.USE_TESTNET === 'true' ? 'TESTNET' : 'MAINNET'
        logger.info(`Initialized provider for ${config.name} (${networkMode})`)
      } catch (error) {
        logger.error(`Failed to initialize provider for ${config.name}:`, error)
      }
    })
  }

  private async testConnections() {
    for (const [networkId, provider] of this.providers) {
      try {
        const config = getBlockchainConfig(networkId)
        if (config?.isEVM && provider instanceof ethers.JsonRpcProvider) {
          const blockNumber = await provider.getBlockNumber()
          logger.info(`Connected to ${config.name}. Current block: ${blockNumber}`)
        } else if (!config?.isEVM && provider instanceof Connection) {
          const blockNumber = await provider.getBlockHeight()
          logger.info(`Connected to ${config?.name || networkId}. Current slot: ${blockNumber}`)
        }
      } catch (error) {
        logger.error(`Failed to connect to ${networkId}:`, error)
        // Continue with other providers
      }
    }
  }

  private startMonitoring() {
    // Check for new transactions every 30 seconds
    setInterval(() => {
      this.checkPendingPayments()
    }, 30000)

    logger.info('Blockchain monitoring started')
  }

  /**
   * Add address to monitoring list
   */
  addAddressToMonitor(address: string, network: string = 'ethereum', invoiceId?: string) {
    const monitoredAddress: MonitoredAddress = {
      address: address.toLowerCase(),
      network,
      invoiceId: invoiceId || ''
    }
    this.monitoredAddresses.add(monitoredAddress)
    logger.info(`Added address to monitoring: ${address} on ${network}`)
  }

  /**
   * Check for payments to monitored addresses
   */
  private async checkPendingPayments() {
    try {
      for (const monitoredAddress of this.monitoredAddresses) {
        await this.checkAddressPayments(monitoredAddress)
      }
    } catch (error) {
      logger.error('Error checking payments:', error)
    }
  }

  /**
   * Check payments for a specific address
   */
  private async checkAddressPayments(monitoredAddress: MonitoredAddress) {
    try {
      const provider = this.providers.get(monitoredAddress.network)
      if (!provider) {
        logger.error(`No provider found for network ${monitoredAddress.network}`)
        return
      }

      const config = getBlockchainConfig(monitoredAddress.network)
      if (!config) return

      if (config.isEVM && provider instanceof ethers.JsonRpcProvider) {
        await this.checkEVMAddressPayments(monitoredAddress, provider)
      } else if (config.id === 'solana' && provider instanceof Connection) {
        await this.checkSolanaAddressPayments(monitoredAddress, provider)
      }

    } catch (error) {
      logger.error(`Error checking payments for ${monitoredAddress.address}:`, error)
    }
  }

  /**
   * Check EVM payments for a specific address
   */
  private async checkEVMAddressPayments(monitoredAddress: MonitoredAddress, provider: ethers.JsonRpcProvider) {
    try {
      // Get recent transactions for the address
      // Note: This is a simplified approach. In production, you might want to use
      // Etherscan API or more sophisticated monitoring

      const currentBlock = await provider.getBlockNumber()
      const fromBlock = currentBlock - 100 // Check last 100 blocks

      // Get all invoices for this address
      const invoicesResult = await query(
        'SELECT id, amount, currency FROM invoices WHERE payment_address = $1 AND status = $2',
        [monitoredAddress.address, 'pending']
      )

      if (invoicesResult.rows.length === 0) {
        return // No pending invoices for this address
      }

      // For each invoice, check if payment was received
      for (const invoice of invoicesResult.rows) {
        await this.checkEVMInvoicePayment(invoice, fromBlock, currentBlock, provider)
      }

    } catch (error) {
      logger.error(`Error checking EVM payments for ${monitoredAddress.address}:`, error)
    }
  }

  /**
   * Check Solana payments for a specific address
   */
  private async checkSolanaAddressPayments(monitoredAddress: MonitoredAddress, connection: Connection) {
    try {
      // Get recent transactions for the address
      // Note: This is a simplified approach for Solana

      // Get all invoices for this address
      const invoicesResult = await query(
        'SELECT id, amount, currency FROM invoices WHERE payment_address = $1 AND status = $2',
        [monitoredAddress.address, 'pending']
      )

      if (invoicesResult.rows.length === 0) {
        return // No pending invoices for this address
      }

      // For each invoice, check if payment was received
      for (const invoice of invoicesResult.rows) {
        await this.checkSolanaInvoicePayment(invoice, connection)
      }

    } catch (error) {
      logger.error(`Error checking Solana payments for ${monitoredAddress.address}:`, error)
    }
  }

  /**
   * Check if EVM payment was received for a specific invoice
   */
  private async checkEVMInvoicePayment(invoice: any, fromBlock: number, toBlock: number, provider: ethers.JsonRpcProvider) {
    try {
      const config = getBlockchainConfig(invoice.network)

      if (config?.isEVM) {
        // For native coin transfers, we need to scan blocks for transactions
        for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
          try {
            const block = await provider.getBlock(blockNum, false)
            if (!block || !block.transactions) continue

            // Get transactions for this block
            for (const txHash of block.transactions) {
              const tx = await provider.getTransaction(txHash)
              if (!tx) continue

              // Check if transaction is to our payment address
              if (tx.to && tx.to.toLowerCase() === invoice.payment_address.toLowerCase()) {
                // Check amount (convert to appropriate decimals)
                const txValue = parseFloat(ethers.formatEther(tx.value))

                if (txValue >= invoice.amount) {
                  await this.confirmPayment(invoice.id, tx.hash, invoice.amount)
                  return // Payment found
                }
              }
            }
          } catch (blockError) {
            logger.warn(`Error processing block ${blockNum}:`, blockError)
            continue
          }
        }
      }

    } catch (error) {
      logger.error(`Error checking EVM payment for invoice ${invoice.id}:`, error)
    }
  }

  /**
   * Check if Solana payment was received for a specific invoice
   */
  private async checkSolanaInvoicePayment(invoice: any, connection: Connection) {
    try {
      // Get recent transactions for the account
      const pubkey = new (await import('@solana/web3.js')).PublicKey(invoice.payment_address)
      const signatures = await connection.getConfirmedSignaturesForAddress2(pubkey, { limit: 20 })

      for (const sigInfo of signatures) {
        try {
          const tx = await connection.getTransaction(sigInfo.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          })

          if (!tx) continue

          // Check if transaction has memo instruction with correct value
          const hasCorrectMemo = this.checkSolanaTransactionMemo(tx, invoice.memo)

          if (hasCorrectMemo) {
            // Check if amount matches (simplified check)
            const receivedAmount = this.getSolanaTransactionAmount(tx, pubkey)
            const expectedAmount = Math.floor(invoice.amount * 1e9) // Convert SOL to lamports

            if (receivedAmount >= expectedAmount) {
              await this.confirmPayment(invoice.id, sigInfo.signature, invoice.amount)
              break // Payment found, stop checking
            }
          }
        } catch (txError) {
          logger.warn(`Error processing Solana transaction ${sigInfo.signature}:`, txError)
          continue
        }
      }

    } catch (error) {
      logger.error(`Error checking Solana payment for invoice ${invoice.id}:`, error)
    }
  }

  /**
   * Check if Solana transaction contains correct memo
   */
  private checkSolanaTransactionMemo(tx: any, expectedMemo: string): boolean {
    if (!tx || !tx.transaction || !tx.transaction.message) return false

    try {
      const instructions = tx.transaction.message.instructions

      for (const instruction of instructions) {
        // Check if it's a memo instruction (programId for memo is 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
        if (instruction.programId && instruction.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr') {
          // Decode memo data
          const memoData = instruction.data
          if (typeof memoData === 'string') {
            if (memoData === expectedMemo) {
              return true
            }
          } else if (Buffer.isBuffer(memoData) || Array.isArray(memoData)) {
            const memoString = Buffer.from(memoData).toString('utf8')
            if (memoString === expectedMemo) {
              return true
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Error checking memo in transaction:', error)
    }

    return false
  }

  /**
   * Get received amount for account in Solana transaction
   */
  private getSolanaTransactionAmount(tx: any, accountPubkey: any): number {
    if (!tx || !tx.meta || !tx.meta.postBalances || !tx.meta.preBalances) return 0

    const accountIndex = tx.transaction.message.accountKeys.findIndex(
      (key: any) => key.equals(accountPubkey)
    )

    if (accountIndex === -1) return 0

    const preBalance = tx.meta.preBalances[accountIndex] || 0
    const postBalance = tx.meta.postBalances[accountIndex] || 0

    return Math.max(0, postBalance - preBalance)
  }

  /**
   * Confirm a payment and update invoice status
   */
  private async confirmPayment(invoiceId: string, txHash: string, amount: number) {
    try {
      // Update invoice status
      await query(
        'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2',
        ['paid', invoiceId]
      )

      // Insert transaction record
      await query(
        `INSERT INTO transactions (invoice_id, tx_hash, amount, status, confirmations)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, txHash, amount, 'confirmed', 12]
      )

      logger.info(`Payment confirmed for invoice ${invoiceId}: ${amount} ETH, tx: ${txHash}`)

      // TODO: Send email notification

    } catch (error) {
      logger.error(`Error confirming payment for invoice ${invoiceId}:`, error)
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string, network: string = 'ethereum') {
    try {
      const provider = this.providers.get(network)
      if (!provider) {
        logger.error(`No provider found for network ${network}`)
        return null
      }

      const config = getBlockchainConfig(network)
      if (config?.isEVM && provider instanceof ethers.JsonRpcProvider) {
        const tx = await provider.getTransaction(txHash)
        const receipt = await provider.getTransactionReceipt(txHash)

        return {
          hash: tx?.hash,
          from: tx?.from,
          to: tx?.to,
          value: tx ? ethers.formatEther(tx.value) : '0',
          gasUsed: receipt?.gasUsed?.toString(),
          confirmations: receipt?.confirmations || 0,
          blockNumber: receipt?.blockNumber
        }
      } else if (config?.id === 'solana' && provider instanceof Connection) {
        const tx = await provider.getTransaction(txHash)
        const blockTime = tx?.blockTime ? new Date(tx.blockTime * 1000) : null

        return {
          hash: tx?.transaction.signatures[0],
          from: tx?.transaction.message.accountKeys[0]?.toString(),
          to: tx?.transaction.message.accountKeys[1]?.toString(),
          value: tx?.meta?.preBalances[0] ? (tx.meta.preBalances[0] - (tx.meta.postBalances[0] || 0)) / 1e9 : '0',
          gasUsed: tx?.meta?.fee?.toString(),
          confirmations: tx?.slot ? 1 : 0, // Simplified
          blockNumber: tx?.slot
        }
      }

      return null
    } catch (error) {
      logger.error(`Error getting transaction ${txHash}:`, error)
      return null
    }
  }

  /**
   * Get current gas price or fee info
   */
  async getGasPrice(network: string = 'ethereum') {
    try {
      const provider = this.providers.get(network)
      if (!provider) {
        logger.error(`No provider found for network ${network}`)
        return null
      }

      const config = getBlockchainConfig(network)
      if (config?.isEVM && provider instanceof ethers.JsonRpcProvider) {
        const gasPrice = await provider.getFeeData()
        return {
          gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'),
          maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') : null,
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') : null
        }
      } else if (config?.id === 'solana' && provider instanceof Connection) {
        // For Solana, get recent blockhash fees or recent prioritization fees
        const fees = await provider.getRecentPrioritizationFees()
        const avgFee = fees.length > 0 ? fees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) / fees.length : 0
        return {
          gasPrice: (avgFee / 1e9).toString(), // Convert lamports to SOL
          maxFeePerGas: null,
          maxPriorityFeePerGas: null
        }
      }

      return null
    } catch (error) {
      logger.error('Error getting gas price:', error)
      return null
    }
  }
}

// Singleton instance
export const blockchainService = new BlockchainService()