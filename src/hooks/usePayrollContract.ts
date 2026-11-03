/**
 * usePayrollContract — all on-chain reads and writes for QpayPayroll contract
 * Contract: see QPAY_PAYROLL_ADDRESS in config.ts (QMS Testnet)
 */
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import {
  QPAY_PAYROLL_ADDRESS,
  QPAY_PAYROLL_ABI,
  ERC20_APPROVE_ABI,
  PAY_TOKEN,
  PAY_STATUS,
  PAY_FREQ,
  getStablecoin,
} from '../config'

// ─── Canonical on-chain payroll entry shape ───────────────────────────────────
export interface OnChainPayroll {
  id:           bigint
  employer:     `0x${string}`
  employeeName: string
  employee:     `0x${string}`
  amount:       bigint       // in token's 6-decimal units
  token:        number       // 0 = USDT, 1 = USDC
  frequency:    number       // 0 = OneTime, 1 = Weekly, 2 = Monthly
  startDate:    bigint
  status:       number       // 0 = Pending, 1 = Paid, 2 = Cancelled
  createdAt:    bigint
  paidAt:       bigint
  txRef:        `0x${string}`
  // Derived helpers
  tokenSymbol:  'USDT' | 'USDC'
  amountFormatted: string
  statusLabel:  'Pending' | 'Paid' | 'Cancelled'
  frequencyLabel: 'One-time' | 'Weekly' | 'Monthly'
}

// Viem decodes named-component tuples as objects ({ id, employer, ... }),
// but older code expected positional arrays. Accept both shapes here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichEntry(raw: any): OnChainPayroll {
  // Named-field object (viem default for named tuple components)
  const r = raw as {
    id: bigint; employer: `0x${string}`; employeeName: string
    employee: `0x${string}`; amount: bigint; token: number | bigint
    frequency: number | bigint; startDate: bigint; status: number | bigint
    createdAt: bigint; paidAt: bigint; txRef: `0x${string}`
  }

  const tokenNum  = Number(r.token)
  const statusNum = Number(r.status)
  const freqNum   = Number(r.frequency)
  const tokenSymbol: 'USDT' | 'USDC' = tokenNum === PAY_TOKEN.USDT ? 'USDT' : 'USDC'
  const statusLabels = ['Pending', 'Paid', 'Cancelled'] as const
  const freqLabels   = ['One-time', 'Weekly', 'Monthly'] as const

  return {
    id:              r.id            ?? 0n,
    employer:        r.employer      ?? '0x0000000000000000000000000000000000000000',
    employeeName:    r.employeeName  ?? '',
    employee:        r.employee      ?? '0x0000000000000000000000000000000000000000',
    amount:          r.amount        ?? 0n,
    token:           tokenNum,
    frequency:       freqNum,
    startDate:       r.startDate     ?? 0n,
    status:          statusNum,
    createdAt:       r.createdAt     ?? 0n,
    paidAt:          r.paidAt        ?? 0n,
    txRef:           r.txRef         ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
    tokenSymbol,
    amountFormatted: formatUnits(r.amount ?? 0n, 6),
    statusLabel:     statusLabels[statusNum]  ?? 'Pending',
    frequencyLabel:  freqLabels[freqNum]      ?? 'One-time',
  }
}

// ─── Hook: read all payrolls for the connected wallet ────────────────────────
export function useEmployerPayrolls() {
  const { address } = useAccount()

  // Step 1: get list of IDs
  const { data: ids, isLoading: loadingIds, refetch: refetchIds } = useReadContract({
    address: QPAY_PAYROLL_ADDRESS,
    abi:     QPAY_PAYROLL_ABI,
    functionName: 'getEmployerPayrolls',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address },
  })

  // Step 2: batch-read full entries
  const { data: batchRaw, isLoading: loadingBatch, refetch: refetchBatch } = useReadContract({
    address: QPAY_PAYROLL_ADDRESS,
    abi:     QPAY_PAYROLL_ABI,
    functionName: 'getPayrollBatch',
    args:    ids && ids.length > 0 ? [ids] : undefined,
    query:   { enabled: !!(ids && ids.length > 0) },
  })

  const payrolls: OnChainPayroll[] = (batchRaw ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (raw: any) => enrichEntry(raw)
  )

  const isLoading = loadingIds || loadingBatch
  const pending   = payrolls.filter((p) => p.status === PAY_STATUS.Pending)
  const paid      = payrolls.filter((p) => p.status === PAY_STATUS.Paid)
  const cancelled = payrolls.filter((p) => p.status === PAY_STATUS.Cancelled)

  async function refetch() {
    await refetchIds()
    await refetchBatch()
  }

  return { payrolls, pending, paid, cancelled, isLoading, refetch }
}

// ─── Hook: create a new payroll entry ────────────────────────────────────────
export function useCreatePayroll() {
  const { writeContractAsync, isPending } = useWriteContract()

  async function createPayroll(params: {
    employeeName: string
    employee:     `0x${string}`
    amountHuman:  string          // e.g. "1500.00"
    tokenSymbol:  'USDT' | 'USDC'
    startDate:    Date
  }) {
    const amount    = parseUnits(params.amountHuman, 6)
    const tokenEnum = params.tokenSymbol === 'USDT' ? PAY_TOKEN.USDT : PAY_TOKEN.USDC
    const freqEnum  = PAY_FREQ.OneTime  // always OneTime — frequency removed from UI
    const startTs   = BigInt(Math.floor(params.startDate.getTime() / 1000))

    const hash = await writeContractAsync({
      address:      QPAY_PAYROLL_ADDRESS,
      abi:          QPAY_PAYROLL_ABI,
      functionName: 'createPayroll',
      args:         [params.employeeName, params.employee, amount, tokenEnum, freqEnum, startTs],
    })
    return hash
  }

  return { createPayroll, isPending }
}

