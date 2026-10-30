/**
 * useTokenBalances — reads QMS (native) + USDT + USDC balances for a connected wallet.
 * Returns formatted strings and raw BigInts for each token.
 */
import { useBalance, useReadContracts } from 'wagmi'
import { formatUnits, formatEther } from 'viem'
import { QMS_CHAIN_ID, STABLECOINS, ERC20_ABI } from '../config'
import { formatAmount } from '../lib/utils'

export interface TokenBalance {
  symbol:    string
  name:      string
  color:     string
  bg:        string
  formatted: string        // display string e.g. "27.89"
  raw:       bigint
  decimals:  number
  isNative:  boolean
}

export function useTokenBalances(address: `0x${string}` | undefined) {
  // ── Native QMS balance ──────────────────────────────────────────────────────
  const { data: nativeBal, isLoading: loadingNative } = useBalance({
    address,
    chainId: QMS_CHAIN_ID,
    query: { enabled: !!address },
  })

  // ── ERC-20 balances (USDT + USDC) via multicall ────────────────────────────
  const contracts = STABLECOINS.map(tok => ({
    address: tok.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: address ? [address] : undefined,
    chainId: QMS_CHAIN_ID,
  }))

  const { data: erc20Results, isLoading: loadingErc20 } = useReadContracts({
    contracts,
    query: { enabled: !!address },
  })

  const isLoading = loadingNative || loadingErc20

  // ── Assemble result array ──────────────────────────────────────────────────
  const balances: TokenBalance[] = [
    // QMS (native)
    {
      symbol:    'QMS',
      name:      'QMS',
      color:     '#0EA5E9',
      bg:        'rgba(14,165,233,0.12)',
      raw:       nativeBal?.value ?? 0n,
      formatted: formatAmount(parseFloat(formatEther(nativeBal?.value ?? 0n)), 4),
      decimals:  18,
      isNative:  true,
    },
    // USDT
    {
      symbol:    'USDT',
      name:      'Tether USD',
      color:     '#26a17b',
      bg:        'rgba(38,161,123,0.10)',
      raw:       (erc20Results?.[0]?.result) ?? 0n,
      formatted: formatAmount(parseFloat(formatUnits((erc20Results?.[0]?.result) ?? 0n, 6)), 2),
      decimals:  6,
      isNative:  false,
    },
    // USDC
    {
      symbol:    'USDC',
      name:      'USD Coin',
      color:     '#2775ca',
      bg:        'rgba(39,117,202,0.10)',
      raw:       (erc20Results?.[1]?.result) ?? 0n,
      formatted: formatAmount(parseFloat(formatUnits((erc20Results?.[1]?.result) ?? 0n, 6)), 2),
      decimals:  6,
      isNative:  false,
    },
  ]

  return { balances, isLoading }
}
