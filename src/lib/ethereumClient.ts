import { ethers } from 'ethers';

// Ethereum network configuration
export const ETHEREUM_NETWORKS = {
  mainnet: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    chainId: 1,
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    chainId: 11155111,
    blockExplorer: 'https://sepolia.etherscan.io'
  }
};

// Popular Ethereum protocols and their contract addresses
export const PROTOCOL_MAPPINGS: { [key: string]: string } = {
  // DEXs
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2 Router',
  '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3 Router',
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': 'Uniswap V3 Router 2',
  '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': 'SushiSwap Router',
  '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506': 'SushiSwap Router V2',
  '0x1111111254EEB25477B68fb85Ed929f73A960582': '1inch Router',
  '0x7C2508411c79e8C5C0c2423d48cD6b0E5e1D2a47': '1inch Router V5',
  
  // Lending
  '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9': 'Aave V2 Lending Pool',
  '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2': 'Aave V3 Lending Pool',
  '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5': 'Compound cETH',
  '0x39AA39c021dfbaE8faC545936693aC917d5E7563': 'Compound cUSDC',
  '0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9': 'Compound cUSDT',
  
  // Staking
  '0x00000000219ab540356cBB839Cbe05303d7705Fa': 'Ethereum 2.0 Deposit Contract',
  '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84': 'Lido stETH',
  '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704': 'Coinbase cbETH',
  '0xae78736Cd615f374D3085123A210448E74Fc6393': 'Rocket Pool rETH',
  
  // NFTs
  '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D': 'Bored Ape Yacht Club',
  '0x60E4d786628Fea6478F785A6d7e704777c86a7c6': 'Mutant Ape Yacht Club',
  '0xED5AF388653567Af2F388E6224dC7C4b3241C544': 'Azuki',
  '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B': 'CloneX',
  
  // Bridges
  '0x3ee18B2214AFF97000D97cf826a7A8C3F3d415F0': 'Wormhole Bridge',
  '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3d': 'Arbitrum Bridge',
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a': 'Polygon Bridge',
  
  // Other DeFi
  '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643': 'Compound cDAI',
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI Stablecoin',
  '0xA0b86a33E6441b8c4C8C0e4b8b2c4C8C0e4b8b2c': 'MakerDAO',
  '0x514910771AF9Ca656af840dff83E8264EcF986CA': 'Chainlink LINK',
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'Wrapped Bitcoin (WBTC)'
};

// Popular Ethereum tokens
export const POPULAR_TOKENS: { [key: string]: { name: string; symbol: string; decimals: number; logo?: string } } = {
  '0x0000000000000000000000000000000000000000': { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': { name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
  '0xA0b86a33E6441b8c4C8C0e4b8b2c4C8C0e4b8b2c': { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': { name: 'Tether USD', symbol: 'USDT', decimals: 6 },
  '0x514910771AF9Ca656af840dff83E8264EcF986CA': { name: 'Chainlink', symbol: 'LINK', decimals: 18 },
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': { name: 'Wrapped Bitcoin', symbol: 'WBTC', decimals: 8 },
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': { name: 'Uniswap', symbol: 'UNI', decimals: 18 },
  '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0': { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
  '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84': { name: 'Lido Staked ETH', symbol: 'stETH', decimals: 18 }
};

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider(ETHEREUM_NETWORKS.mainnet.rpcUrl);

export function getProtocolName(address: string): string {
  return PROTOCOL_MAPPINGS[address] || 'Unknown Protocol';
}

export function getTokenInfo(tokenAddress: string): { name: string; symbol: string; decimals: number } {
  return POPULAR_TOKENS[tokenAddress] || { name: 'Unknown Token', symbol: 'UNK', decimals: 18 };
}

export async function fetchTransactionDetails(hash: string): Promise<ethers.TransactionResponse | null> {
  try {
    const tx = await provider.getTransaction(hash);
    return tx;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw new Error('Failed to fetch transaction details');
  }
}

export async function fetchTransactionReceipt(hash: string): Promise<ethers.TransactionReceipt | null> {
  try {
    const receipt = await provider.getTransactionReceipt(hash);
    return receipt;
  } catch (error) {
    console.error('Error fetching transaction receipt:', error);
    throw new Error('Failed to fetch transaction receipt');
  }
}

export async function fetchBlockDetails(blockNumber: number): Promise<ethers.Block | null> {
  try {
    const block = await provider.getBlock(blockNumber);
    return block;
  } catch (error) {
    console.error('Error fetching block:', error);
    throw new Error('Failed to fetch block details');
  }
}

export async function fetchRecentTransactions(limit: number = 10): Promise<string[]> {
  try {
    const latestBlock = await provider.getBlockNumber();
    const transactions: string[] = [];
    
    // Get transactions from recent blocks
    for (let i = 0; i < limit && i < 5; i++) {
      const block = await provider.getBlock(latestBlock - i, true);
      if (block && block.transactions) {
        const txHashes = block.transactions.slice(0, 2).map(tx => 
          typeof tx === 'string' ? tx : tx.hash
        );
        transactions.push(...txHashes);
      }
    }
    
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
}

export async function getNetworkStats(): Promise<{
  blockNumber: number;
  gasPrice: bigint;
  networkHashrate: string;
  difficulty: bigint;
}> {
  try {
    const [blockNumber, feeData, block] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
      provider.getBlock('latest')
    ]);
    
    return {
      blockNumber,
      gasPrice: feeData.gasPrice || 0n,
      networkHashrate: '0', // Would need additional API for this
      difficulty: block?.difficulty || 0n
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    throw new Error('Failed to fetch network statistics');
  }
}

export function detectTransactionType(transaction: ethers.TransactionResponse, receipt: ethers.TransactionReceipt): string {
  // Check for token transfers
  if (transaction.data === '0x' && transaction.value > 0) {
    return 'ETH_TRANSFER';
  }
  
  // Check for contract interactions
  if (transaction.to && transaction.data !== '0x') {
    const protocol = getProtocolName(transaction.to);
    if (protocol !== 'Unknown Protocol') {
      if (protocol.includes('Uniswap') || protocol.includes('SushiSwap') || protocol.includes('1inch')) {
        return 'DEX_SWAP';
      }
      if (protocol.includes('Aave') || protocol.includes('Compound')) {
        return 'LENDING';
      }
      if (protocol.includes('stETH') || protocol.includes('rETH')) {
        return 'STAKING';
      }
      if (protocol.includes('Bridge')) {
        return 'BRIDGE';
      }
    }
    
    // Check for NFT interactions
    if (receipt.logs.some(log => 
      log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event
    )) {
      return 'NFT_TRANSFER';
    }
    
    return 'CONTRACT_INTERACTION';
  }
  
  return 'UNKNOWN';
}

export function calculateGasEfficiency(gasUsed: bigint, gasLimit: bigint): string {
  const efficiency = Number(gasUsed) / Number(gasLimit);
  if (efficiency > 0.9) return 'High';
  if (efficiency > 0.7) return 'Medium';
  return 'Low';
}

export function formatEther(value: bigint): string {
  return ethers.formatEther(value);
}

export function formatUnits(value: bigint, decimals: number): string {
  return ethers.formatUnits(value, decimals);
}

export function parseEther(value: string): bigint {
  return ethers.parseEther(value);
}

export function parseUnits(value: string, decimals: number): bigint {
  return ethers.parseUnits(value, decimals);
}