// ─── Hook: pay an employee (requires prior ERC-20 approval of the contract) ──
export function usePayEmployee() {
  const { address } = useAccount()
  const { writeContractAsync, isPending } = useWriteContract()

  // Read allowance for a given payroll
  function useAllowance(payroll: OnChainPayroll | null) {
    const tokenAddr = payroll ? getStablecoin(payroll.tokenSymbol).address : undefined
    return useReadContract({
      address:      tokenAddr,
      abi:          ERC20_APPROVE_ABI,
      functionName: 'allowance',
      args:         address && tokenAddr ? [address, QPAY_PAYROLL_ADDRESS] : undefined,
      query:        { enabled: !!(address && tokenAddr) },
    })
  }

  async function approveToken(payroll: OnChainPayroll) {
    const tokenAddr = getStablecoin(payroll.tokenSymbol).address
    const hash = await writeContractAsync({
      address:      tokenAddr,
      abi:          ERC20_APPROVE_ABI,
      functionName: 'approve',
      args:         [QPAY_PAYROLL_ADDRESS, payroll.amount],
    })
    return hash
  }

  async function payEmployee(payrollId: bigint) {
    const hash = await writeContractAsync({
      address:      QPAY_PAYROLL_ADDRESS,
      abi:          QPAY_PAYROLL_ABI,
      functionName: 'payEmployee',
      args:         [payrollId],
    })
    return hash
  }

  return { approveToken, payEmployee, useAllowance, isPending }
}

// ─── Hook: cancel a payroll ───────────────────────────────────────────────────
export function useCancelPayroll() {
  const { writeContractAsync, isPending } = useWriteContract()

  async function cancelPayroll(payrollId: bigint) {
    const hash = await writeContractAsync({
      address:      QPAY_PAYROLL_ADDRESS,
      abi:          QPAY_PAYROLL_ABI,
      functionName: 'cancelPayroll',
      args:         [payrollId],
    })
    return hash
  }

  return { cancelPayroll, isPending }
}

// ─── Hook: wait for a payroll tx ─────────────────────────────────────────────
export function useWaitForPayrollTx(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({ hash })
}

// ─── Hook: save the payment tx hash inside the contract ──────────────────────
// A contract cannot know its own tx hash, so after the pay tx confirms the
// employer's wallet calls recordPaymentTx(ids, hash). Stored in PayrollEntry.txRef
// (write-once), so history needs no log scanning and works on any device.
export function useRecordPaymentTx() {
  const { writeContractAsync, isPending } = useWriteContract()

  async function recordPaymentTx(payrollIds: bigint[], payTxHash: `0x${string}`) {
    const hash = await writeContractAsync({
      address:      QPAY_PAYROLL_ADDRESS,
      abi:          QPAY_PAYROLL_ABI,
      functionName: 'recordPaymentTx',
      args:         [payrollIds, payTxHash],
    })
    return hash
  }

  return { recordPaymentTx, isPending }
}

// ─── Hook: batch create payrolls ─────────────────────────────────────────────
export function useBatchCreatePayroll() {
  const { writeContractAsync, isPending } = useWriteContract()

  async function batchCreatePayroll(entries: Array<{
    employeeName: string
    employee:     `0x${string}`
    amountHuman:  string
    tokenSymbol:  'USDT' | 'USDC'
    startDate:    Date
  }>) {
    const employeeNames = entries.map(e => e.employeeName)
    const employees     = entries.map(e => e.employee)
    const amounts       = entries.map(e => parseUnits(e.amountHuman, 6))
    const tokens        = entries.map(e => e.tokenSymbol === 'USDT' ? PAY_TOKEN.USDT : PAY_TOKEN.USDC)
    const frequencies   = entries.map(() => PAY_FREQ.OneTime)
    const startDates    = entries.map(e => BigInt(Math.floor(e.startDate.getTime() / 1000)))

    const hash = await writeContractAsync({
      address:      QPAY_PAYROLL_ADDRESS,
      abi:          QPAY_PAYROLL_ABI,
      functionName: 'batchCreatePayroll',
      args:         [employeeNames, employees, amounts, tokens, frequencies, startDates],
    })
    return hash
  }

  return { batchCreatePayroll, isPending }
}

// ─── Hook: batch pay employees ────────────────────────────────────────────────
export function useBatchPayEmployees() {
  const { writeContractAsync, isPending } = useWriteContract()

  async function batchPayEmployees(payrollIds: bigint[]) {
    const hash = await writeContractAsync({
      address:      QPAY_PAYROLL_ADDRESS,
      abi:          QPAY_PAYROLL_ABI,
      functionName: 'batchPayEmployees',
      args:         [payrollIds],
    })
    return hash
  }

  return { batchPayEmployees, isPending }
}

// Re-export enums for convenience
export { PAY_TOKEN, PAY_STATUS, PAY_FREQ }
// Re-export useReadContracts for multicall patterns in pages
export { useReadContracts }
