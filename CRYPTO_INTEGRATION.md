# Интеграция криптовалют - Документация

## Обзор изменений

В проект были интегрированы **30+ криптовалют** с поддержкой **17 блокчейн-сетей**.

## Список добавленных криптовалют

### Основные криптовалюты (1-10)
1. **Bitcoin (BTC)** - сеть: Bitcoin
2. **Ethereum (ETH)** - сеть: Ethereum
3. **Tether (USDT)** - сети: Ethereum, BSC, TRON, Polygon, Solana, Arbitrum, Avalanche
4. **BNB** - сеть: BSC
5. **XRP** - сеть: Ripple
6. **Solana (SOL)** - сеть: Solana
7. **USDC** - сети: Ethereum, BSC, Polygon, Solana, Arbitrum, Avalanche
8. **TRON (TRX)** - сеть: TRON
9. **Lido Staked Ether (STETH)** - сеть: Ethereum
10. **Dogecoin (DOGE)** - сеть: Dogecoin

### Дополнительные криптовалюты (11-20)
11. **Figure Heloc (FIGR_HELOC)** - сеть: Ethereum
12. **Cardano (ADA)** - сеть: Cardano
13. **Wrapped stETH (WSTETH)** - сеть: Ethereum
14. **Monero (XMR)** - сеть: Monero
15. **WhiteBIT Coin (WBT)** - сеть: Ethereum
16. **Wrapped Beacon ETH (WBETH)** - сеть: Ethereum
17. **Wrapped Bitcoin (WBTC)** - сети: Ethereum, BSC
18. **Bitcoin Cash (BCH)** - сеть: Bitcoin Cash
19. **Wrapped eETH (WEETH)** - сеть: Ethereum
20. **USDS** - сеть: Ethereum

### Токены и альткоины (21-30)
21. **Chainlink (LINK)** - сети: Ethereum, BSC
22. **Binance Bridged USDT (BSC-USD)** - сеть: BSC
23. **LEO Token (LEO)** - сеть: Ethereum
24. **WETH** - сети: Ethereum, BSC, Polygon, Arbitrum
25. **Stellar (XLM)** - сеть: Stellar
26. **Coinbase Wrapped BTC (CBBTC)** - сеть: Ethereum
27. **Zcash (ZFC)** - сеть: Zcash
28. **Sui (SUI)** - сеть: Sui
29. **Ethena USDe (USDE)** - сеть: Ethereum
30. **Avalanche (AVAX)** - сеть: Avalanche

### Дополнительные токены
- **DAI** - сети: Ethereum, BSC, Arbitrum

## Поддерживаемые блокчейн-сети

1. **Ethereum (ERC20)** - основная сеть Ethereum
2. **BNB Chain (BEP20)** - Binance Smart Chain
3. **Polygon (POLYGON)** - сеть Polygon
4. **Solana (SOL)** - сеть Solana
5. **Arbitrum (ARB1)** - Layer 2 для Ethereum
6. **Avalanche C-Chain** - сеть Avalanche
7. **TRON (TRC20)** - сеть TRON
8. **Bitcoin** - сеть Bitcoin
9. **Ripple (XRP)** - сеть Ripple
10. **Dogecoin** - сеть Dogecoin
11. **Cardano** - сеть Cardano
12. **Monero** - сеть Monero
13. **Bitcoin Cash** - сеть Bitcoin Cash
14. **Stellar** - сеть Stellar
15. **Zcash** - сеть Zcash
16. **Sui** - сеть Sui

## Измененные файлы

### Frontend (клиент)
1. **`src/components/InvoiceCreator.tsx`**
   - Добавлены все 30+ криптовалют
   - Обновлен список сетей (17 сетей)
   - Упрощена логика фильтрации по сетям

2. **`src/components/Dashboard.tsx`**
   - Синхронизирован список криптовалют с InvoiceCreator
   - Обновлена функция поиска валют

3. **`src/constants/cryptocurrencies.ts`** (новый файл)
   - Создан общий файл с константами
   - Экспортируются CRYPTOCURRENCIES и NETWORKS
   - Можно использовать для переиспользования в других компонентах

### Backend (сервер)
1. **`server/src/middleware/validation.ts`**
   - Обновлена валидация для поддержки всех новых валют
   - Добавлены все новые блокчейн-сети
   - Валидация теперь принимает 31 валюту и 16 сетей

## Как использовать

### Создание инвойса
1. Откройте приложение
2. Выберите сеть из выпадающего списка (или оставьте "ALL" для просмотра всех)
3. Выберите криптовалюту из доступных вариантов
4. Введите сумму и никнейм
5. Нажмите "Продолжить"

### Фильтрация по сетям
- Выберите конкретную сеть (например, "Ethereum (ERC20)") для отображения только токенов этой сети
- Выберите "ALL" для отображения всех доступных криптовалют

## Технические детали

### Структура данных валюты
```typescript
interface CryptoCurrency {
  id: string           // Уникальный идентификатор
  symbol: string       // Символ валюты (BTC, ETH, и т.д.)
  name: string         // Полное название
  network: string      // Блокчейн-сеть
  icon: string         // Иконка (символ или эмодзи)
  available: boolean   // Доступность для использования
}
```

### Валидация на сервере
Сервер проверяет:
- Валюта должна быть из списка поддерживаемых (31 валюта)
- Сеть должна быть из списка поддерживаемых (16 сетей)
- Сумма должна быть положительной и не превышать 10,000 USD

## Примечания

1. **Мультисетевые токены**: Некоторые токены (USDT, USDC, WETH, и др.) доступны в нескольких сетях
2. **Иконки**: Используются Unicode-символы для отображения иконок валют
3. **Расширяемость**: Легко добавить новые валюты в файл `src/constants/cryptocurrencies.ts`

## Статус проекта

✅ Frontend - все валюты интегрированы
✅ Backend - валидация обновлена
✅ Сервер запущен и работает
✅ Клиент запущен и работает

## Следующие шаги (опционально)

1. Добавить реальные иконки криптовалют (вместо Unicode-символов)
2. Интегрировать API для получения актуальных курсов валют
3. Добавить поддержку дополнительных сетей по мере необходимости
4. Реализовать функционал для работы с кошельками всех добавленных сетей
