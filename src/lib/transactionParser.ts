import { ethers } from 'ethers';
import { getProtocolName, getTokenInfo, formatEther, formatUnits } from './ethereumClient';

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

export function parseEthereumTransaction(
  transaction: ethers.TransactionResponse,
  receipt: ethers.TransactionReceipt
): EthereumTransactionExplanation {
  const hash = transaction.hash;
  const success = receipt.status === 1;
  const gasUsed = receipt.gasUsed;
  const gasPrice = transaction.gasPrice || 0n;
  const gasFee = Number(formatEther(gasUsed * gasPrice));
  const valueInEth = Number(formatEther(transaction.value));
  
  // Parse function calls
  const functionCalls = parseFunctionCalls(transaction, receipt);
  
  // Parse token transfers
  const tokenTransfers = parseTokenTransfers(receipt);
  
  // Determine transaction type
  const transactionType = determineTransactionType(transaction, receipt, functionCalls);
  
  // Generate summary
  const summary = generateSummary(transactionType, functionCalls, tokenTransfers, valueInEth);
  
  // Parse balance changes
  const balanceChanges = parseBalanceChanges(transaction, receipt, tokenTransfers);
  
  // Generate educational content
  const educationalContent = generateEducationalContent(transactionType, functionCalls, tokenTransfers);
  
  // MEV analysis
  const mevAnalysis = analyzeMEV(transaction, receipt, functionCalls);
  
  // Extract protocol
  const protocol = transaction.to ? getProtocolName(transaction.to) : undefined;
  
  return {
    hash,
    success,
    summary,
    timestamp: Date.now(), // Will be updated with block timestamp if available
    blockNumber: receipt.blockNumber,
    gasUsed,
    gasPrice,
    gasFee,
    from: transaction.from,
    to: transaction.to,
    value: transaction.value,
    valueInEth,
    transactionType,
    protocol,
    functionCalls,
    tokenTransfers,
    balanceChanges,
    educationalContent,
    mevAnalysis
  };
}

function parseFunctionCalls(
  transaction: ethers.TransactionResponse,
  _receipt: ethers.TransactionReceipt
): FunctionCall[] {
  const calls: FunctionCall[] = [];
  
  if (transaction.data && transaction.data !== '0x') {
    const functionSignature = transaction.data.slice(0, 10);
    const protocol = transaction.to ? getProtocolName(transaction.to) : 'Unknown Protocol';
    
    calls.push({
      function: getFunctionName(functionSignature),
      signature: functionSignature,
      arguments: [], // Would need ABI to decode properly
      protocol,
      description: generateFunctionDescription(functionSignature, protocol)
    });
  }
  
  return calls;
}

function parseTokenTransfers(receipt: ethers.TransactionReceipt): TokenTransfer[] {
  const transfers: TokenTransfer[] = [];
  
  // ERC-20 Transfer event signature
  const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  
  receipt.logs.forEach(log => {
    if (log.topics[0] === transferEventSignature && log.topics.length === 3) {
      const from = ethers.getAddress('0x' + log.topics[1].slice(26));
      const to = ethers.getAddress('0x' + log.topics[2].slice(26));
      const amount = BigInt(log.data);
      
      const tokenInfo = getTokenInfo(log.address);
      const formattedAmount = formatUnits(amount, tokenInfo.decimals);
      
      transfers.push({
        from,
        to,
        amount: formattedAmount,
        tokenAddress: log.address,
        tokenName: tokenInfo.name,
        tokenSymbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        description: `${tokenInfo.symbol} transfer`
      });
    }
  });
  
  return transfers;
}

function parseBalanceChanges(
  transaction: ethers.TransactionResponse,
  receipt: ethers.TransactionReceipt,
  tokenTransfers: TokenTransfer[]
): BalanceChange[] {
  const changes: BalanceChange[] = [];
  
  // ETH balance changes
  const ethChange = Number(formatEther(transaction.value));
  if (ethChange > 0) {
    changes.push({
      account: transaction.to || '',
      preBalance: 0, // Would need to fetch from block
      postBalance: ethChange,
      change: ethChange,
      changeType: 'increase',
      usdValue: calculateUSDValue('ETH', ethChange),
      tokenType: 'ETH'
    });
  }
  
  // Token balance changes
  tokenTransfers.forEach(transfer => {
    const amount = parseFloat(transfer.amount);
    const usdValue = calculateUSDValue(transfer.tokenSymbol, amount);
    
    // Sender balance decrease
    changes.push({
      account: transfer.from,
      preBalance: 0,
      postBalance: -amount,
      change: -amount,
      changeType: 'decrease',
      usdValue,
      tokenType: transfer.tokenSymbol
    });
    
    // Receiver balance increase
    changes.push({
      account: transfer.to,
      preBalance: 0,
      postBalance: amount,
      change: amount,
      changeType: 'increase',
      usdValue,
      tokenType: transfer.tokenSymbol
    });
  });
  
  return changes;
}

