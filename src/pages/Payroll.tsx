import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { Users, Plus, CheckCircle, XCircle, Clock, RefreshCw, ExternalLink, AlertCircle, Wallet, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Q, glassStyle, glass2Style } from '../theme'
import { TokenIcon } from '../components/TokenIcon'
import {
  useEmployerPayrolls,
  usePayEmployee,
  useCancelPayroll,
  useBatchPayEmployees,
  useRecordPaymentTx,
  PAY_STATUS,
  type OnChainPayroll,
} from '../hooks/usePayrollContract'
import { getStablecoin, QPAY_PAYROLL_ADDRESS, ERC20_APPROVE_ABI } from '../config'
import { useReadContract } from 'wagmi'
import { parseOnchainError } from '../lib/utils'
import { maxUint256 } from 'viem'
import { useRefreshOnchain } from '../hooks/useRefreshOnchain'


const EXPLORER = 'https://testnet.qmsscan.io'
function explorerAddr(addr: string) { return `${EXPLORER}/address/${addr}` }
function timeAgo(ts: bigint) {
  const diff = Math.floor(Date.now()/1000) - Number(ts)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

function getDueStatus(startDateTs: bigint): { isDue: boolean; label: string } {
  const diffSec = Number(startDateTs) - Math.floor(Date.now() / 1000)
  if (diffSec <= 0) return { isDue: true, label: 'Due' }
  const days = Math.ceil(diffSec / 86400)
  return { isDue: false, label: days === 1 ? 'Due tomorrow' : `Available in ${days}d` }
}

// ─── PayRow ──────────────────────────────────────────────────────────────────
function PayRow({ entry, onRefresh, batchMode = false }: { entry: OnChainPayroll; onRefresh: () => void; batchMode?: boolean }) {
  const { address } = useAccount()
  const [approveHash, setApproveHash] = useState<`0x${string}`|undefined>()
  const [payHash,     setPayHash]     = useState<`0x${string}`|undefined>()
  const [cancelHash,  setCancelHash]  = useState<`0x${string}`|undefined>()
  const [showCancel,  setShowCancel]  = useState(false)

  const { approveToken, payEmployee, isPending: isWritePending } = usePayEmployee()
  const { cancelPayroll } = useCancelPayroll()
  const { recordPaymentTx } = useRecordPaymentTx()
  const [recordHash, setRecordHash] = useState<`0x${string}`|undefined>()
  const [receiptRejected, setReceiptRejected] = useState(false)
  const stablecoin = getStablecoin(entry.tokenSymbol)

  const { data: allowance } = useReadContract({
    address:      stablecoin.address,
    abi:          ERC20_APPROVE_ABI,
    functionName: 'allowance',
    args:         address ? [address, QPAY_PAYROLL_ADDRESS] : undefined,
    query:        { enabled: !!address },
  })

  // Receipt hooks — capture both isLoading AND isSuccess/isError
  const {
    isLoading: approvePending,
    isSuccess: approveSuccess,
    isError:   approveError,
  } = useWaitForTransactionReceipt({ hash: approveHash })

  const {
    isLoading: payPending,
    isSuccess: paySuccess,
    isError:   payError,
  } = useWaitForTransactionReceipt({ hash: payHash })

  const {
    isLoading: cancelPending,
    isSuccess: cancelSuccess,
    isError:   cancelError,
  } = useWaitForTransactionReceipt({ hash: cancelHash })

  // Second transaction: saves the payment tx hash inside the contract
  const {
    isLoading: recordPending,
    isSuccess: recordSuccess,
    isError:   recordError,
  } = useWaitForTransactionReceipt({ hash: recordHash })
  const receiptPhase  = paySuccess && !recordSuccess
  const receiptFailed = receiptRejected || recordError

  async function saveReceipt() {
    if (!payHash) return
    const toastId = `pay-${String(entry.id)}`
    setReceiptRejected(false)
    setRecordHash(undefined)
    toast.loading('Payment confirmed. Confirm the 2nd transaction to save the receipt on-chain…', { id: toastId })
    try {
      const h = await recordPaymentTx([entry.id], payHash)
      setRecordHash(h)
      toast.loading('Saving receipt to the blockchain…', { id: toastId })
    } catch {
      setReceiptRejected(true)
      toast.error('Receipt not saved yet. Tap "Save receipt" to retry.', { id: toastId })
    }
  }

  // Side effects only — no setState here, just toast + refetch + onRefresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (approveSuccess) { onRefresh(); toast.success('Approved! Click Pay to complete.', { id: `approve-${String(entry.id)}` }) } }, [approveSuccess])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (approveError)   { toast.error('Approval failed', { id: `approve-${String(entry.id)}` }) } }, [approveError])
  // Pay confirmed -> immediately ask for the 2nd tx that stores the receipt in the contract
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (paySuccess && payHash) { void saveReceipt() } }, [paySuccess])
  // Receipt stored -> show the final toast with the tx hash, then refresh the list
  useEffect(() => {
    if (recordSuccess && payHash) {
      const explorerUrl = `https://testnet.qmsscan.io/tx/${payHash}`
      toast.success(
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Paid {parseFloat(entry.amountFormatted).toLocaleString()} {entry.tokenSymbol} to {entry.employeeName}!
          </div>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: '#6c5ce7', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {payHash.slice(0,10)}…{payHash.slice(-8)} ↗
          </a>
        </div>,
        { id: `pay-${String(entry.id)}`, duration: 8000 }
      )
      onRefresh()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordSuccess])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (recordError) { toast.error('Receipt not saved yet. Tap "Save receipt" to retry.', { id: `pay-${String(entry.id)}` }) } }, [recordError])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (payError)       { toast.error('Payment failed', { id: `pay-${String(entry.id)}` }) } }, [payError])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (cancelSuccess)  { toast.success('Payroll cancelled', { id: `cancel-${String(entry.id)}` }); onRefresh() } }, [cancelSuccess])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (cancelError)    { toast.error('Cancel failed', { id: `cancel-${String(entry.id)}` }) } }, [cancelError])

  const needsApproval = allowance !== undefined && allowance < entry.amount
  const isBusy   = isWritePending || approvePending || payPending || cancelPending || recordPending
  const due      = getDueStatus(entry.startDate ?? 0n)
  const tokenColor  = entry.tokenSymbol === 'USDT' ? '#26a17b' : '#2775ca'
  const statusColor = ({ Pending: Q.warn, Paid: Q.success, Cancelled: Q.danger } as Record<string, string>)[entry.statusLabel] ?? Q.muted

  async function handleApprove() {
    toast.loading('Sending approval…', { id: `approve-${String(entry.id)}` })
    try {
      const hash = await approveToken(entry)
      setApproveHash(hash)
      toast.loading('Waiting for approval confirmation…', { id: `approve-${String(entry.id)}` })
    } catch {
      toast.dismiss(`approve-${String(entry.id)}`)
      toast.error('Approval rejected')
    }
  }

  async function handlePay() {
    toast.loading('Sending payment…', { id: `pay-${String(entry.id)}` })
    try {
      const hash = await payEmployee(entry.id)
      setPayHash(hash)
      toast.loading('Waiting for payment confirmation…', { id: `pay-${String(entry.id)}` })
    } catch {
      toast.dismiss(`pay-${String(entry.id)}`)
      toast.error('Payment rejected')
    }
  }

  async function handleCancel() {
    setShowCancel(false)
    toast.loading('Sending cancellation…', { id: `cancel-${String(entry.id)}` })
    try {
      const hash = await cancelPayroll(entry.id)
      setCancelHash(hash)
      toast.loading('Waiting for cancellation confirmation…', { id: `cancel-${String(entry.id)}` })
    } catch {
      toast.dismiss(`cancel-${String(entry.id)}`)
      toast.error('Cancel rejected')
    }
  }

  return (
    <div style={{ ...glass2Style, borderRadius: 12, padding: '16px 20px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <TokenIcon symbol={entry.tokenSymbol} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: Q.ink, fontWeight: 700, fontSize: 15 }}>{entry.employeeName}</span>
            <span style={{ fontSize: 11, color: statusColor, background: statusColor+'22', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
              {entry.statusLabel}
            </span>
            {entry.status === PAY_STATUS.Pending && (
              <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 8px',
                color: due.isDue ? Q.success : Q.warn,
                background: due.isDue ? Q.success+'22' : Q.warn+'22' }}>
                {due.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <a href={explorerAddr(entry.employee)} target="_blank" rel="noopener noreferrer"
               style={{ color: Q.muted, fontSize: 12, textDecoration: 'none' }}>
              {entry.employee.slice(0,6)}…{entry.employee.slice(-4)}
            </a>
            <span style={{ color: Q.subtle, fontSize: 11 }}>· {timeAgo(entry.createdAt)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: tokenColor, fontWeight: 700, fontSize: 16 }}>
            {parseFloat(entry.amountFormatted).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ color: Q.muted, fontSize: 12 }}>{entry.tokenSymbol}</div>
        </div>
      </div>

      {entry.status === PAY_STATUS.Pending && receiptPhase && (
        <div style={{ borderTop: `1px solid ${Q.border}`, paddingTop: 12 }}>
          {receiptFailed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: Q.warn, fontSize: 12 }}>Payment confirmed. The receipt is not saved yet.</span>
              <button onClick={() => { void saveReceipt() }}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: Q.acc, color: '#fff', fontWeight: 700, fontSize: 13 }}>
                Save receipt
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={15} color={Q.acc} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span style={{ color: Q.ink2, fontSize: 12 }}>
                {recordHash
                  ? 'Saving receipt to the blockchain…'
                  : 'Payment confirmed. Confirm the 2nd transaction in your wallet to save the receipt…'}
              </span>
            </div>
          )}
        </div>
      )}

      {entry.status === PAY_STATUS.Pending && !receiptPhase && (
        <div style={{ borderTop: `1px solid ${Q.border}`, paddingTop: 12 }}>
          {batchMode && due.isDue ? (
            // Batch mode: hide individual pay buttons, show "included in Pay All" chip
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: Q.acc+'18', borderRadius: 8, padding: '6px 12px', flex: 1 }}>
                <Zap size={13} color={Q.acc} />
                <span style={{ color: Q.acc, fontSize: 12, fontWeight: 600 }}>
                  Included in Pay All — use the Pay All button above
                </span>
              </div>
              {!showCancel ? (
                <button onClick={() => setShowCancel(true)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${Q.border}`, cursor: 'pointer',
                    background: 'transparent', color: Q.muted, fontWeight: 600, fontSize: 12 }}>
                  Cancel
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: Q.warn, fontSize: 12 }}>Confirm cancel?</span>
                  <button onClick={() => { void handleCancel() }} disabled={isBusy}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: Q.danger+'33', color: Q.danger, fontWeight: 700, fontSize: 12 }}>
                    {isBusy ? '⏳' : 'Yes, cancel'}
                  </button>
                  <button onClick={() => setShowCancel(false)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${Q.border}`, cursor: 'pointer',
                      background: 'transparent', color: Q.muted, fontSize: 12 }}>
                    No
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Individual mode
            <div style={{ display: 'flex', gap: 8 }}>
              {!due.isDue ? (
                <button disabled style={{ flex: 1, padding: '8px 16px', borderRadius: 8, border: `1px solid ${Q.border}`,
                  cursor: 'not-allowed', background: Q.surf3, color: Q.subtle, fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🔒 {due.label}
                </button>
              ) : needsApproval ? (
                <button onClick={() => { void handleApprove() }} disabled={isBusy}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: isBusy?'not-allowed':'pointer',
                    background: isBusy ? Q.surf3 : Q.warn+'33', color: isBusy ? Q.muted : Q.warn, fontWeight: 600, fontSize: 13 }}>
                  {isBusy ? '⏳ Approving…' : `Approve ${entry.tokenSymbol}`}
                </button>
              ) : (
                <button onClick={() => { void handlePay() }} disabled={isBusy}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: isBusy?'not-allowed':'pointer',
                    background: isBusy ? Q.surf3 : Q.acc, color: isBusy ? Q.muted : '#fff', fontWeight: 700, fontSize: 13 }}>
                  {isBusy ? '⏳ Paying…' : `Pay ${entry.tokenSymbol}`}
                </button>
              )}
              {!showCancel ? (
                <button onClick={() => setShowCancel(true)} disabled={isBusy}
                  style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${Q.border}`, cursor: 'pointer',
                    background: 'transparent', color: Q.muted, fontWeight: 600, fontSize: 13 }}>
                  Cancel
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: Q.warn, fontSize: 12 }}>Confirm cancel?</span>
                  <button onClick={() => { void handleCancel() }} disabled={isBusy}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: Q.danger+'33', color: Q.danger, fontWeight: 700, fontSize: 12 }}>
                    {isBusy ? '⏳' : 'Yes, cancel'}
                  </button>
                  <button onClick={() => setShowCancel(false)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${Q.border}`, cursor: 'pointer',
                      background: 'transparent', color: Q.muted, fontSize: 12 }}>
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {entry.status === PAY_STATUS.Paid && entry.paidAt > 0n && (
        <div style={{ borderTop: `1px solid ${Q.border}`, paddingTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={14} color={Q.success} />
          <span style={{ color: Q.muted, fontSize: 12 }}>Paid {timeAgo(entry.paidAt)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Payroll page ────────────────────────────────────────────────────────
interface Props { onNavigate: (p: string) => void }

export default function Payroll({ onNavigate }: Props) {
  const { isConnected } = useAccount()
  const [tab, setTab] = useState<'active'|'all'>('active')
  const { payrolls, pending, paid, cancelled, isLoading } = useEmployerPayrolls()
  // Refreshes payroll list, allowances, balances and history in one go
  const refreshOnchain = useRefreshOnchain()
  const handleRefresh = useCallback(() => { void refreshOnchain() }, [refreshOnchain])
  const displayed = tab === 'active' ? pending : payrolls

  // Batch Pay All — multi-step: approve USDT → approve USDC → batchPayEmployees
  const { batchPayEmployees } = useBatchPayEmployees()
  const { recordPaymentTx: recordBatchReceipt } = useRecordPaymentTx()
  const { writeContractAsync } = useWriteContract()

  // step: idle | approving-usdt | approving-usdc | paying | done
  type BatchStep = 'idle' | 'approving-usdt' | 'approving-usdc' | 'paying' | 'recording' | 'receipt-failed' | 'done'
  const [batchStep, setBatchStep] = useState<BatchStep>('idle')
  const [batchApproveHash, setBatchApproveHash] = useState<`0x${string}`|undefined>()
  const [batchPayHash,     setBatchPayHash]     = useState<`0x${string}`|undefined>()
  const [batchRecordHash,  setBatchRecordHash]  = useState<`0x${string}`|undefined>()
  const batchIdsRef = useRef<bigint[]>([])

  const { isSuccess: batchApproveOk, isError: batchApproveErr } =
    useWaitForTransactionReceipt({ hash: batchApproveHash })
  const { isSuccess: batchPayOk, isError: batchPayErr } =
    useWaitForTransactionReceipt({ hash: batchPayHash })
  // 2nd transaction: saves the batch payment tx hash inside the contract
  const { isSuccess: batchRecordOk, isError: batchRecordErr } =
    useWaitForTransactionReceipt({ hash: batchRecordHash })

  // Due pending payrolls (start date passed)
  const duePending = pending.filter(p => Number(p.startDate) <= Math.floor(Date.now() / 1000))

  const isBatchBusy = batchStep !== 'idle' && batchStep !== 'done' && batchStep !== 'receipt-failed'

  // State machine — advance on receipt confirmation
  useEffect(() => {
    if (!batchApproveOk) return
    if (batchStep === 'approving-usdt') {
      // Check if USDC approval also needed
      const needsUsdc = duePending.some(p => p.tokenSymbol === 'USDC')
      if (needsUsdc) {
        setBatchStep('approving-usdc')
        toast.loading('Step 2/3: Approving USDC…', { id: 'batch-pay' })
        const usdcToken = getStablecoin('USDC')
        void writeContractAsync({
          address: usdcToken.address,
          abi: ERC20_APPROVE_ABI,
          functionName: 'approve',
          args: [QPAY_PAYROLL_ADDRESS, maxUint256],
        }).then(h => setBatchApproveHash(h)).catch(e => {
          toast.error(parseOnchainError(e), { id: 'batch-pay' })
          setBatchStep('idle')
        })
      } else {
        // No USDC needed — go straight to pay
        setBatchStep('paying')
        toast.loading('Step 2/2: Sending batch payment…', { id: 'batch-pay' })
        void batchPayEmployees(batchIdsRef.current).then(h => setBatchPayHash(h)).catch(e => {
          toast.error(parseOnchainError(e), { id: 'batch-pay' })
          setBatchStep('idle')
        })
      }
    } else if (batchStep === 'approving-usdc') {
      setBatchStep('paying')
      toast.loading('Step 3/3: Sending batch payment…', { id: 'batch-pay' })
      void batchPayEmployees(batchIdsRef.current).then(h => setBatchPayHash(h)).catch(e => {
        toast.error(parseOnchainError(e), { id: 'batch-pay' })
        setBatchStep('idle')
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchApproveOk])

  useEffect(() => {
    if (batchApproveErr) {
      toast.error('Approval failed', { id: 'batch-pay' })
      setBatchStep('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchApproveErr])

  async function saveBatchReceipt() {
    if (!batchPayHash) return
    setBatchStep('recording')
    setBatchRecordHash(undefined)
    toast.loading('Payments confirmed. Confirm the 2nd transaction to save the receipt on-chain…', { id: 'batch-pay' })
    try {
      const h = await recordBatchReceipt(batchIdsRef.current, batchPayHash)
      setBatchRecordHash(h)
      toast.loading('Saving receipt to the blockchain…', { id: 'batch-pay' })
    } catch {
      setBatchStep('receipt-failed')
      toast.error('Receipt not saved yet. Tap "Save receipt" to retry.', { id: 'batch-pay' })
    }
  }

  // Batch payment confirmed -> refresh statuses, then ask for the receipt transaction
  useEffect(() => {
    if (batchPayOk && batchPayHash) {
      handleRefresh()
      void saveBatchReceipt()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchPayOk])

  // Receipt stored -> final toast with the payment tx hash
  useEffect(() => {
    if (batchRecordOk && batchPayHash) {
      toast.success(
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>All {batchIdsRef.current.length} payments confirmed!</div>
          <a href={`https://testnet.qmsscan.io/tx/${batchPayHash}`} target="_blank" rel="noopener noreferrer"
            style={{ color: '#6c5ce7', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {batchPayHash.slice(0,10)}…{batchPayHash.slice(-8)} ↗
          </a>
        </div>,
        { id: 'batch-pay', duration: 8000 }
      )
      setBatchStep('done')
      setBatchPayHash(undefined)
      setBatchRecordHash(undefined)
      setBatchApproveHash(undefined)
      handleRefresh()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchRecordOk])

  useEffect(() => {
    if (batchRecordErr) {
      toast.error('Receipt not saved yet. Tap "Save receipt" to retry.', { id: 'batch-pay' })
      setBatchStep('receipt-failed')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchRecordErr])

  useEffect(() => {
    if (batchPayErr) {
      toast.error('Batch payment failed', { id: 'batch-pay' })
      setBatchStep('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchPayErr])

  const handleBatchPay = useCallback(async () => {
    if (duePending.length === 0) return
    batchIdsRef.current = duePending.map(p => p.id)
    const needsUsdt = duePending.some(p => p.tokenSymbol === 'USDT')
    const needsUsdc = duePending.some(p => p.tokenSymbol === 'USDC')
    const totalSteps = 1 + (needsUsdt ? 1 : 0) + (needsUsdc ? 1 : 0)
    try {
      if (needsUsdt) {
        setBatchStep('approving-usdt')
        toast.loading(`Step 1/${totalSteps}: Approving USDT…`, { id: 'batch-pay' })
        const usdtToken = getStablecoin('USDT')
        const h = await writeContractAsync({
          address: usdtToken.address,
          abi: ERC20_APPROVE_ABI,
          functionName: 'approve',
          args: [QPAY_PAYROLL_ADDRESS, maxUint256],
        })
        setBatchApproveHash(h)
      } else if (needsUsdc) {
        setBatchStep('approving-usdc')
        toast.loading(`Step 1/${totalSteps}: Approving USDC…`, { id: 'batch-pay' })
        const usdcToken = getStablecoin('USDC')
        const h = await writeContractAsync({
          address: usdcToken.address,
          abi: ERC20_APPROVE_ABI,
          functionName: 'approve',
          args: [QPAY_PAYROLL_ADDRESS, maxUint256],
        })
        setBatchApproveHash(h)
      } else {
        // Both already approved — go straight to pay
        setBatchStep('paying')
        toast.loading(`Sending batch payment…`, { id: 'batch-pay' })
        const h = await batchPayEmployees(batchIdsRef.current)
        setBatchPayHash(h)
      }
    } catch (err) {
      toast.error(parseOnchainError(err), { id: 'batch-pay' })
      setBatchStep('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duePending, batchPayEmployees, writeContractAsync])

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: Q.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ ...glassStyle, borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 420 }}>
          <Wallet size={48} color={Q.acc} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: Q.ink, fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Connect Your Wallet</h2>
          <p style={{ color: Q.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>Connect your wallet to manage payrolls on QMS Testnet.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: Q.bg, paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* Hero */}
        <div style={{ ...glassStyle, borderRadius: 20, padding: '28px 28px 24px', marginBottom: 20,
          background: 'linear-gradient(135deg, #0d1c35 0%, #0f2040 100%)', border: `1px solid ${Q.border2}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: Q.acc+'22', borderRadius: 10, padding: 8 }}><Users size={20} color={Q.acc} /></div>
                <span style={{ color: Q.acc, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payroll Management</span>
              </div>
              <h1 style={{ color: Q.ink, fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Pay your team in stablecoins</h1>
              <p style={{ color: Q.ink2, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 420 }}>
                Create payroll entries on-chain. Each entry is permanently stored on QMS Testnet —
                accessible from any device with the same wallet.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Non-custodial', 'On-chain records', 'USDT & USDC', 'Start date enforced'].map(f => (
                  <span key={f} style={{ background: Q.acc+'18', color: Q.acc2, borderRadius: 20, padding: '4px 12px',
                    fontSize: 12, fontWeight: 500, border: `1px solid ${Q.acc}33` }}>{f}</span>
                ))}
              </div>
            </div>
            <button onClick={() => onNavigate('payroll/create')}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: Q.acc, color: '#fff',
                border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              <Plus size={16} /> New Payroll
            </button>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${Q.border}`,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: Q.subtle, fontSize: 11 }}>Contract:</span>
            <a href={`${EXPLORER}/address/${QPAY_PAYROLL_ADDRESS}`} target="_blank" rel="noopener noreferrer"
              style={{ color: Q.acc, fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              {QPAY_PAYROLL_ADDRESS.slice(0,10)}…{QPAY_PAYROLL_ADDRESS.slice(-8)}<ExternalLink size={10} />
            </a>

          </div>
        </div>

        {/* Info */}
        <div style={{ ...glass2Style, borderRadius: 12, padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle size={16} color={Q.acc} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: Q.ink2, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: Q.ink }}>How it works:</strong> Use{' '}
            <strong style={{ color: Q.acc }}>Pay All</strong> to pay all due employees in one go —
            the app will guide you through approving each token, then sends a single batch transaction.
            Or approve and pay each employee individually. The Pay button is locked until the start date — enforced on-chain.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: Q.surf2, borderRadius: 10, padding: 4 }}>
            {([['active', `Active (${pending.length})`, Clock], ['all', `All (${payrolls.length})`, Users]] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  background: tab === key ? Q.acc : 'transparent', color: tab === key ? '#fff' : Q.muted }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {duePending.length >= 1 && (
              <button onClick={() => { void handleBatchPay() }} disabled={isBatchBusy}
                style={{ display: 'flex', alignItems: 'center', gap: 6,
                  background: isBatchBusy ? Q.surf3 : Q.acc,
                  border: 'none', borderRadius: 8, padding: '6px 14px',
                  cursor: isBatchBusy ? 'not-allowed' : 'pointer',
                  color: isBatchBusy ? Q.muted : '#fff', fontWeight: 700, fontSize: 13 }}>
                <Zap size={13} />
                {batchStep === 'approving-usdt' ? 'Approving USDT…'
                 : batchStep === 'approving-usdc' ? 'Approving USDC…'
                 : batchStep === 'paying' ? 'Sending Payment…'
                 : batchStep === 'recording' ? 'Saving receipt…'
                 : `Pay All (${duePending.length})`}
              </button>
            )}
            <button onClick={handleRefresh} disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: Q.surf2, border: `1px solid ${Q.border}`,
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: Q.muted, fontSize: 13 }}>
              <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>
        </div>

        {/* Receipt banner: shown after Pay All confirms, until the receipt is stored in the contract */}
        {(batchStep === 'recording' || batchStep === 'receipt-failed') && (
          <div style={{ ...glass2Style, borderRadius: 12, padding: '14px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            {batchStep === 'receipt-failed' ? (
              <>
                <span style={{ color: Q.warn, fontSize: 13 }}>
                  Payments confirmed. The receipt for {batchIdsRef.current.length} payment(s) is not saved yet.
                </span>
                <button onClick={() => { void saveBatchReceipt() }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: Q.acc, color: '#fff', fontWeight: 700, fontSize: 13 }}>
                  Save receipt
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={16} color={Q.acc} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <span style={{ color: Q.ink2, fontSize: 13 }}>
                  {batchRecordHash
                    ? 'Saving receipt to the blockchain…'
                    : 'Payments confirmed. Confirm the 2nd transaction in your wallet to save the receipt…'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {payrolls.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Pending', value: pending.length, color: Q.warn, Icon: Clock },
              { label: 'Paid', value: paid.length, color: Q.success, Icon: CheckCircle },
              { label: 'Cancelled', value: cancelled.length, color: Q.danger, Icon: XCircle },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} style={{ ...glass2Style, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={18} color={color} />
                <div>
                  <div style={{ color: Q.ink, fontWeight: 700, fontSize: 18 }}>{value}</div>
                  <div style={{ color: Q.muted, fontSize: 11 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <RefreshCw size={28} color={Q.acc} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: Q.muted, fontSize: 14 }}>Loading payrolls from chain…</p>
          </div>
        )}

        {!isLoading && displayed.length === 0 && (
          <div style={{ ...glassStyle, borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
            <Users size={40} color={Q.muted} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: Q.ink, fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
              {tab === 'active' ? 'No pending payrolls' : 'No payrolls yet'}
            </h3>
            <p style={{ color: Q.muted, fontSize: 14, margin: '0 0 20px' }}>
              {tab === 'active' ? 'All payrolls settled — or create your first one.' : 'Create a payroll to start paying your team.'}
            </p>
            <button onClick={() => onNavigate('payroll/create')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: Q.acc, color: '#fff',
                border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              <Plus size={16} /> Create Payroll
            </button>
          </div>
        )}

        {!isLoading && displayed.map((entry) => {
          const isInBatch = duePending.some(d => d.id === entry.id)
          return (
            <PayRow
              key={entry.id.toString()}
              entry={entry}
              onRefresh={handleRefresh}
              batchMode={isInBatch && duePending.length >= 1}
            />
          )
        })}
      </div>
    </div>
  )
}
