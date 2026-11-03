/**
 * wagmi configuration — Qpay on QMS Testnet
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { defineChain } from 'viem'

// QMS Testnet chain definition
export const qmsTestnet = defineChain({
  id: 19480,
  name: 'QMS Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'QMS',
    symbol: 'QMS',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.qms.finance'],
    },
  },
  blockExplorers: {
    default: {
      name: 'QMS Scan',
      url: 'https://testnet.qmsscan.io',
    },
  },
  testnet: true,
})

export const QMS_CHAIN_ID = 19480

// ─── Stablecoins on QMS Testnet ─────────────────────────────────────────────
export interface StablecoinToken {
  symbol: 'USDT' | 'USDC'
  name: string
  address: `0x${string}`
  decimals: 6
  color: string
  bgColor: string
}

export const STABLECOINS: StablecoinToken[] = [
  {
    symbol:   'USDT',
    name:     'Tether USD',
    address:  '0x5D1386fC130143F92511bC2D18124D3E414ed429',
    decimals: 6,
    color:    '#26a17b',
    bgColor:  'rgba(38,161,123,0.12)',
  },
  {
    symbol:   'USDC',
    name:     'USD Coin',
    address:  '0xDd4D61DF875cc613E1372c78827a5F4C2741bf11',
    decimals: 6,
    color:    '#2775ca',
    bgColor:  'rgba(39,117,202,0.12)',
  },
]

// Legacy token addresses (pre-v4). Kept only so old swap history still resolves to a symbol.
export const LEGACY_STABLECOIN_SYMBOLS: Record<string, 'USDT' | 'USDC'> = {
  '0x72577544f4134a25e7f09d0b5ff0ca05a1249ebf': 'USDT',
  '0xdff68e53a0a8275212927c12017f5ab5f1842a04': 'USDC',
}

export function getStablecoin(symbol: 'USDT' | 'USDC'): StablecoinToken {
  return STABLECOINS.find((t) => t.symbol === symbol)!
}

// ─── QWAP DEX on QMS Testnet ────────────────────────────────────────────────
// Router: Uniswap V2-compatible (swapExactTokensForTokens, swapExactETHForTokens, etc.)
export const QWAP_ROUTER = '0x93AFF45f28e5DF1b55f5AEFEfB807De843b12619' as const

// All swappable tokens on QMS Testnet (via QWAP)
export interface SwapToken {
  symbol:   string
  name:     string
  address:  `0x${string}` | 'NATIVE'   // 'NATIVE' = QMS native gas
  decimals: number
  color:    string
  bg:       string
  abbr:     string
}

export const SWAP_TOKENS: SwapToken[] = [
  // Native QMS — wrap to WQMS before routing
  { symbol: 'QMS',  name: 'QMS',       address: 'NATIVE',                                      decimals: 18, color: '#0EA5E9', bg: '#0c1f33', abbr: 'QM' },
  // Stablecoins
  { symbol: 'USDT', name: 'Tether USD',address: '0x5D1386fC130143F92511bC2D18124D3E414ed429', decimals: 6,  color: '#26a17b', bg: '#0a2118', abbr: 'UT' },
  { symbol: 'USDC', name: 'USD Coin',  address: '0xDd4D61DF875cc613E1372c78827a5F4C2741bf11', decimals: 6,  color: '#2775ca', bg: '#0d1b2e', abbr: 'UC' },
]

// WQMS address used for routing native QMS swaps
export const WQMS_ADDRESS = '0x9AA510295aC664A3d5A3182a3eFe959DE2B12c34' as const

// Uniswap V2 Router ABI — only the functions Qpay swap needs
export const ROUTER_ABI = [
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path',     type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn',     type: 'uint256'   },
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn',     type: 'uint256'   },
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const

// ERC-20 approve ABI (needed before swapExactTokensForTokens)
export const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Minimal ERC-20 ABI — only what payroll needs
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

// ─── QpayPayroll Contract ────────────────────────────────────────────────────
// v2: startDate enforcement via block.timestamp check (redeployed 2026-10-14)
// v3 — batchCreatePayroll + batchPayEmployees
// v5 — recordPaymentTx stores the payment tx hash on-chain (PayrollEntry.txRef)
export const QPAY_PAYROLL_ADDRESS = '0x20aD2D6764d45c5A79DDBaB70aF11C2d86FbA6dB' as const

// Enum values (must match Solidity enum order)
export const PAY_TOKEN  = { USDT: 0, USDC: 1 } as const
export const PAY_FREQ   = { OneTime: 0, Weekly: 1, Monthly: 2 } as const
export const PAY_STATUS = { Pending: 0, Paid: 1, Cancelled: 2 } as const

export type PayTokenEnum  = typeof PAY_TOKEN[keyof typeof PAY_TOKEN]
export type PayFreqEnum   = typeof PAY_FREQ[keyof typeof PAY_FREQ]
export type PayStatusEnum = typeof PAY_STATUS[keyof typeof PAY_STATUS]

export const QPAY_PAYROLL_ABI = [
  {
    type: 'function', name: 'createPayroll', stateMutability: 'nonpayable',
    inputs: [
      { name: 'employeeName', type: 'string'  },
      { name: 'employee',     type: 'address' },
      { name: 'amount',       type: 'uint256' },
      { name: 'token',        type: 'uint8'   },
      { name: 'frequency',    type: 'uint8'   },
      { name: 'startDate',    type: 'uint256' },
    ],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  {
    type: 'function', name: 'payEmployee', stateMutability: 'nonpayable',
    inputs:  [{ name: 'payrollId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'cancelPayroll', stateMutability: 'nonpayable',
    inputs:  [{ name: 'payrollId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'getEmployerPayrolls', stateMutability: 'view',
    inputs:  [{ name: 'employer', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'getPayroll', stateMutability: 'view',
    inputs:  [{ name: 'id', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'id',           type: 'uint256'  },
        { name: 'employer',     type: 'address'  },
        { name: 'employeeName', type: 'string'   },
        { name: 'employee',     type: 'address'  },
        { name: 'amount',       type: 'uint256'  },
        { name: 'token',        type: 'uint8'    },
        { name: 'frequency',    type: 'uint8'    },
        { name: 'startDate',    type: 'uint256'  },
        { name: 'status',       type: 'uint8'    },
        { name: 'createdAt',    type: 'uint256'  },
        { name: 'paidAt',       type: 'uint256'  },
        { name: 'txRef',        type: 'bytes32'  },
      ],
    }],
  },
  {
    type: 'function', name: 'getPayrollBatch', stateMutability: 'view',
    inputs:  [{ name: 'ids', type: 'uint256[]' }],
    outputs: [{
      name: '', type: 'tuple[]',
      components: [
        { name: 'id',           type: 'uint256'  },
        { name: 'employer',     type: 'address'  },
        { name: 'employeeName', type: 'string'   },
        { name: 'employee',     type: 'address'  },
        { name: 'amount',       type: 'uint256'  },
        { name: 'token',        type: 'uint8'    },
        { name: 'frequency',    type: 'uint8'    },
        { name: 'startDate',    type: 'uint256'  },
        { name: 'status',       type: 'uint8'    },
        { name: 'createdAt',    type: 'uint256'  },
        { name: 'paidAt',       type: 'uint256'  },
        { name: 'txRef',        type: 'bytes32'  },
      ],
    }],
  },
  // Events
  {
    type: 'event', name: 'PayrollCreated',
    inputs: [
      { name: 'payrollId', type: 'uint256', indexed: true },
      { name: 'employer',  type: 'address', indexed: true },
      { name: 'employee',  type: 'address', indexed: false },
      { name: 'amount',    type: 'uint256', indexed: false },
      { name: 'token',     type: 'uint8',   indexed: false },
    ],
  },
  {
    type: 'event', name: 'PayrollPaid',
    inputs: [
      { name: 'payrollId', type: 'uint256', indexed: true },
      { name: 'employer',  type: 'address', indexed: true },
      { name: 'employee',  type: 'address', indexed: false },
      { name: 'amount',    type: 'uint256', indexed: false },
      { name: 'token',     type: 'uint8',   indexed: false },
      { name: 'paidAt',    type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'PayrollCancelled',
    inputs: [
      { name: 'payrollId', type: 'uint256', indexed: true },
      { name: 'employer',  type: 'address', indexed: true },
    ],
  },
  // Custom errors (for viem to decode revert reasons)
  { type: 'error', name: 'InvalidEmployee',      inputs: [] },
  { type: 'error', name: 'InvalidAmount',        inputs: [] },
  { type: 'error', name: 'TokenTransferFailed',  inputs: [] },
  { type: 'error', name: 'InvalidToken',         inputs: [] },
  { type: 'error', name: 'ZeroTokenAddress',     inputs: [] },
  {
    type: 'error', name: 'PayrollNotFound',
    inputs: [{ name: 'payrollId', type: 'uint256' }],
  },
  {
    type: 'error', name: 'NotPayrollEmployer',
    inputs: [{ name: 'payrollId', type: 'uint256' }, { name: 'caller', type: 'address' }],
  },
  {
    type: 'error', name: 'PayrollNotPending',
    inputs: [{ name: 'payrollId', type: 'uint256' }, { name: 'status', type: 'uint8' }],
  },
  {
    type: 'error', name: 'PayrollNotDueYet',
    inputs: [
      { name: 'payrollId',   type: 'uint256' },
      { name: 'startDate',   type: 'uint256' },
      { name: 'currentTime', type: 'uint256' },
    ],
  },
  // Batch functions (v3)
  {
    type: 'function', name: 'batchCreatePayroll', stateMutability: 'nonpayable',
    inputs: [
      { name: 'employeeNames', type: 'string[]'   },
      { name: 'employees',     type: 'address[]'  },
      { name: 'amounts',       type: 'uint256[]'  },
      { name: 'tokens',        type: 'uint8[]'    },
      { name: 'frequencies',   type: 'uint8[]'    },
      { name: 'startDates',    type: 'uint256[]'  },
    ],
    outputs: [{ name: 'ids', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'batchPayEmployees', stateMutability: 'nonpayable',
    inputs:  [{ name: 'payrollIds', type: 'uint256[]' }],
    outputs: [],
  },
  // Batch errors (v3)
  { type: 'error', name: 'BatchSizeMismatch',  inputs: [] },
  { type: 'error', name: 'BatchTooLarge',      inputs: [] },
  { type: 'error', name: 'EmptyBatch',         inputs: [] },
  {
    type: 'error', name: 'BatchPaymentFailed',
    inputs: [{ name: 'payrollId', type: 'uint256' }],
  },
  // Payment receipt registry (v5): payment tx hash stored in PayrollEntry.txRef
  {
    type: 'function', name: 'recordPaymentTx', stateMutability: 'nonpayable',
    inputs: [
      { name: 'payrollIds', type: 'uint256[]' },
      { name: 'txHash',     type: 'bytes32'   },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'getPaymentTxHashes', stateMutability: 'view',
    inputs:  [{ name: 'ids', type: 'uint256[]' }],
    outputs: [{ name: 'hashes', type: 'bytes32[]' }],
  },
  {
    type: 'event', name: 'PaymentTxRecorded',
    inputs: [
      { name: 'id',       type: 'uint256', indexed: true },
      { name: 'employer', type: 'address', indexed: true },
      { name: 'txHash',   type: 'bytes32', indexed: false },
    ],
  },
  { type: 'error', name: 'InvalidTxHash',   inputs: [] },
  { type: 'error', name: 'TokenNotContract', inputs: [] },
  {
    type: 'error', name: 'PaymentTxAlreadyRecorded',
    inputs: [{ name: 'payrollId', type: 'uint256' }],
  },
  {
    type: 'error', name: 'PayrollNotPaid',
    inputs: [{ name: 'payrollId', type: 'uint256' }, { name: 'status', type: 'uint8' }],
  },
  // ERC20 allowance check for approve-before-pay flow
  {
    type: 'function', name: 'USDT_TOKEN', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'USDC_TOKEN', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }],
  },
] as const

// ─── QpaySwap Contract ───────────────────────────────────────────────────────
// On-chain swap history registry — no localStorage, no eth_getLogs scanning.
// recordSwap() called by frontend after swap confirmed; getSwapHistory() reads back.
export const QPAY_SWAP_ADDRESS = '0xeDDf43468577A03B89496A8869277Dd62791cf43' as const

export const QPAY_SWAP_ABI = [
  {
    type: 'function', name: 'recordSwap', stateMutability: 'nonpayable',
    inputs: [
      { name: 'wallet',    type: 'address' },
      { name: 'txHash',    type: 'bytes32' },
      { name: 'tokenIn',   type: 'address' },
      { name: 'tokenOut',  type: 'address' },
      { name: 'amountIn',  type: 'uint256' },
      { name: 'amountOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'getSwapHistory', stateMutability: 'view',
    inputs:  [{ name: 'wallet', type: 'address' }],
    outputs: [{
      name: '', type: 'tuple[]',
      components: [
        { name: 'txHash',      type: 'bytes32'  },
        { name: 'tokenIn',     type: 'address'  },
        { name: 'tokenOut',    type: 'address'  },
        { name: 'amountIn',    type: 'uint256'  },
        { name: 'amountOut',   type: 'uint256'  },
        { name: 'timestamp',   type: 'uint256'  },
        { name: 'blockNumber', type: 'uint256'  },
      ],
    }],
  },
  {
    type: 'function', name: 'getSwapCount', stateMutability: 'view',
    inputs:  [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event', name: 'SwapRecorded',
    inputs: [
      { name: 'wallet',    type: 'address', indexed: true  },
      { name: 'txHash',    type: 'bytes32', indexed: false },
      { name: 'tokenIn',   type: 'address', indexed: false },
      { name: 'tokenOut',  type: 'address', indexed: false },
      { name: 'amountIn',  type: 'uint256', indexed: false },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
  { type: 'error', name: 'InvalidAmount',        inputs: [] },
  { type: 'error', name: 'SameToken',            inputs: [] },
  { type: 'error', name: 'UnauthorizedRecorder', inputs: [] },
] as const

export const config = createConfig({
  chains: [qmsTestnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Qpay' }),
  ],
  transports: {
    [qmsTestnet.id]: http('https://rpc.testnet.qms.finance'),
  },
})
