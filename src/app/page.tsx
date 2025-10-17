'use client';

import { useState, useEffect } from 'react';
// import Image from 'next/image';
import { Search, Loader2, Moon, Sun, History, TrendingUp, Copy, Download, Share2, ExternalLink, XCircle } from 'lucide-react';
import { fetchTransactionDetails, fetchTransactionReceipt, fetchRecentTransactions } from '@/lib/ethereumClient';
import { parseEthereumTransaction } from '@/lib/transactionParser';
import type { EthereumTransactionExplanation } from '@/types/transaction';
import NetworkStats from '@/components/NetworkStats';
import TransactionFlow from '@/components/TransactionFlow';
import MEVDetection from '@/components/MEVDetection';

export default function Home() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState<EthereumTransactionExplanation | null>(null);
  const [history, setHistory] = useState<EthereumTransactionExplanation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('ethereum-tx-history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to load history:', e);
        }
      }

      const savedDarkMode = localStorage.getItem('ethereum-dark-mode');
      if (savedDarkMode === 'true') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ethereum-dark-mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('ethereum-dark-mode', 'false');
      }
    }
  }, [darkMode]);

  const handleSearch = async () => {
    if (!hash.trim()) return;

    setLoading(true);
    setError('');
    setTransaction(null);

    try {
      const [txData, receipt] = await Promise.all([
        fetchTransactionDetails(hash.trim()),
        fetchTransactionReceipt(hash.trim())
      ]);
      
      if (!txData || !receipt) {
        throw new Error('Transaction not found');
      }
      
      const parsedTx = parseEthereumTransaction(txData, receipt);
      
      setTransaction(parsedTx);
      
      // Add to history
      const newHistory = [parsedTx, ...history.slice(0, 9)];
      setHistory(newHistory);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('ethereum-tx-history', JSON.stringify(newHistory));
      }
    } catch (err) {
      setError('Transaction not found or invalid hash');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const recentTxs = await fetchRecentTransactions(10);
      if (recentTxs && recentTxs.length > 0) {
        // Pick a random transaction from the recent ones
        const randomTxHash = recentTxs[Math.floor(Math.random() * recentTxs.length)];
        setHash(randomTxHash);
        // Trigger the search
        setLoading(true);
        setError('');
        setTransaction(null);
        
        try {
          const [txData, receipt] = await Promise.all([
            fetchTransactionDetails(randomTxHash),
            fetchTransactionReceipt(randomTxHash)
          ]);
          
          if (!txData || !receipt) {
            throw new Error('Transaction not found');
          }
          
          const parsedTx = parseEthereumTransaction(txData, receipt);
          
          setTransaction(parsedTx);
          
          // Add to history
          const newHistory = [parsedTx, ...history.slice(0, 9)];
          setHistory(newHistory);
          
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('ethereum-tx-history', JSON.stringify(newHistory));
          }
        } catch (searchErr) {
          setError('Failed to load transaction details');
          console.error('Search error:', searchErr);
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Failed to load recent transactions:', err);
      setError('Failed to load recent transactions');
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const loadFromHistory = async (txHash: string) => {
    setHash(txHash);
    setShowHistory(false);
    setLoading(true);
    setError('');
    setTransaction(null);

    try {
      const [txData, receipt] = await Promise.all([
        fetchTransactionDetails(txHash),
        fetchTransactionReceipt(txHash)
      ]);
      
      if (!txData || !receipt) {
        throw new Error('Transaction not found');
      }
      
      const parsedTx = parseEthereumTransaction(txData, receipt);
      
      setTransaction(parsedTx);
    } catch (err) {
      setError('Transaction not found or invalid hash');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = () => {
    if (!transaction) return;
    
    const dataStr = JSON.stringify(transaction, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ethereum-transaction-${transaction.hash}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareTransaction = async () => {
    if (!transaction) return;
    
    const shareData = {
      title: 'Ethereum Transaction Analysis',
      text: `Check out this Ethereum transaction: ${transaction.hash}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard(shareData.url, 'share');
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const openInExplorer = () => {
    if (!transaction) return;
    window.open(`https://etherscan.io/tx/${transaction.hash}`, '_blank');
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'DEX_SWAP': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'ETH_TRANSFER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'STAKING': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'LENDING': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'NFT_TRANSFER': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      case 'BRIDGE': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="text-white"
                  >
                    <path 
                      d="M12 1.75L5.75 12.25L12 16L18.25 12.25L12 1.75Z" 
                      fill="currentColor"
                    />
                    <path 
                      d="M5.75 13.75L12 17.5L18.25 13.75L12 22.25L5.75 13.75Z" 
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Ethereum Explorer
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  An Easy to Read Ethereum Blockchain Explorer
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Network Dashboard"
              >
                <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Transaction History"
              >
                <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Transaction History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.slice(0, 6).map((tx, index) => (
                  <button
                    key={index}
                    onClick={() => loadFromHistory(tx.hash)}
                    className="p-3 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left"
                  >
                    <div className="font-mono text-xs text-slate-600 dark:text-slate-400 mb-1">
                      {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {tx.transactionType}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {tx.gasFee.toFixed(6)} ETH
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No transaction history yet. Analyze some transactions to build your history!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Panel */}
      {showDashboard && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Ethereum Network Dashboard
              </h3>
              <button
                onClick={() => setShowDashboard(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            <NetworkStats />
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Search Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Explore Ethereum Transactions
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Enter any Ethereum transaction hash to get a detailed, easy-to-understand analysis with MEV detection, balance changes, and educational insights.
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter Ethereum transaction hash..."
                  className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !hash.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={loadRecentTransactions}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Recent Transactions
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
              <span className="text-slate-600 dark:text-slate-400 text-xs">
                💡 <strong>Pro tip:</strong> Copy any transaction hash from <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">Etherscan</a>
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && !transaction && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {transaction && (
          <div className="space-y-6">
            {/* Professional Summary Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              
              <div className="relative z-10">
                <div className="flex items-start gap-6 mb-8">
                  <div className="flex-shrink-0">
                    {transaction.success ? (
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">✗</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Transaction Analysis
                      </h2>
                      <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${getTransactionTypeColor(transaction.transactionType)}`}>
                        {transaction.transactionType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {transaction.summary}
                    </p>
                    
                    {/* What Happened Section */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        What Happened
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {transaction.transactionType === 'ETH_TRANSFER' 
                          ? `This transaction transferred ${transaction.valueInEth.toFixed(4)} ETH from one address to another. The transaction cost ${transaction.gasFee.toFixed(6)} ETH in gas fees, which covers network processing and validation.`
                          : transaction.transactionType === 'DEX_SWAP'
                          ? `You executed a token swap through a decentralized exchange. This transaction involved multiple token transfers and cost ${transaction.gasFee.toFixed(6)} ETH in gas fees. The swap was processed using Ethereum's smart contract system.`
                          : `This transaction modified blockchain state and cost ${transaction.gasFee.toFixed(6)} ETH in gas fees. The cost covers computation and storage operations on the Ethereum network.`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => copyToClipboard(transaction.hash, 'hash')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-200 font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    {copied === 'hash' ? 'Copied!' : 'Copy Hash'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(transaction.from, 'from')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-200 font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Copy From
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl transition-all duration-200 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={shareTransaction}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl transition-all duration-200 font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={openInExplorer}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl transition-all duration-200 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Etherscan
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Flow Visualization */}
            <TransactionFlow transaction={transaction} />

            {/* MEV Detection */}
            <MEVDetection transaction={transaction} />

            {/* Educational Content */}
            {transaction.educationalContent && transaction.educationalContent.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">
                    📚
                  </div>
                  Educational Content
                </h3>
                
                <div className="space-y-4">
                  {transaction.educationalContent.map((content, index) => (
                    <div key={index} className="p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-2xl">
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        {content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Professional Footer */}
      <footer className="mt-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Features */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Real-time transaction monitoring</li>
                <li>• MEV detection & analysis</li>
                <li>• Educational content & explanations</li>
                <li>• Balance change tracking</li>
              </ul>
            </div>
            
            {/* Technology */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Technology</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Built with Next.js & TypeScript</li>
                <li>• Ethereum Web3.js integration</li>
                <li>• EVM transaction parsing</li>
                <li>• Smart contract analysis</li>
              </ul>
            </div>
            
            {/* Community */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Open source project</li>
                <li>• No registration required</li>
                <li>• Professional analysis tools</li>
                <li>• Built for Ethereum ecosystem</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Made with ❤️ for the Ethereum community
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                <span>© 2024 Ethereum Explorer</span>
                <span>•</span>
                <span>Grant Submission</span>
                <span>•</span>
                <span>Easy to Read Blockchain Explorer</span>
              </div>
              <a 
                href="https://twitter.com/Panagot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                title="Follow @Panagot on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