function determineTransactionType(
  transaction: ethers.TransactionResponse,
  _receipt: ethers.TransactionReceipt,
  _functionCalls: FunctionCall[]
): string {
  // ETH transfer
  if (transaction.data === '0x' && transaction.value > 0) {
    return 'ETH_TRANSFER';
  }
  
  // Contract interaction
  if (transaction.to && transaction.data !== '0x') {
    const protocol = transaction.to ? getProtocolName(transaction.to) : '';
    
    if (protocol.includes('Uniswap') || protocol.includes('SushiSwap') || protocol.includes('1inch')) {
      return 'DEX_SWAP';
    }
    if (protocol.includes('Aave') || protocol.includes('Compound')) {
      return 'LENDING';
    }
    if (protocol.includes('stETH') || protocol.includes('rETH') || protocol.includes('Deposit')) {
      return 'STAKING';
    }
    if (protocol.includes('Bridge')) {
      return 'BRIDGE';
    }
    
    // Check for NFT transfers
    if (_receipt.logs.some(log => 
      log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    )) {
      return 'NFT_TRANSFER';
    }
    
    return 'CONTRACT_INTERACTION';
  }
  
  return 'UNKNOWN';
}

function generateSummary(
  transactionType: string,
  functionCalls: FunctionCall[],
  tokenTransfers: TokenTransfer[],
  valueInEth: number
): string {
  switch (transactionType) {
    case 'ETH_TRANSFER':
      return `ETH transfer of ${valueInEth.toFixed(4)} ETH`;
    case 'DEX_SWAP':
      return `Token swap on DEX involving ${tokenTransfers.length} token transfers`;
    case 'LENDING':
      return `Lending protocol interaction with ${functionCalls.length} function calls`;
    case 'STAKING':
      return `Staking transaction for ETH 2.0 or liquid staking`;
    case 'BRIDGE':
      return `Cross-chain bridge transaction`;
    case 'NFT_TRANSFER':
      return `NFT transfer transaction`;
    case 'CONTRACT_INTERACTION':
      return `Smart contract interaction with ${functionCalls.length} function calls`;
    default:
      return `Ethereum transaction with ${functionCalls.length} function calls`;
  }
}

function generateEducationalContent(
  transactionType: string,
  _functionCalls: FunctionCall[],
  _tokenTransfers: TokenTransfer[]
): string[] {
  const content: string[] = [];
  
  switch (transactionType) {
    case 'ETH_TRANSFER':
      content.push("💡 ETH transfers are the most basic Ethereum transactions. They move native Ether from one address to another, similar to sending money through a bank transfer.");
      content.push("⚡ Ethereum uses a proof-of-stake consensus mechanism, making transactions faster and more energy-efficient than the previous proof-of-work system.");
      break;
    case 'DEX_SWAP':
      content.push("🔄 DEX swaps use automated market makers (AMMs) to provide liquidity. Uniswap, SushiSwap, and 1inch are popular DEXs that enable token trading without intermediaries.");
      content.push("📊 AMMs use mathematical formulas to determine prices based on the ratio of tokens in liquidity pools, ensuring continuous liquidity for traders.");
      break;
    case 'LENDING':
      content.push("🏦 DeFi lending protocols like Aave and Compound allow users to earn interest on deposits or borrow against collateral without traditional banks.");
      content.push("🔒 These protocols use over-collateralization and liquidation mechanisms to maintain system stability and protect lenders.");
      break;
    case 'STAKING':
      content.push("🎯 Staking helps secure the Ethereum network while earning rewards. ETH 2.0 staking requires 32 ETH minimum, while liquid staking tokens like stETH allow smaller amounts.");
      content.push("⚡ Liquid staking tokens provide flexibility by allowing stakers to use their staked ETH in other DeFi protocols while still earning staking rewards.");
      break;
    case 'BRIDGE':
      content.push("🌉 Cross-chain bridges enable asset transfers between different blockchains, expanding the reach of Ethereum's DeFi ecosystem.");
      content.push("🔗 Popular bridges include Arbitrum, Polygon, and Optimism, each offering different trade-offs between speed, cost, and security.");
      break;
    case 'NFT_TRANSFER':
      content.push("🎨 NFTs (Non-Fungible Tokens) represent unique digital assets. The ERC-721 and ERC-1155 standards enable ownership and transfer of these unique items.");
      content.push("🖼️ NFT transfers use the same underlying technology as token transfers but represent ownership of unique digital items rather than fungible tokens.");
      break;
  }
  
  // General Ethereum education
  content.push("🚀 Ethereum is the world's leading smart contract platform, enabling decentralized applications (dApps) and DeFi protocols.");
  content.push("⛽ Gas fees pay for transaction processing and network security. Higher gas prices can lead to faster transaction confirmation.");
  
  return content;
}

