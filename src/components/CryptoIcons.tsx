import { useState } from 'react'
import { useCryptoPrices } from '../hooks/useCryptoPrices'

interface CryptoIcon {
  symbol: string
  name: string
  imageUrls: string[] // Массив URL для fallback
}

const cryptoIcons: CryptoIcon[] = [
  { symbol: 'BTC', name: 'Bitcoin', imageUrls: ['https://assets.coingecko.com/coins/images/1/small/bitcoin.png', 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png'] },
  { symbol: 'ETH', name: 'Ethereum', imageUrls: ['https://assets.coingecko.com/coins/images/279/small/ethereum.png', 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png'] },
  { symbol: 'BNB', name: 'Binance Coin', imageUrls: ['https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', 'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'] },
  { symbol: 'SOL', name: 'Solana', imageUrls: ['https://assets.coingecko.com/coins/images/4128/small/solana.png', 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png'] },
  { symbol: 'MATIC', name: 'Polygon', imageUrls: ['https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', 'https://coin-images.coingecko.com/coins/images/4713/small/matic-token-icon.png'] },
  { symbol: 'LINK', name: 'Chainlink', imageUrls: ['https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', 'https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png'] },
  { symbol: 'UNI', name: 'Uniswap', imageUrls: ['https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png', 'https://coin-images.coingecko.com/coins/images/12504/small/uniswap-uni.png'] },
  { symbol: 'AAVE', name: 'Aave', imageUrls: ['https://camo.githubusercontent.com/8e10431de601ce667064f4e249e7569090c34d57d22b3e8b0d77431f086f1516/68747470733a2f2f73332e61702d6e6f727468656173742d322e616d617a6f6e6177732e636f6d2f63646e2e6e6177732e61692f696d616765732f636f696e2d6c6f676f732f746f6b656e5f73796d626f6c735f616176652e706e67', 'https://coin-images.coingecko.com/coins/images/12645/small/aave.png'] },
  { symbol: 'XRP', name: 'Ripple', imageUrls: ['https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', 'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'] },
  { symbol: 'ADA', name: 'Cardano', imageUrls: ['https://assets.coingecko.com/coins/images/975/small/cardano.png', 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png'] },
  { symbol: 'AVAX', name: 'Avalanche', imageUrls: ['https://assets.coingecko.com/coins/images/12559/small/avalanche-avax-logo.png', 'https://coin-images.coingecko.com/coins/images/12559/small/avalanche-avax-logo.png'] },
  { symbol: 'DOT', name: 'Polkadot', imageUrls: ['https://assets.coingecko.com/coins/images/12171/small/polkadot.png', 'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png'] },
  { symbol: 'ATOM', name: 'Cosmos', imageUrls: ['https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png', 'https://coin-images.coingecko.com/coins/images/1481/small/cosmos_hub.png'] },
  { symbol: 'LTC', name: 'Litecoin', imageUrls: ['https://assets.coingecko.com/coins/images/2/small/litecoin.png', 'https://coin-images.coingecko.com/coins/images/2/small/litecoin.png'] },
  { symbol: 'BCH', name: 'Bitcoin Cash', imageUrls: ['https://assets.coingecko.com/coins/images/780/small/bitcoin-cash.png', 'https://coin-images.coingecko.com/coins/images/780/small/bitcoin-cash.png'] },
  { symbol: 'XLM', name: 'Stellar', imageUrls: ['https://assets.coingecko.com/coins/images/100/small/stellar.png', 'https://coin-images.coingecko.com/coins/images/100/small/stellar.png'] },
  { symbol: 'ALGO', name: 'Algorand', imageUrls: ['https://assets.coingecko.com/coins/images/4380/small/download.png', 'https://coin-images.coingecko.com/coins/images/4380/small/download.png'] },
  { symbol: 'FIL', name: 'Filecoin', imageUrls: ['https://assets.coingecko.com/coins/images/12817/small/filecoin.png', 'https://coin-images.coingecko.com/coins/images/12817/small/filecoin.png'] },
]

function CryptoIconItem({ crypto, price, change24h }: { crypto: CryptoIcon; price?: number; change24h?: number }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    if (currentImageIndex < crypto.imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    } else {
      setImageError(true)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else {
      return `$${price.toFixed(4)}`
    }
  }

  return (
    <div
      className="aspect-square rounded-full bg-[#2a2a2a] flex flex-col items-center justify-center hover:bg-[#3a3a3a] transition-colors cursor-pointer overflow-hidden relative group"
      title={`${crypto.name}${price ? ` - ${formatPrice(price)}` : ''}`}
    >
      {!imageError ? (
        <img
          key={currentImageIndex}
          src={crypto.imageUrls[currentImageIndex]}
          alt={crypto.name}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-medium text-gray-300">{crypto.symbol}</span>
      )}
      {price && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-white font-semibold">{formatPrice(price)}</div>
          {change24h !== undefined && (
            <div className={`text-xs ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CryptoIcons() {
  const symbols = cryptoIcons.map((c) => c.symbol)
  const { prices, isConnected, isUsingDemo } = useCryptoPrices(symbols)

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Crypto Prices</h3>
        {isConnected ? (
          <div className="flex items-center gap-2 text-xs">
            {isUsingDemo ? (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400">Demo Data</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">Live</span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            Connecting...
          </div>
        )}
      </div>
      <div className="grid grid-cols-6 gap-4">
        {cryptoIcons.map((crypto, index) => {
          const priceData = prices.get(crypto.symbol)
          return (
            <CryptoIconItem
              key={index}
              crypto={crypto}
              price={priceData?.price}
              change24h={priceData?.change24h}
            />
          )
        })}
      </div>
    </div>
  )
}

export default CryptoIcons

