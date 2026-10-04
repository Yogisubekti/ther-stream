export const PAY_TO = "0xab6bc966Cb63DA3a1FE0303a736D548E1D9d8591" as const;
export const PROMO_LIMIT = 1000;

export const PLANS = {
  promo: { usd: 3, days: 90, og: false },
  monthly: { usd: 3, days: 30, og: false },
  yearly: { usd: 30, days: 365, og: true },
} as const;
export type PlanId = keyof typeof PLANS;

export const CHAINS = {
  base: { id: 8453, name: "Base", rpc: "https://mainnet.base.org", explorer: "https://basescan.org",
    tokens: { USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 }, USDT: { address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 } } },
  polygon: { id: 137, name: "Polygon", rpc: "https://polygon-rpc.com", explorer: "https://polygonscan.com",
    tokens: { USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 }, USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 } } },
  bnb: { id: 56, name: "BNB Chain", rpc: "https://bsc-dataseed.binance.org", explorer: "https://bscscan.com",
    tokens: { USDC: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 }, USDT: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 } } },
} as const;
export type ChainId = keyof typeof CHAINS;
export type TokenId = "USDC" | "USDT";
