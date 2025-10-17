export interface EthereumTransactionExplanation {
  hash: string;
  success: boolean;
  summary: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: bigint;
  gasPrice: bigint;
  gasFee: number;
  from: string;
  to: string | null;
  value: bigint;
  valueInEth: number;
  transactionType: string;
  protocol?: string;
  functionCalls: FunctionCall[];
  tokenTransfers: TokenTransfer[];
  balanceChanges: BalanceChange[];
  educationalContent: string[];
  error?: string;
  mevAnalysis?: MEVAnalysis;
}

export interface FunctionCall {
  function: string;
  signature: string;
  arguments: unknown[];
  protocol: string;
  description: string;
}

export interface TokenTransfer {
  from: string;
  to: string;
  amount: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  description: string;
}

export interface BalanceChange {
  account: string;
  preBalance: number;
  postBalance: number;
  change: number;
  changeType: 'increase' | 'decrease';
  usdValue: string;
  tokenType: string;
}

export interface MEVAnalysis {
  isMEV: boolean;
  mevType: 'arbitrage' | 'sandwich' | 'liquidation' | 'frontrun' | 'none';
  confidence: number;
  profit: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export type TransactionType = 
  | 'ETH_TRANSFER'
  | 'DEX_SWAP'
  | 'LENDING'
  | 'STAKING'
  | 'BRIDGE'
  | 'NFT_TRANSFER'
  | 'CONTRACT_INTERACTION'
  | 'UNKNOWN';

export interface NetworkStats {
  blockNumber: number;
  gasPrice: bigint;
  networkHashrate: string;
  difficulty: bigint;
  tps: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RecentTransaction {
  hash: string;
  type: string;
  gasFee: number;
  timestamp: number;
  success: boolean;
}
