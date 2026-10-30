import { useState } from 'react'
import { useAccount, useBalance, useSwitchChain, useBlockNumber } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { formatEther } from 'viem'
import { QMS_CHAIN_ID } from '../config'
import { formatAddress, formatAmount, getExplorerAddressUrl, getExplorerTxUrl, truncateHash } from '../lib/utils'
import {
  ExternalLink, Copy, CheckCircle, AlertTriangle, RefreshCw,
  Wifi, Layers, Zap, TrendingUp, ArrowRight, ArrowLeftRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { QpayLogo } from '../components/QpayLogo'
import { TokenIcon } from '../components/TokenIcon'
import { Q } from '../theme'
import { useTokenBalances } from '../hooks/useTokenBalances'
import { useSwapHistory } from '../hooks/useSwapHistory'
import { useEmployerPayrolls } from '../hooks/usePayrollContract'

const card  = { background: Q.surf2, border: `1px solid ${Q.border}`, borderRadius: 16 }
const card2 = { background: Q.surf,  border: `1px solid ${Q.border}`, borderRadius: 16 }

interface DashboardProps { onNavigate: (p: string) => void }

export function Dashboard({ onNavigate }: DashboardProps) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const wrong = isConnected && chainId !== QMS_CHAIN_ID
  const [copied, setCopied] = useState(false)

  const { data: bal, isLoading: balLoading } = useBalance({ address, chainId: QMS_CHAIN_ID })
  const { balances, isLoading: balancesLoading } = useTokenBalances(address)
  const { data: blockNumber } = useBlockNumber({ chainId: QMS_CHAIN_ID, watch: true })

  // ── Derived data (unique to Home) ──────────────────────────────────────
  // Portfolio value: sum of USDT + USDC (both 1:1 USD)
  const stableTotal = balances
    .filter(t => t.symbol === 'USDT' || t.symbol === 'USDC')
    .reduce((acc, t) => acc + parseFloat(t.formatted || '0'), 0)

  // Pending payrolls — from on-chain contract
  const { pending: pendingPayrolls } = useEmployerPayrolls()

  // Most recent confirmed swap — from on-chain Transfer events
  const { data: swapHistory = [] } = useSwapHistory(address)
  const lastSwap = swapHistory[0] ?? null

  function copyAddr() {
    if (!address) return
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true); toast.success('Address copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Not connected ─────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 24, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}><QpayLogo size={64} showText={false} /></div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 38, fontWeight: 700, color: Q.ink, margin: '0 0 12px', letterSpacing: '-0.03em' }}>Welcome to Qpay</h1>
        <p style={{ color: Q.muted, fontSize: 16, maxWidth: 340, margin: '0 0 32px', lineHeight: 1.6 }}>
          Modern payroll &amp; token swap on QMS Testnet.
        </p>
        <ConnectKitButton.Custom>
          {({ show }) => (
            <button onClick={show} style={{ padding: '14px 40px', background: Q.acc, color: '#fff', fontSize: 16, fontWeight: 600, borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
              Connect Wallet
            </button>
          )}
        </ConnectKitButton.Custom>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 360, width: '100%' }}>
          {[['Payroll', 'Pay in USDT/USDC'], ['Swap', 'Trade tokens'], ['History', 'Track activity']].map(([t, d]) => (
            <div key={t} style={{ ...card2, padding: 14 }}>
              <p style={{ color: Q.ink, fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{t}</p>
              <p style={{ color: Q.subtle, fontSize: 11, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Connected ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Wrong chain banner */}
      {wrong && (
        <div style={{ ...card2, padding: '14px 20px', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: Q.warn, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> Switch to QMS Testnet to use Qpay
          </span>
          <button onClick={() => switchChain({ chainId: QMS_CHAIN_ID })} disabled={isSwitching}
            style={{ padding: '7px 16px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', color: Q.warn, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {isSwitching ? 'Switching…' : 'Switch Network'}
          </button>
        </div>
      )}

      {/* ── QMS Balance hero ──────────────────────────────────────────── */}
      <div style={{ background: '#0d1c35', border: `1px solid ${Q.border2}`, borderRadius: 20, padding: '28px 28px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(14,165,233,0.1)' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(14,165,233,0.07)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <p style={{ color: Q.subtle, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>QMS Balance</p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          {balLoading
            ? <div style={{ height: 52, width: 200, borderRadius: 8, background: Q.surf3 }} />
            : <>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 700, color: Q.ink, lineHeight: 1, letterSpacing: '-0.04em' }}>
                  {formatAmount(parseFloat(formatEther(bal?.value ?? BigInt(0))), 4)}
                </span>
                <span style={{ color: Q.acc, fontWeight: 700, fontSize: 22, marginBottom: 4 }}>QMS</span>
              </>
          }
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={copyAddr} style={{ display: 'flex', alignItems: 'center', gap: 8, background: Q.surf, border: `1px solid ${Q.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: Q.muted, cursor: 'pointer' }}>
            <span style={{ fontFamily: 'monospace' }}>{formatAddress(address!)}</span>
            {copied ? <CheckCircle size={12} style={{ color: Q.success }} /> : <Copy size={12} />}
          </button>
          <a href={getExplorerAddressUrl(address!)} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: Q.subtle, textDecoration: 'none' }}>
            Explorer <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* ── Token Balances ────────────────────────────────────────────── */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: 14, color: Q.ink }}>Token Balances</h2>
          {balancesLoading && <RefreshCw size={13} style={{ color: Q.subtle, animation: 'spin 1s linear infinite' }} />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {balances.map((tok, i) => (
            <div key={tok.symbol} style={{ padding: '18px 16px', borderRight: i < balances.length - 1 ? `1px solid ${Q.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <TokenIcon symbol={tok.symbol} size={32} />
                <div>
                  <p style={{ color: Q.ink2, fontSize: 12, fontWeight: 700, margin: 0 }}>{tok.symbol}</p>
                  <p style={{ color: Q.subtle, fontSize: 10, margin: 0 }}>{tok.name}</p>
                </div>
              </div>
              {balancesLoading
                ? <div style={{ height: 22, width: '70%', borderRadius: 6, background: Q.surf3 }} />
                : <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: Q.ink, fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{tok.formatted}</p>
              }
              <p style={{ color: tok.color, fontSize: 11, fontWeight: 600, margin: '4px 0 0' }}>{tok.symbol}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Unique widgets row ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>

        {/* 1. Stablecoin Portfolio Value — not shown anywhere else */}
        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <TrendingUp size={14} style={{ color: Q.acc }} />
            <p style={{ color: Q.subtle, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Stablecoin Value</p>
          </div>
          {balancesLoading
            ? <div style={{ height: 36, width: 120, borderRadius: 8, background: Q.surf3, marginBottom: 6 }} />
            : <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: Q.ink, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
                ${formatAmount(stableTotal, 2)}
              </p>
          }
          <p style={{ color: Q.subtle, fontSize: 11, margin: 0 }}>Combined USDT + USDC</p>
        </div>

        {/* 2. Payroll health — a status chip, not a list */}
        <div style={{ ...card, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <AlertTriangle size={14} style={{ color: pendingPayrolls.length > 0 ? Q.warn : Q.success }} />
            <p style={{ color: Q.subtle, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Payroll Status</p>
          </div>
          {pendingPayrolls.length === 0 ? (
            <>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: Q.success, margin: '0 0 4px' }}>All clear</p>
              <p style={{ color: Q.subtle, fontSize: 11, margin: 0 }}>No pending payments</p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: Q.warn, margin: '0 0 4px', letterSpacing: '-0.03em' }}>{pendingPayrolls.length}</p>
              <p style={{ color: Q.subtle, fontSize: 11, margin: '0 0 10px' }}>
                {pendingPayrolls.length === 1 ? 'payment awaiting' : 'payments awaiting'}
              </p>
              <button onClick={() => onNavigate('payroll')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: Q.warn, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
                Go to Payroll <ArrowRight size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Last swap preview — a single row, not the full list */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeftRight size={14} style={{ color: Q.acc }} />
            <h2 style={{ margin: 0, fontWeight: 600, fontSize: 14, color: Q.ink }}>Last Swap</h2>
          </div>
          <button onClick={() => onNavigate('history')}
            style={{ background: 'none', border: 'none', color: Q.acc, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
            Full history <ArrowRight size={11} />
          </button>
        </div>

        {lastSwap === null ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <ArrowLeftRight size={28} style={{ color: Q.subtle, display: 'block', margin: '0 auto 10px' }} />
            <p style={{ color: Q.muted, fontSize: 13, margin: '0 0 4px' }}>No swaps yet</p>
            <p style={{ color: Q.subtle, fontSize: 11, margin: 0 }}>Your first confirmed swap will appear here</p>
          </div>
        ) : (
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {/* From → To tokens */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TokenIcon symbol={lastSwap.fromSymbol} size={32} />
                <div>
                  <p style={{ color: Q.ink, fontSize: 13, fontWeight: 600, margin: 0 }}>{lastSwap.fromSymbol}</p>
                  <p style={{ color: Q.subtle, fontSize: 10, margin: 0 }}>−{parseFloat(lastSwap.fromAmount).toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
                </div>
              </div>
              <ArrowRight size={14} style={{ color: Q.subtle, flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TokenIcon symbol={lastSwap.toSymbol} size={32} />
                <div>
                  <p style={{ color: Q.ink, fontSize: 13, fontWeight: 600, margin: 0 }}>{lastSwap.toSymbol}</p>
                  <p style={{ color: Q.subtle, fontSize: 10, margin: 0 }}>+{parseFloat(lastSwap.toAmount).toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
                </div>
              </div>
            </div>
            {/* Tx link */}
            <a href={getExplorerTxUrl(lastSwap.txHash)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: Q.acc, textDecoration: 'none', flexShrink: 0 }}>
              {truncateHash(lastSwap.txHash)} <ExternalLink size={9} />
            </a>
          </div>
        )}
      </div>

      {/* ── Network Status ────────────────────────────────────────────── */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wifi size={14} style={{ color: Q.success }} />
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: 14, color: Q.ink }}>Network Status</h2>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: Q.success, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: Q.success, display: 'inline-block' }} />
            Connected
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {([
            { Icon: Layers, label: 'Latest Block', value: blockNumber ? `#${blockNumber.toLocaleString()}` : '—', color: Q.acc },
            { Icon: Zap,    label: 'Finality',     value: '< 1s',  color: Q.success },
            { Icon: Wifi,   label: 'Chain ID',      value: '19480', color: Q.ink2 },
          ] as const).map(({ Icon, label, value, color }, i) => (
            <div key={label} style={{ padding: '18px 20px', borderRight: i < 2 ? `1px solid ${Q.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon size={13} style={{ color: Q.subtle }} />
                <span style={{ color: Q.subtle, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
              </div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", color, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: Q.subtle, fontSize: 12 }}>QMS Testnet — https://rpc.testnet.qms.finance</span>
          <a href="https://testnet.qmsscan.io" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: Q.acc, textDecoration: 'none', fontWeight: 600 }}>
            Explorer <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* ── Official QMS Network Handles ─────────────────────────────────────────── */}
      <div style={{ ...card2, padding: '12px 14px', marginTop: 12 }}>
        <p style={{ color: Q.subtle, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
          Official QMS Network Handles
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            {
              label: 'Website',
              href: 'https://qms.finance/',
              bg: '#0f1a2e',
              icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={Q.acc} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              ),
            },
            {
              label: 'Docs',
              href: 'https://docs.qms.finance/',
              bg: '#0f1a2e',
              icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              ),
            },
            {
              label: 'X (Twitter)',
              href: 'https://x.com/QMSNetwork',
              bg: '#0f1a2e',
              icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill={Q.ink}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                </svg>
              ),
            },
            {
              label: 'Telegram',
              href: 'https://t.me/QMSNetworkOfficial',
              bg: '#0f1a2e',
              icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="#29B6F6">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              ),
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/qmsnetwork',
              bg: '#0f1a2e',
              icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="#5865F2">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              ),
            },
          ].map(({ label, href, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5,
                padding: '5px 8px', borderRadius: 6, textDecoration: 'none',
                background: Q.surf2, border: `1px solid ${Q.border}`,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = Q.acc; (e.currentTarget).style.background = Q.surf3 }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = Q.border; (e.currentTarget).style.background = Q.surf2 }}
            >
              {icon}
              <span style={{ color: Q.ink2, fontSize: 11, fontWeight: 500 }}>{label}</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}
