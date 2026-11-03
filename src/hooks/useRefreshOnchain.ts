/**
 * useRefreshOnchain — re-fetches every wagmi read (native balance, ERC-20 balances,
 * allowances, payroll lists, swap history) after a confirmed transaction, so the UI
 * never shows stale on-chain data.
 */
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const WAGMI_READ_KEYS = ['balance', 'readContract', 'readContracts']

export function useRefreshOnchain() {
  const queryClient = useQueryClient()
  return useCallback(
    () =>
      queryClient.invalidateQueries({
        predicate: q => WAGMI_READ_KEYS.includes(String(q.queryKey[0])),
      }),
    [queryClient],
  )
}
