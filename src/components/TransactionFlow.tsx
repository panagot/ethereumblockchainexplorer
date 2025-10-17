'use client';

import { useState } from 'react';
import { Users, Zap, Coins, Shield, Clock } from 'lucide-react';
import type { EthereumTransactionExplanation } from '@/types/transaction';

interface TransactionFlowProps {
  transaction: EthereumTransactionExplanation;
}

export default function TransactionFlow({ transaction }: TransactionFlowProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'initiation',
      title: 'Transaction Initiation',
      description: 'User initiates transaction with wallet signature',
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-600',
      details: `From: ${transaction.from.slice(0, 8)}...${transaction.from.slice(-8)}`
    },
    {
      id: 'validation',
      title: 'Network Validation',
      description: 'Ethereum network validates transaction and checks balance',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-600',
      details: 'Balance and nonce validation, signature verification'
    },
    {
      id: 'mempool',
      title: 'Mempool Entry',
      description: 'Transaction enters mempool and waits for inclusion',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600',
      details: `Gas price: ${(Number(transaction.gasPrice) / 1e9).toFixed(2)} Gwei`
    },
    {
      id: 'execution',
      title: 'Block Execution',
      description: 'Validator includes transaction in block and executes',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-orange-500 to-red-600',
      details: `Block ${transaction.blockNumber} • ${transaction.functionCalls.length} function calls`
    },
    {
      id: 'finalization',
      title: 'Finalization',
      description: 'Transaction is finalized and state changes are applied',
      icon: <Coins className="w-5 h-5" />,
      color: 'from-teal-500 to-cyan-600',
      details: `Gas used: ${transaction.gasUsed.toString()} • Status: ${transaction.success ? 'Success' : 'Failed'}`
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-200/50 dark:border-slate-700/50">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm">
          🔄
        </div>
        Transaction Flow
      </h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-slate-200 dark:bg-slate-600 z-0"></div>
            )}
            
            <div 
              className={`relative z-10 p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                activeStep === index 
                  ? 'bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-700' 
                  : 'bg-slate-50/80 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => setActiveStep(index)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                  {step.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Step {index + 1}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {step.description}
                  </p>
                  
                  {activeStep === index && (
                    <div className="mt-3 p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {step.details}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    activeStep === index ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Flow Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-700 dark:to-indigo-900/20 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚡</span>
          <span className="font-semibold text-slate-900 dark:text-white">Ethereum Transaction Processing</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ethereum uses proof-of-stake consensus with 12-second block times. Transactions are processed 
          sequentially within blocks, with gas fees determining priority. The network supports smart contracts 
          for complex DeFi operations and dApp interactions.
        </p>
      </div>
      
      {/* Performance Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Block Time</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            ~12 seconds
          </div>
        </div>
        <div className="p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Gas Efficiency</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {transaction.gasFee < 0.01 ? 'Excellent' : transaction.gasFee < 0.05 ? 'Good' : 'Fair'}
          </div>
        </div>
      </div>
    </div>
  );
}
