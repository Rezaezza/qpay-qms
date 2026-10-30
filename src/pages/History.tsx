import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useEmployerPayrolls, usePayrollPaidLogs, type OnChainPayroll } from '../hooks/usePayrollContract'
import { useSwapHistory, type OnChainSwap } from '../hooks/useSwapHistory'
import { getExplorerTxUrl, truncateHash, timeAgo } from '../lib/utils'
import { ExternalLink, Users, ArrowLeftRight, Wallet, Loader2 } from 'lucide-react'
import { TokenIcon } from '../components/TokenIcon'
import { Q } from '../theme'
import { formatUnits } from 'viem'

type Tab = 'swap' | 'payroll'

const card = { background: Q.surf2, border: `1px solid ${Q.border}`, borderRadius: 16 }

// ─── Swap row (on-chain Transfer events) ─────────────────────────────────────
function SwapRow({ s, last }: { s: OnChainSwap; last: boolean }) {
  return (
    <div style={{
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      borderBottom: last ? 'none' : `1px solid ${Q.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ position: 'relative', width: 44, height: 38, flexShrink: 0 }}>
          <div style={{ position: 'absolute', left: 0, top: 0 }}>
            <TokenIcon symbol={s.fromSymbol} size={28} />
          </div>
          <div style={{ position: 'absolute', right: 0, bottom: 0 }}>
            <TokenIcon symbol={s.toSymbol} size={22} />
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: Q.ink, fontSize: 13, fontWeight: 600, margin: 0 }}>
            {s.fromSymbol} <span style={{ color: Q.subtle, fontWeight: 400 }}>→</span> {s.toSymbol}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {s.timestamp > 0 && (
              <span style={{ color: Q.subtle, fontSize: 11 }}>{timeAgo(new Date(s.timestamp * 1000))}</span>
            )}
            <a href={getExplorerTxUrl(s.txHash)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 3, color: Q.acc, fontSize: 11, textDecoration: 'none' }}>
              {truncateHash(s.txHash)} <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
          <span style={{ color: Q.danger }}>-{Number(s.fromAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
          <span style={{ color: Q.subtle }}> {s.fromSymbol}</span>
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
          <span style={{ color: Q.success }}>+{Number(s.toAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
          <span style={{ color: Q.subtle }}> {s.toSymbol}</span>
        </p>
        {s.timestamp > 0 && (
          <p style={{ color: Q.subtle, fontSize: 11, margin: '2px 0 0' }}>
            {new Date(s.timestamp * 1000).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Payroll row (on-chain) ───────────────────────────────────────────────────
function PayrollHistoryRow({ p, txHashFromLog, last }: {
  p: OnChainPayroll; txHashFromLog: string | null; last: boolean
}) {
  const tokenColor = p.tokenSymbol === 'USDT' ? '#26a17b' : '#2775ca'
  const amountNum  = parseFloat(formatUnits(p.amount, 6))
  const paidDate   = p.paidAt > 0n ? new Date(Number(p.paidAt) * 1000) : null

  return (
    <div style={{
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      borderBottom: last ? 'none' : `1px solid ${Q.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <TokenIcon symbol={p.tokenSymbol} size={32} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ color: Q.ink, fontSize: 13, fontWeight: 600, margin: 0 }}>{p.employeeName}</p>
            <span style={{
              background: '#16a34a22', color: '#16a34a',
              borderRadius: 6, fontSize: 10, fontWeight: 700, padding: '1px 7px',
            }}>Paid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ color: Q.subtle, fontSize: 11 }}>
              {`${p.employee.slice(0, 6)}…${p.employee.slice(-4)}`}
            </span>
            {paidDate && (
              <span style={{ color: Q.subtle, fontSize: 11 }}>· {timeAgo(paidDate)}</span>
            )}
            {txHashFromLog && (
              <a href={getExplorerTxUrl(txHashFromLog)} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 3, color: Q.acc, fontSize: 11, textDecoration: 'none' }}>
                {truncateHash(txHashFromLog)} <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
          <span style={{ color: tokenColor }}>
            -{amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
        <p style={{ color: Q.subtle, fontSize: 11, margin: '2px 0 0' }}>{p.tokenSymbol}</p>
        {paidDate && (
          <p style={{ color: Q.subtle, fontSize: 11, margin: '2px 0 0' }}>{paidDate.toLocaleDateString()}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function History() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>('swap')

  // All data from on-chain — no localStorage
  const { data: swaps = [], isLoading: loadingSwaps } = useSwapHistory(address)
  const { paid: paidPayrolls, isLoading: loadingPayrolls } = useEmployerPayrolls()
  const { data: paidLogsMap = {} } = usePayrollPaidLogs(address)

  const sortedPayrolls = [...paidPayrolls].sort((a, b) => Number(b.paidAt) - Number(a.paidAt))

  function tabBtn(t: Tab, label: string, count: number, loading: boolean) {
    return (
      <button
        key={t}
        onClick={() => setTab(t)}
        style={{
          padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
          border: `1px solid ${tab === t ? Q.border2 : Q.border}`,
          background: tab === t ? Q.accDim : 'transparent',
          color: tab === t ? Q.acc : Q.muted,
          display: 'flex', alignItems: 'center', gap: 7,
        }}
      >
        {label}
        {loading ? (
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: Q.subtle }} />
        ) : (
          <span style={{
            background: tab === t ? Q.acc : Q.surf3,
            color: tab === t ? '#fff' : Q.subtle,
            borderRadius: 20, fontSize: 11, fontWeight: 700,
            padding: '1px 7px', minWidth: 22, textAlign: 'center',
          }}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", margin: 0, fontSize: 28, fontWeight: 700, color: Q.ink, letterSpacing: '-0.02em' }}>
            History
          </h1>
          <p style={{ margin: '4px 0 0', color: Q.muted, fontSize: 14 }}>
            {loadingSwaps ? '…' : swaps.length} swap{swaps.length !== 1 ? 's' : ''} · {sortedPayrolls.length} payroll payment{sortedPayrolls.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {tabBtn('swap',    'Swap History',    swaps.length,    loadingSwaps)}
          {tabBtn('payroll', 'Payroll History', sortedPayrolls.length, loadingPayrolls)}

        </div>
      </div>

      <div style={{ height: 1, background: Q.border }} />

      {/* Not connected */}
      {!isConnected && (
        <div style={{ ...card, padding: '56px 16px', textAlign: 'center' }}>
          <Wallet size={36} style={{ color: Q.subtle, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: Q.muted, fontSize: 15, fontWeight: 500, margin: '0 0 4px' }}>Connect your wallet</p>
          <p style={{ color: Q.subtle, fontSize: 13, margin: 0 }}>Connect to view your on-chain history</p>
        </div>
      )}

      {/* Swap tab */}
      {isConnected && tab === 'swap' && (
        loadingSwaps ? (
          <div style={{ ...card, padding: '56px 16px', textAlign: 'center' }}>
            <Loader2 size={32} style={{ color: Q.acc, display: 'block', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: Q.muted, fontSize: 14, margin: 0 }}>Loading swap history from blockchain…</p>
          </div>
        ) : swaps.length === 0 ? (
          <div style={{ ...card, padding: '56px 16px', textAlign: 'center' }}>
            <ArrowLeftRight size={36} style={{ color: Q.subtle, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: Q.muted, fontSize: 15, fontWeight: 500, margin: '0 0 4px' }}>No swaps yet</p>
            <p style={{ color: Q.subtle, fontSize: 13, margin: 0 }}>Your completed swaps will appear here</p>
          </div>
        ) : (
          <div style={{ ...card, overflow: 'hidden' }}>
            {swaps.map((s, i) =>
              <SwapRow key={s.txHash} s={s} last={i === swaps.length - 1} />
            )}
          </div>
        )
      )}

      {/* Payroll tab */}
      {isConnected && tab === 'payroll' && (
        loadingPayrolls ? (
          <div style={{ ...card, padding: '56px 16px', textAlign: 'center' }}>
            <Loader2 size={32} style={{ color: Q.acc, display: 'block', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: Q.muted, fontSize: 14, margin: 0 }}>Loading payroll history from blockchain…</p>
          </div>
        ) : sortedPayrolls.length === 0 ? (
          <div style={{ ...card, padding: '56px 16px', textAlign: 'center' }}>
            <Users size={36} style={{ color: Q.subtle, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: Q.muted, fontSize: 15, fontWeight: 500, margin: '0 0 4px' }}>No payroll payments yet</p>
            <p style={{ color: Q.subtle, fontSize: 13, margin: 0 }}>Completed payroll payments will appear here</p>
          </div>
        ) : (
          <div style={{ ...card, overflow: 'hidden' }}>
            {sortedPayrolls.map((p, i) =>
              <PayrollHistoryRow
                key={String(p.id)}
                p={p}
                txHashFromLog={paidLogsMap[String(p.id)] ?? null}
                last={i === sortedPayrolls.length - 1}
              />
            )}
          </div>
        )
      )}
    </div>
  )
}
