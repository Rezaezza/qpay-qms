/**
 * useSwapHistory — reads swap history directly from QpaySwap contract.
 * No eth_getLogs scanning. No localStorage.
 * Data is permanent on-chain, readable from any device/browser.
 */
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { useState } from 'react'
import { QPAY_SWAP_ADDRESS, QPAY_SWAP_ABI, STABLECOINS, WQMS_ADDRESS, QMS_CHAIN_ID } from '../config'

export interface OnChainSwap {
  txHash:      string
  fromSymbol:  string
  toSymbol:    string
  fromAmount:  string
  toAmount:    string
  timestamp:   number
  blockNumber: bigint
}

function addrToSymbol(addr: string): string {
  const a = addr.toLowerCase()
  if (a === '0x0000000000000000000000000000000000000000') return 'QMS'
  const stable = STABLECOINS.find(t => t.address.toLowerCase() === a)
  if (stable) return stable.symbol
  if (a === WQMS_ADDRESS.toLowerCase()) return 'QMS'
  return addr.slice(0, 6)
}

function addrToDecimals(addr: string): number {
  const a = addr.toLowerCase()
  if (a === '0x0000000000000000000000000000000000000000') return 18
  const stable = STABLECOINS.find(t => t.address.toLowerCase() === a)
  if (stable) return stable.decimals
  if (a === WQMS_ADDRESS.toLowerCase()) return 18
  return 18
}

// ─── Read hook ───────────────────────────────────────────────────────────────
export function useSwapHistory(address: `0x${string}` | undefined) {
  const { data: raw, isLoading, refetch } = useReadContract({
    address:      QPAY_SWAP_ADDRESS,
    abi:          QPAY_SWAP_ABI,
    functionName: 'getSwapHistory',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address, staleTime: 30_000 },
    chainId:      QMS_CHAIN_ID,
  })

  interface RawSwapRecord {
    txHash:      `0x${string}`
    tokenIn:     `0x${string}`
    tokenOut:    `0x${string}`
    amountIn:    bigint
    amountOut:   bigint
    timestamp:   bigint
    blockNumber: bigint
  }

  const data: OnChainSwap[] = ((raw as RawSwapRecord[]) ?? []).map((r) => ({
    txHash:      r.txHash,
    fromSymbol:  addrToSymbol(r.tokenIn),
    toSymbol:    addrToSymbol(r.tokenOut),
    fromAmount:  formatUnits(r.amountIn,  addrToDecimals(r.tokenIn)),
    toAmount:    formatUnits(r.amountOut, addrToDecimals(r.tokenOut)),
    timestamp:   Number(r.timestamp),
    blockNumber: r.blockNumber,
  }))

  return { data, isLoading, refetch }
}

// ─── Write hook — record a swap after confirmation ───────────────────────────
export function useRecordSwap() {
  const { writeContractAsync, isPending } = useWriteContract()
  const [recordHash, setRecordHash] = useState<`0x${string}` | undefined>()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: recordHash,
  })

  async function recordSwap(params: {
    wallet:     `0x${string}`
    swapTxHash: string          // hex string from wagmi receipt
    tokenIn:    `0x${string}`   // address(0) for native QMS
    tokenOut:   `0x${string}`
    amountIn:   bigint
    amountOut:  bigint
  }) {
    // Convert swapTxHash string to bytes32
    const txHashBytes = params.swapTxHash as `0x${string}`

    const hash = await writeContractAsync({
      address:      QPAY_SWAP_ADDRESS,
      abi:          QPAY_SWAP_ABI,
      functionName: 'recordSwap',
      args:         [
        params.wallet,
        txHashBytes,
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.amountOut,
      ],
    })
    setRecordHash(hash)
    return hash
  }

  return { recordSwap, isPending, isConfirming, isSuccess, recordHash }
}
