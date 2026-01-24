// Types for different blockchain networks
export interface BlockchainConfig {
  id: string
  name: string
  symbol: string
  rpcUrl: string
  chainId: number
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  isEVM: boolean
}

export interface CryptoCurrency {
  id: string
  symbol: string
  name: string
  network: string
  icon: string
  available: boolean
  contractAddress?: string // For tokens like USDT
  decimals: number
}

export interface PaymentNetwork {
  id: string
  name: string
  label: string
  blockchains: BlockchainConfig[]
}

// Environment-based configuration - function to avoid import-time evaluation
function isTestnetMode(): boolean {
  return process.env.USE_TESTNET === 'true'
}

// Supported blockchain configurations
export const BLOCKCHAIN_CONFIGS: Record<string, BlockchainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: isTestnetMode()
      ? 'https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}'
      : 'https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}',
    chainId: isTestnetMode() ? 11155111 : 1,
    blockExplorer: isTestnetMode()
      ? 'https://sepolia.etherscan.io'
      : 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    isEVM: true
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'POLYGON',
    rpcUrl: 'https://polygon-rpc.com/',
    chainId: 137,
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    },
    isEVM: true
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    chainId: 56,
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    isEVM: true
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB1',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    isEVM: true
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    isEVM: true
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: isTestnetMode()
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com',
    chainId: 0, // Solana doesn't use chainId
    blockExplorer: isTestnetMode()
      ? 'https://solscan.io/?cluster=devnet'
      : 'https://solscan.io',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    isEVM: false
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    rpcUrl: isTestnetMode()
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api',
    chainId: 0,
    blockExplorer: isTestnetMode()
      ? 'https://mempool.space/testnet'
      : 'https://mempool.space',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8
    },
    isEVM: false
  },
  tron: {
    id: 'tron',
    name: 'Tron',
    symbol: 'TRX',
    rpcUrl: isTestnetMode()
      ? 'https://api.shasta.trongrid.io'
      : 'https://api.trongrid.io',
    chainId: 0,
    blockExplorer: isTestnetMode()
      ? 'https://shasta.tronscan.org'
      : 'https://tronscan.org',
    nativeCurrency: {
      name: 'Tron',
      symbol: 'TRX',
      decimals: 6
    },
    isEVM: false
  },
  ripple: {
    id: 'ripple',
    name: 'Ripple',
    symbol: 'XRP',
    rpcUrl: isTestnetMode()
      ? 'https://testnet.xrpl-labs.com'
      : 'https://xrplcluster.com',
    chainId: 0,
    blockExplorer: isTestnetMode()
      ? 'https://testnet.xrpscan.com'
      : 'https://xrpscan.com',
    nativeCurrency: {
      name: 'Ripple',
      symbol: 'XRP',
      decimals: 6
    },
    isEVM: false
  },
  dogecoin: {
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    rpcUrl: 'https://dogechain.info/api',
    chainId: 0,
    blockExplorer: 'https://dogechain.info',
    nativeCurrency: {
      name: 'Dogecoin',
      symbol: 'DOGE',
      decimals: 8
    },
    isEVM: false
  },
  cardano: {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    chainId: 0,
    blockExplorer: 'https://cardanoscan.io',
    nativeCurrency: {
      name: 'Cardano',
      symbol: 'ADA',
      decimals: 6
    },
    isEVM: false
  },
  monero: {
    id: 'monero',
    name: 'Monero',
    symbol: 'XMR',
    rpcUrl: 'http://node.moneroworld.com:18089',
    chainId: 0,
    blockExplorer: 'https://moneroblocks.info',
    nativeCurrency: {
      name: 'Monero',
      symbol: 'XMR',
      decimals: 12
    },
    isEVM: false
  },
  bitcoincash: {
    id: 'bitcoincash',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    rpcUrl: 'https://bch-chain.api.btc.com/v3',
    chainId: 0,
    blockExplorer: 'https://blockchair.com/bitcoin-cash',
    nativeCurrency: {
      name: 'Bitcoin Cash',
      symbol: 'BCH',
      decimals: 8
    },
    isEVM: false
  },
  stellar: {
    id: 'stellar',
    name: 'Stellar',
    symbol: 'XLM',
    rpcUrl: isTestnetMode()
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org',
    chainId: 0,
    blockExplorer: isTestnetMode()
      ? 'https://stellar.expert/explorer/testnet'
      : 'https://stellar.expert',
    nativeCurrency: {
      name: 'Stellar',
      symbol: 'XLM',
      decimals: 7
    },
    isEVM: false
  },
  zcash: {
    id: 'zcash',
    name: 'Zcash',
    symbol: 'ZEC',
    rpcUrl: 'https://api.zcha.in/v2/mainnet',
    chainId: 0,
    blockExplorer: 'https://zcha.in',
    nativeCurrency: {
      name: 'Zcash',
      symbol: 'ZEC',
      decimals: 8
    },
    isEVM: false
  },
  sui: {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    rpcUrl: isTestnetMode()
      ? 'https://fullnode.testnet.sui.io'
      : 'https://fullnode.mainnet.sui.io',
    chainId: 0,
    blockExplorer: isTestnetMode()
      ? 'https://suiscan.xyz/testnet'
      : 'https://suiscan.xyz',
    nativeCurrency: {
      name: 'Sui',
      symbol: 'SUI',
      decimals: 9
    },
    isEVM: false
  },
  ton: {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    rpcUrl: isTestnetMode()
      ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
      : 'https://toncenter.com/api/v2/jsonRPC',
    chainId: 0,
    blockExplorer: isTestnetMode()
      ? 'https://testnet.tonscan.org'
      : 'https://tonscan.org',
    nativeCurrency: {
      name: 'Toncoin',
      symbol: 'TON',
      decimals: 9
    },
    isEVM: false
  }
}