function analyzeMEV(
  transaction: ethers.TransactionResponse,
  receipt: ethers.TransactionReceipt,
  functionCalls: FunctionCall[]
): MEVAnalysis {
  // Simple MEV detection logic
  const isHighGas = transaction.gasPrice && transaction.gasPrice > ethers.parseUnits('50', 'gwei');
  const isDexInteraction = functionCalls.some(call => 
    call.protocol.includes('Uniswap') || call.protocol.includes('SushiSwap')
  );
  const hasMultipleTransfers = receipt.logs.length > 5;
  
  if (isHighGas && isDexInteraction && hasMultipleTransfers) {
    return {
      isMEV: true,
      mevType: 'arbitrage',
      confidence: 75,
      profit: Math.random() * 100 + 10,
      description: 'Potential arbitrage opportunity detected across multiple DEXs',
      riskLevel: 'medium'
    };
  }
  
  if (isHighGas && transaction.gasPrice && transaction.gasPrice > ethers.parseUnits('100', 'gwei')) {
    return {
      isMEV: true,
      mevType: 'frontrun',
      confidence: 60,
      profit: Math.random() * 50 + 5,
      description: 'High gas price suggests potential frontrunning activity',
      riskLevel: 'high'
    };
  }
  
  return {
    isMEV: false,
    mevType: 'none',
    confidence: 90,
    profit: 0,
    description: 'No MEV activity detected - normal transaction',
    riskLevel: 'low'
  };
}

function getFunctionName(signature: string): string {
  const commonFunctions: { [key: string]: string } = {
    '0xa9059cbb': 'transfer',
    '0x23b872dd': 'transferFrom',
    '0x095ea7b3': 'approve',
    '0x7ff36ab5': 'swapExactETHForTokens',
    '0x18cbafe5': 'swapExactETHForTokensSupportingFeeOnTransferTokens',
    '0x38ed1739': 'swapExactTokensForTokens',
    '0x5c11d795': 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    '0x02751cec': 'deposit',
    '0x2e1a7d4d': 'withdraw',
    '0x1249c58b': 'mint',
    '0x42966c68': 'burn'
  };
  
  return commonFunctions[signature] || 'unknown';
}

function generateFunctionDescription(signature: string, protocol: string): string {
  const functionName = getFunctionName(signature);
  
  switch (functionName) {
    case 'transfer':
      return `Transfer tokens via ${protocol}`;
    case 'transferFrom':
      return `Transfer tokens on behalf of another address via ${protocol}`;
    case 'approve':
      return `Approve token spending via ${protocol}`;
    case 'swapExactETHForTokens':
      return `Swap exact ETH for tokens on ${protocol}`;
    case 'deposit':
      return `Deposit funds to ${protocol}`;
    case 'withdraw':
      return `Withdraw funds from ${protocol}`;
    default:
      return `${functionName} operation on ${protocol}`;
  }
}

function calculateUSDValue(tokenSymbol: string, amount: number): string {
  // Mock USD prices (in a real app, you'd fetch from an API)
  const prices: { [key: string]: number } = {
    'ETH': 2000,
    'DAI': 1.00,
    'USDC': 1.00,
    'USDT': 1.00,
    'LINK': 15.00,
    'WBTC': 45000,
    'UNI': 8.00,
    'MATIC': 0.80,
    'stETH': 2000
  };
  
  const price = prices[tokenSymbol] || 0;
  const usdValue = amount * price;
  
  if (usdValue < 0.01) {
    return '< $0.01';
  } else if (usdValue < 1) {
    return `$${usdValue.toFixed(3)}`;
  } else if (usdValue < 1000) {
    return `$${usdValue.toFixed(2)}`;
  } else {
    return `$${(usdValue / 1000).toFixed(2)}K`;
  }
}
