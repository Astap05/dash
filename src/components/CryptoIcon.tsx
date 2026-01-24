interface CryptoIconProps {
    symbol: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const CryptoIcon = ({ symbol, size = 'md', className = '' }: CryptoIconProps) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
    }

    // Маппинг символов на названия файлов иконок
    const getIconFileName = (sym: string): string => {
        const fileMap: Record<string, string> = {
            'BTC': 'btc',
            'ETH': 'eth',
            'USDT': 'usdt',
            'BNB': 'bnb',
            'XRP': 'xrp',
            'SOL': 'sol',
            'USDC': 'usdc',
            'TRX': 'trx',
            'STETH': 'steth',
            'DOGE': 'doge',
            'ADA': 'ada',
            'WSTETH': 'wsteth',
            'XMR': 'xmr',
            'WBT': 'wbt',
            'WBETH': 'weth',
            'WBTC': 'wbtc',
            'BCH': 'bch',
            'WEETH': 'weth',
            'USDS': 'usdc',
            'LINK': 'link',
            'BSC-USD': 'busd',
            'LEO': 'leo',
            'WETH': 'weth',
            'XLM': 'xlm',
            'CBBTC': 'wbtc',
            'ZFC': 'zec',
            'SUI': 'sui',
            'USDE': 'usdc',
            'AVAX': 'avax',
            'DAI': 'dai',
            'FIGR_HELOC': 'eth',
        }

        return fileMap[sym] || sym.toLowerCase()
    }

    // Цвет фона для каждой криптовалюты
    const getBackgroundColor = (sym: string): string => {
        const colorMap: Record<string, string> = {
            'BTC': '#F7931A',
            'ETH': '#627EEA',
            'USDT': '#26A17B',
            'BNB': '#F3BA2F',
            'XRP': '#23292F',
            'SOL': '#9945FF',
            'USDC': '#2775CA',
            'TRX': '#FF060A',
            'STETH': '#00A3FF',
            'DOGE': '#C2A633',
            'ADA': '#0033AD',
            'WSTETH': '#00A3FF',
            'XMR': '#FF6600',
            'WBT': '#1E1E1E',
            'WBETH': '#627EEA',
            'WBTC': '#F09242',
            'BCH': '#8DC351',
            'WEETH': '#627EEA',
            'USDS': '#2775CA',
            'LINK': '#2A5ADA',
            'BSC-USD': '#F3BA2F',
            'LEO': '#FF0080',
            'WETH': '#627EEA',
            'XLM': '#14151A',
            'CBBTC': '#0052FF',
            'ZFC': '#ECB244',
            'SUI': '#6FBCF0',
            'USDE': '#2775CA',
            'AVAX': '#E84142',
            'DAI': '#F5AC37',
            'FIGR_HELOC': '#9945FF',
        }

        return colorMap[sym] || '#6B7280'
    }

    const iconFileName = getIconFileName(symbol)
    const bgColor = getBackgroundColor(symbol)

    // Используем jsDelivr CDN для cryptocurrency-icons
    const iconUrl = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${iconFileName}.svg`

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden bg-white ${className}`}
        >
            <img
                src={iconUrl}
                alt={symbol}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => {
                    // Если иконка не загрузилась, показываем цветной круг с буквой
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                        parent.style.backgroundColor = bgColor
                        parent.innerHTML = `<span class="text-white font-bold text-sm">${symbol.charAt(0)}</span>`
                    }
                }}
            />
        </div>
    )
}

export default CryptoIcon
