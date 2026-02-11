// Presale Configuration
export const PRESALE_CONFIG = {
  // Total Supply
  TOTAL_SUPPLY: 1_000_000_000, // 1 Billion tokens
  
  // Team Wallet
  TEAM_WALLET: '0x0722Ef1DCfa7849B3BF0DB375793bFAcc52b8e39',
  
  // Token Allocations
  ALLOCATIONS: {
    PRESALE: 30,      // 30% - 300M tokens for presale
    LIQUIDITY: 25,    // 25% - 250M for liquidity
    TEAM: 5,          // 5% - 50M for team
    MARKETING: 10,    // 10% - 100M for marketing
    DEVELOPMENT: 15,  // 15% - 150M for development
    COMMUNITY: 10,    // 10% - 100M for community rewards
    RESERVE: 5,       // 5% - 50M reserve
  },
  
  // Current Status
  CURRENT_STAGE: 1,
  TOTAL_STAGES: 9,
  
  // Stage Configuration
  STAGES: [
    { stage: 1, price: 0.0001, tokens: 33333333, raised: 0, target: 3333.33 },    // $0.0001 per token
    { stage: 2, price: 0.00015, tokens: 33333333, raised: 0, target: 5000 },      // $0.00015 per token
    { stage: 3, price: 0.00022, tokens: 33333333, raised: 0, target: 7333.33 },   // $0.00022 per token
    { stage: 4, price: 0.00032, tokens: 33333333, raised: 0, target: 10666.67 },  // $0.00032 per token
    { stage: 5, price: 0.00047, tokens: 33333333, raised: 0, target: 15666.67 },  // $0.00047 per token
    { stage: 6, price: 0.00069, tokens: 33333333, raised: 0, target: 23000 },     // $0.00069 per token
    { stage: 7, price: 0.00101, tokens: 33333333, raised: 0, target: 33666.67 },  // $0.00101 per token
    { stage: 8, price: 0.00148, tokens: 33333333, raised: 0, target: 49333.33 },  // $0.00148 per token
    { stage: 9, price: 0.00217, tokens: 33333339, raised: 0, target: 72333.33 },  // $0.00217 per token
  ],
  
  // Starting amount already raised (in USD)
  INITIAL_RAISED: 3649,
  
  // Payment Methods
  PAYMENT_METHODS: {
    ETH: 'ETH',
    CARD: 'CARD',
  },
  
  // Min/Max Purchase (in USD)
  MIN_PURCHASE: 10,
  MAX_PURCHASE: 50000,
};

// Calculate stage progress
export function getStageProgress(stageIndex: number, stageRaised: number): number {
  const stage = PRESALE_CONFIG.STAGES[stageIndex];
  if (!stage) return 0;
  return Math.min((stageRaised / stage.target) * 100, 100);
}

// Get current token price based on stage
export function getCurrentPrice(stageIndex: number): number {
  const stage = PRESALE_CONFIG.STAGES[stageIndex];
  return stage ? stage.price : PRESALE_CONFIG.STAGES[0].price;
}

// Calculate tokens for USD amount
export function calculateTokens(usdAmount: number, price: number): number {
  return Math.floor(usdAmount / price);
}

// Calculate USD for ETH amount (mock ETH price - in production use oracle)
export function calculateUSDFromETH(ethAmount: number, ethPrice: number = 3500): number {
  return ethAmount * ethPrice;
}
