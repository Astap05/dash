import axios from 'axios'
import { logger } from '../utils/logger'

interface CoinGeckoPriceResponse {
    [key: string]: {
        usd: number
    }
}

// Маппинг наших ID валют на ID CoinGecko
const COINGECKO_IDS: { [key: string]: string } = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'usdt': 'tether',
    'usdc': 'usd-coin',
    'bnb': 'binancecoin',
    'xrp': 'ripple',
    'sol': 'solana',
    'trx': 'tron',
    'steth': 'staked-ether',
    'doge': 'dogecoin',
    'ada': 'cardano',
    'wsteth': 'wrapped-steth',
    'xmr': 'monero',
    'wbtc': 'wrapped-bitcoin',
    'bch': 'bitcoin-cash',
    'weeth': 'wrapped-eeth',
    'link': 'chainlink',
    'leo': 'leo-token',
    'weth': 'weth',
    'xlm': 'stellar',
    'zfc': 'zcash', // Zcash
    'sui': 'sui',
    'usde': 'ethena-usde',
    'avax': 'avalanche-2',
    'dai': 'dai',
    'ltc': 'litecoin',
    'matic': 'matic-network',
    'dot': 'polkadot',
    'uni': 'uniswap',
    'atom': 'cosmos',
    'etc': 'ethereum-classic',
    'fil': 'filecoin',
    'apt': 'aptos',
    'arb': 'arbitrum',
    'op': 'optimism',
    'near': 'near',
    'algo': 'algorand',
    'hbar': 'hedera-hashgraph',
    'vet': 'vechain',
    'icp': 'internet-computer',
    'qnt': 'quant-network',
    'grt': 'the-graph',
    'ftm': 'fantom',
    'eos': 'eos',
    'sand': 'the-sandbox',
    'mana': 'decentraland',
    'theta': 'theta-token',
    'aave': 'aave',
    'axs': 'axie-infinity',
    'xtz': 'tezos',
    'flow': 'flow',
    'kcs': 'kucoin-shares',
    'bsv': 'bitcoin-sv',
    'neo': 'neo',
    'chz': 'chiliz',
    'klay': 'klay-token',
    'lunc': 'terra-luna',
    'usdd': 'usdd',
    'tusd': 'true-usd',
    'okb': 'okb',
    'ht': 'huobi-token',
    'miota': 'iota',
    'zec': 'zcash',
    'xec': 'ecash',
    'dash': 'dash',
    'cake': 'pancakeswap-token',
    'rune': 'thorchain',
    'snx': 'havven',
    'crv': 'curve-dao-token',
    '1inch': '1inch',
    'bat': 'basic-attention-token',
    'enj': 'enjincoin',
    'zil': 'zilliqa',
    'qtum': 'qtum',
    'btg': 'bitcoin-gold',
    'lrc': 'loopring',
    'ksm': 'kusama',
    'celo': 'celo',
    'rvn': 'ravencoin',
    'waves': 'waves',
    'hot': 'holotoken',
    'gala': 'gala',
    'comp': 'compound-governance-token',
    'yfi': 'yearn-finance',
    'bal': 'balancer',
    'sushi': 'sushi',
    'omg': 'omg',
    'ont': 'ontology',
    'zrx': '0x',
    'iost': 'iostoken',
    'dgb': 'digibyte',
    'nano': 'nano',
    'sc': 'siacoin',
    'zen': 'horizen',
    'icx': 'icon',
    'waxp': 'wax',
    'hive': 'hive',
    'lsk': 'lisk',
    'steem': 'steem',
    'bts': 'bitshares',
    'ardr': 'ardor',
    'kmd': 'komodo',
    'ark': 'ark',
    'sys': 'syscoin',
    'etn': 'electroneum',
    'pivx': 'pivx',
    'gnt': 'golem',
    'rep': 'augur',
    'salt': 'salt',
    'fun': 'funfair',
    'req': 'request-network',
    'pay': 'tenx',
    'cnd': 'cindicator',
    'eng': 'enigma',
    'storj': 'storj',
    'knc': 'kyber-network',
    'powr': 'power-ledger',
    'rlc': 'iexec-rlc',
    'cvc': 'civic',
    'mco': 'monaco',
    'mtl': 'metal',
    'adx': 'adx-net',
    'ast': 'airswap',
    'dnt': 'district0x',
    'cdt': 'bloxcity',
    'tnt': 'tierion',
    'vib': 'viberate',
    'lun': 'lunyr',
    'edg': 'edgeless',
    'wings': 'wings',
    'bnt': 'bancor',
    'qsp': 'quantstamp',
    'rcn': 'ripio-credit-network',
    'rdn': 'raiden-network-token',
    'snt': 'status',
}

// Кэш цен для уменьшения количества запросов
interface PriceCache {
    [key: string]: {
        price: number
        timestamp: number
    }
}

const priceCache: PriceCache = {}
const CACHE_TTL = 60 * 1000 // 1 минута

export class PriceService {
    /**
     * Получить цену криптовалюты в USD
     * @param symbol Символ криптовалюты (например, 'BTC', 'ETH')
     */
    async getPrice(symbol: string): Promise<number> {
        // Нормализация символа
        let normalizedSymbol = symbol.toLowerCase()

        // Обработка специальных случаев (например, USDT-ERC20 -> usdt)
        if (normalizedSymbol.includes('-')) {
            normalizedSymbol = normalizedSymbol.split('-')[0]
        }

        // Стейблкоины всегда 1 USD (для упрощения и надежности)
        if (['usdt', 'usdc', 'busd', 'dai', 'usde', 'tusd', 'usdd', 'usds'].includes(normalizedSymbol)) {
            return 1.0
        }

        const coingeckoId = COINGECKO_IDS[normalizedSymbol]
        if (!coingeckoId) {
            logger.warn(`No CoinGecko ID found for symbol: ${symbol}`)
            // Если ID не найден, возвращаем 0 или выбрасываем ошибку
            // Для тестовых целей можно вернуть заглушку, но лучше ошибку
            throw new Error(`Price not found for ${symbol}`)
        }

        // Проверка кэша
        const cached = priceCache[normalizedSymbol]
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.price
        }

        try {
            const response = await axios.get<CoinGeckoPriceResponse>(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
            )

            if (response.data[coingeckoId] && response.data[coingeckoId].usd) {
                const price = response.data[coingeckoId].usd

                // Обновление кэша
                priceCache[normalizedSymbol] = {
                    price,
                    timestamp: Date.now()
                }

                return price
            } else {
                throw new Error(`Invalid response from CoinGecko for ${coingeckoId}`)
            }
        } catch (error) {
            logger.error(`Failed to fetch price for ${symbol}:`, error)

            // Если есть кэш (даже устаревший), возвращаем его при ошибке API
            if (cached) {
                logger.warn(`Using stale cache for ${symbol}`)
                return cached.price
            }

            throw error
        }
    }

    /**
     * Конвертировать USD в криптовалюту
     * @param usdAmount Сумма в USD
     * @param symbol Символ криптовалюты
     */
    async convertUsdToCrypto(usdAmount: number, symbol: string): Promise<{ cryptoAmount: number, exchangeRate: number }> {
        const price = await this.getPrice(symbol)
        if (price === 0) throw new Error('Price is zero')

        // Округляем до 8 знаков для крипты
        const cryptoAmount = Number((usdAmount / price).toFixed(8))

        return {
            cryptoAmount,
            exchangeRate: price
        }
    }
}

export const priceService = new PriceService()