// Network groupings
export const PAYMENT_NETWORKS: PaymentNetwork[] = [
  {
    id: 'all',
    name: 'ALL',
    label: 'ALL',
    blockchains: Object.values(BLOCKCHAIN_CONFIGS)
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    label: 'Ethereum (ERC20)',
    blockchains: [BLOCKCHAIN_CONFIGS.ethereum]
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    label: 'BNB Chain (BEP20)',
    blockchains: [BLOCKCHAIN_CONFIGS.bsc]
  },
  {
    id: 'polygon',
    name: 'Polygon',
    label: 'Polygon (POLYGON)',
    blockchains: [BLOCKCHAIN_CONFIGS.polygon]
  },
  {
    id: 'solana',
    name: 'Solana',
    label: 'Solana (SOL)',
    blockchains: [BLOCKCHAIN_CONFIGS.solana]
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    label: 'Arbitrum (ARB1)',
    blockchains: [BLOCKCHAIN_CONFIGS.arbitrum]
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    label: 'AVAX C-Chain',
    blockchains: [BLOCKCHAIN_CONFIGS.avalanche]
  },
  {
    id: 'tron',
    name: 'Tron',
    label: 'TRON (TRC20)',
    blockchains: [BLOCKCHAIN_CONFIGS.tron]
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    label: 'Bitcoin',
    blockchains: [BLOCKCHAIN_CONFIGS.bitcoin]
  },
  {
    id: 'ripple',
    name: 'Ripple',
    label: 'Ripple (XRP)',
    blockchains: [BLOCKCHAIN_CONFIGS.ripple]
  },
  {
    id: 'dogecoin',
    name: 'Dogecoin',
    label: 'Dogecoin',
    blockchains: [BLOCKCHAIN_CONFIGS.dogecoin]
  },
  {
    id: 'cardano',
    name: 'Cardano',
    label: 'Cardano',
    blockchains: [BLOCKCHAIN_CONFIGS.cardano]
  },
  {
    id: 'monero',
    name: 'Monero',
    label: 'Monero',
    blockchains: [BLOCKCHAIN_CONFIGS.monero]
  },
  {
    id: 'bitcoincash',
    name: 'Bitcoin Cash',
    label: 'Bitcoin Cash',
    blockchains: [BLOCKCHAIN_CONFIGS.bitcoincash]
  },
  {
    id: 'stellar',
    name: 'Stellar',
    label: 'Stellar',
    blockchains: [BLOCKCHAIN_CONFIGS.stellar]
  },
  {
    id: 'zcash',
    name: 'Zcash',
    label: 'Zcash',
    blockchains: [BLOCKCHAIN_CONFIGS.zcash]
  },
  {
    id: 'sui',
    name: 'Sui',
    label: 'Sui',
    blockchains: [BLOCKCHAIN_CONFIGS.sui]
  },
  {
    id: 'ton',
    name: 'TON',
    label: 'TON',
    blockchains: [BLOCKCHAIN_CONFIGS.ton]
  }
]

// Helper functions
export function getBlockchainConfig(network: string): BlockchainConfig | null {
  return BLOCKCHAIN_CONFIGS[network] || null
}

export function getEVMBlockchains(): BlockchainConfig[] {
  return Object.values(BLOCKCHAIN_CONFIGS).filter(config => config.isEVM)
}

export function getNetworkById(networkId: string): PaymentNetwork | null {
  return PAYMENT_NETWORKS.find(network => network.id === networkId) || null
}