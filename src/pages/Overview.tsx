import {
  type LucideIcon,
  ArrowLeftRight, Users, Shield, Zap, Globe, Code2,
  ExternalLink, Copy, CheckCheck, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Q } from '../theme'
import { QpayLogo } from '../components/QpayLogo'

// ─── colour tokens ───────────────────────────────────────────────────────────
const card:  React.CSSProperties = { background: Q.surf2,  border: `1px solid ${Q.border}`,  borderRadius: 20 }
const card3: React.CSSProperties = { background: Q.surf3,  border: `1px solid ${Q.border}`,  borderRadius: 16 }
const chip:  React.CSSProperties = { background: Q.accDim, border: `1px solid ${Q.border2}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: Q.acc, letterSpacing: '0.04em' }

// ─── Inline copy-button ───────────────────────────────────────────────────────
function CopyChip({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      toast.success('Copied!')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => toast.error('Copy failed'))
  }
  return (
    <button
      onClick={copy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: Q.surf, border: `1px solid ${Q.border}`, borderRadius: 8,
        padding: '5px 10px', cursor: 'pointer', transition: 'border-color 0.15s',
      }}
    >
      <span style={{ color: Q.ink2, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.02em' }}>
        {display ?? value}
      </span>
      {copied
        ? <CheckCheck size={12} style={{ color: Q.success }} />
        : <Copy size={12} style={{ color: Q.subtle }} />
      }
    </button>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ color: Q.subtle, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: Q.border }} />
    </div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  Icon, title, desc, color, bg,
}: { Icon: LucideIcon; title: string; desc: string; color: string; bg: string }) {
  return (
    <div style={{ ...card3, padding: '20px 18px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <p style={{ color: Q.ink, fontSize: 14, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Space Grotesk',sans-serif" }}>{title}</p>
      <p style={{ color: Q.muted, fontSize: 13, margin: 0, lineHeight: 1.55 }}>{desc}</p>
    </div>
  )
}

// ─── Token row ────────────────────────────────────────────────────────────────
function TokenRow({ symbol, name, address, decimals, color }: { symbol: string; name: string; address: string; decimals: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${Q.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color, fontSize: 10, fontWeight: 800 }}>{symbol.slice(0, 2)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: Q.ink, fontSize: 13, fontWeight: 700, margin: 0 }}>{symbol}</p>
        <p style={{ color: Q.subtle, fontSize: 11, margin: 0 }}>{name} · {decimals} decimals</p>
      </div>
      <CopyChip value={address} display={`${address.slice(0, 6)}…${address.slice(-4)}`} />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div style={{ ...card3, padding: '16px 18px', textAlign: 'center' }}>
      <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: accent ? Q.acc : Q.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{value}</p>
      <p style={{ color: Q.muted, fontSize: 11, fontWeight: 500, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Overview({ onNavigate, onOpen }: { onNavigate: (p: string) => void; onOpen?: () => void }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px 40px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        ...card,
        padding: '32px 28px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* background accent blob */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <QpayLogo size={40} showText />
          <span style={chip}>v1.2 Testnet</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontSize: 32, fontWeight: 800, color: Q.ink,
          margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          Payroll & Token Swap<br />
          <span style={{ color: Q.acc }}>on QMS Testnet</span>
        </h1>
        <p style={{ color: Q.muted, fontSize: 15, margin: '0 0 24px', lineHeight: 1.65, maxWidth: 480 }}>
          Qpay is a decentralised finance platform that lets teams pay employees in stablecoins
          and swap tokens — all within a single, mobile-first interface on the QMS blockchain.
        </p>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {onOpen ? (
            <button
              onClick={onOpen}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                background: `linear-gradient(135deg, ${Q.acc} 0%, #38bdf8 100%)`,
                color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 15, border: 'none',
                cursor: 'pointer', boxShadow: '0 0 24px rgba(14,165,233,0.4)',
                letterSpacing: '-0.01em' }}
            >
              Open Qpay <ChevronRight size={16} />
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('payroll')}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', background: Q.acc, color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}
              >
                <Users size={16} /> Go to Payroll <ChevronRight size={14} />
              </button>
              <button
                onClick={() => onNavigate('swap')}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', background: Q.surf, color: Q.ink2, borderRadius: 12, fontWeight: 600, fontSize: 14, border: `1px solid ${Q.border}`, cursor: 'pointer' }}
              >
                <ArrowLeftRight size={16} /> Open Swap
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        <Stat value="19480" label="Chain ID" accent />
        <Stat value="2" label="Stablecoins" />
        <Stat value="< 1s" label="Finality" />
      </div>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <SectionHead label="Core Features" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 28 }}>
        <FeatureCard
          Icon={Users}
          title="Payroll"
          desc="Create payroll entries on-chain. Pay one or batch-pay all due employees in a single transaction — USDT or USDC."
          color="#26a17b" bg="rgba(38,161,123,0.1)"
        />
        <FeatureCard
          Icon={ArrowLeftRight}
          title="Token Swap"
          desc="Swap QMS, USDT, and USDC via the QWAP DEX router with live on-chain pricing."
          color={Q.acc} bg={Q.accDim}
        />
        <FeatureCard
          Icon={Shield}
          title="Non-custodial"
          desc="All transactions are signed by your own wallet. Qpay never holds your funds."
          color="#a78bfa" bg="rgba(167,139,250,0.08)"
        />
        <FeatureCard
          Icon={Zap}
          title="Fast Finality"
          desc="QMS Testnet delivers sub-second block finality so payments confirm in moments."
          color={Q.warn} bg="rgba(251,191,36,0.08)"
        />
      </div>

      {/* ── Network ──────────────────────────────────────────────────── */}
      <SectionHead label="Network" />
      <div style={{ ...card, padding: '20px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: Q.accDim, border: `1.5px solid ${Q.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe size={18} style={{ color: Q.acc }} />
          </div>
          <div>
            <p style={{ color: Q.ink, fontSize: 14, fontWeight: 700, margin: 0 }}>QMS Testnet</p>
            <p style={{ color: Q.subtle, fontSize: 12, margin: 0 }}>EVM-compatible · Chain ID 19480</p>
          </div>
          <a
            href="https://testnet.qmsscan.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: Q.acc, fontSize: 12, fontWeight: 600, textDecoration: 'none', padding: '6px 12px', background: Q.accDim, border: `1px solid ${Q.border2}`, borderRadius: 8 }}
          >
            Explorer <ExternalLink size={11} />
          </a>
        </div>

        {[
          { label: 'RPC URL',         value: 'https://rpc.testnet.qms.finance' },
          { label: 'Chain ID',        value: '19480' },
          { label: 'Currency',        value: 'QMS' },
          { label: 'Block Explorer',  value: 'https://testnet.qmsscan.io' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${Q.border}` }}>
            <span style={{ color: Q.subtle, fontSize: 12, fontWeight: 500 }}>{label}</span>
            <CopyChip value={value} />
          </div>
        ))}
      </div>

      {/* ── Tokens ───────────────────────────────────────────────────── */}
      <SectionHead label="Supported Stablecoins" />
      <div style={{ ...card, padding: '8px 22px', marginBottom: 24 }}>
        <TokenRow symbol="USDT" name="Tether USD" address="0x72577544f4134a25E7f09d0B5FF0ca05A1249EbF" decimals={6} color="#26a17b" />
        <TokenRow symbol="USDC" name="USD Coin"   address="0xDfF68E53a0A8275212927c12017f5aB5f1842a04" decimals={6} color="#2775ca" />
        <div style={{ padding: '12px 0 4px' }}>
          <p style={{ color: Q.subtle, fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            Both tokens have 6 decimal places. Used for payroll payments. QMS is the native gas token.
          </p>
        </div>
      </div>

      {/* ── DEX / Router ─────────────────────────────────────────────── */}
      <SectionHead label="DEX Integration" />
      <div style={{ ...card, padding: '20px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: Q.accDim, border: `1.5px solid ${Q.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeftRight size={18} style={{ color: Q.acc }} />
          </div>
          <div>
            <p style={{ color: Q.ink, fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>QWAP Router</p>
            <p style={{ color: Q.subtle, fontSize: 12, margin: '0 0 8px' }}>
              Uniswap V2-compatible AMM on QMS Testnet
            </p>
            <CopyChip value="0x93AFF45f28e5DF1b55f5AEFEfB807De843b12619" display="0x93AFF…619" />
          </div>
        </div>
        {[
          { label: 'Protocol',   value: 'Uniswap V2 AMM' },
          { label: 'Routing',    value: 'QMS → WQMS → Token (auto)' },
          { label: 'Slippage',   value: 'Auto (2.5%) or custom' },
          { label: 'Deadline',   value: '5 min default (configurable)' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${Q.border}` }}>
            <span style={{ color: Q.subtle, fontSize: 12 }}>{label}</span>
            <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Deployed Contracts ───────────────────────────────────────── */}
      <SectionHead label="Deployed Contracts" />
      <div style={{ ...card, padding: '20px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.08)', border: '1.5px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Code2 size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: Q.ink, fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>Create2Factory</p>
            <p style={{ color: Q.subtle, fontSize: 11, margin: 0 }}>Deterministic CREATE2 deployment factory</p>
          </div>
          <a
            href="https://testnet.qmsscan.io/address/0x176725adc529512bD7Cad093a24969954ad34e51"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: Q.acc, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 10px', background: Q.accDim, border: `1px solid ${Q.border2}`, borderRadius: 7 }}
          >
            View <ExternalLink size={10} />
          </a>
        </div>
        <div style={{ padding: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${Q.border}` }}>
            <span style={{ color: Q.subtle, fontSize: 12 }}>Address</span>
            <CopyChip value="0x176725adc529512bD7Cad093a24969954ad34e51" display="0x1767…e51" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${Q.border}` }}>
            <span style={{ color: Q.subtle, fontSize: 12 }}>Network</span>
            <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>QMS Testnet</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <span style={{ color: Q.subtle, fontSize: 12 }}>Deployed</span>
            <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>2026-10-10</span>
          </div>
        </div>
      </div>

      {/* QpayPayroll v3 */}
      <div style={{ ...card, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: Q.accDim, border: `1.5px solid ${Q.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Code2 size={18} color={Q.acc} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ color: Q.ink, fontSize: 14, fontWeight: 700, margin: 0 }}>QpayPayroll</p>
              <span style={{ fontSize: 10, color: Q.acc, background: Q.accDim, border: `1px solid ${Q.border2}`, borderRadius: 20, padding: '2px 7px', fontWeight: 700 }}>v3</span>
            </div>
            <p style={{ color: Q.subtle, fontSize: 11, margin: '2px 0 0' }}>On-chain payroll · batch create & pay · startDate enforcement · USDT & USDC</p>
          </div>
          <a href="https://testnet.qmsscan.io/address/0xFCB2D1735D05A396aAf817b82AE1145050f18885"
            target="_blank" rel="noopener noreferrer"
            style={{ color: Q.acc, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 10px', background: Q.accDim, border: `1px solid ${Q.border2}`, borderRadius: 7 }}>
            View <ExternalLink size={10} />
          </a>
        </div>
        <div style={{ padding: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Address',   val: <CopyChip value="0xFCB2D1735D05A396aAf817b82AE1145050f18885" display="0xFCB2…885" /> },
            { label: 'Network',   val: <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>QMS Testnet (19480)</span> },
            { label: 'Deployed',  val: <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>2026-10-29</span> },
            { label: 'Features',  val: <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>batchCreatePayroll · batchPayEmployees · payEmployee · cancelPayroll · startDate lock</span> },
          ].map(({ label, val }, i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Q.border}` : 'none' }}>
              <span style={{ color: Q.subtle, fontSize: 12 }}>{label}</span>
              {val}
            </div>
          ))}
        </div>
      </div>

      {/* QpaySwap */}
      <div style={{ ...card, padding: '20px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(56,189,248,0.08)', border: '1.5px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeftRight size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: Q.ink, fontSize: 14, fontWeight: 700, margin: 0 }}>QpaySwap</p>
            <p style={{ color: Q.subtle, fontSize: 11, margin: '2px 0 0' }}>On-chain swap history registry · ring buffer · cross-device</p>
          </div>
          <a href="https://testnet.qmsscan.io/address/0xeDDf43468577A03B89496A8869277Dd62791cf43"
            target="_blank" rel="noopener noreferrer"
            style={{ color: Q.acc, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 10px', background: Q.accDim, border: `1px solid ${Q.border2}`, borderRadius: 7 }}>
            View <ExternalLink size={10} />
          </a>
        </div>
        <div style={{ padding: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Address',   val: <CopyChip value="0xeDDf43468577A03B89496A8869277Dd62791cf43" display="0xeDDf…cf43" /> },
            { label: 'Network',   val: <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>QMS Testnet (19480)</span> },
            { label: 'Deployed',  val: <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>2026-10-29</span> },
            { label: 'Features',  val: <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>recordSwap · getSwapHistory · ring buffer 500 entries · no localStorage</span> },
          ].map(({ label, val }, i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Q.border}` : 'none' }}>
              <span style={{ color: Q.subtle, fontSize: 12 }}>{label}</span>
              {val}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech Stack ───────────────────────────────────────────────── */}
      <SectionHead label="Tech Stack" />
      <div style={{ ...card, padding: '16px 22px', marginBottom: 24 }}>
        {[
          { label: 'Frontend',  value: 'React 18 · Vite · TypeScript' },
          { label: 'Web3',      value: 'wagmi v2 · viem · ConnectKit' },
          { label: 'Contracts', value: 'Solidity 0.8.28 · Foundry' },
          { label: 'Styling',   value: 'Tailwind CSS · Inline style tokens' },
          { label: 'Toasts',    value: 'Sonner' },
          { label: 'Icons',     value: 'Lucide React' },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Q.border}` : 'none' }}>
            <span style={{ color: Q.subtle, fontSize: 12, fontWeight: 500 }}>{label}</span>
            <span style={{ color: Q.ink2, fontSize: 12, fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <SectionHead label="How It Works" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {[
          { step: '01', title: 'Connect Wallet',    desc: 'Connect MetaMask or any injected wallet. Qpay auto-detects QMS Testnet and prompts you to switch if needed.' },
          { step: '02', title: 'Add Payroll',       desc: 'Create a payroll entry with employee name, wallet address, USDT or USDC amount, and a start date. Payment is locked until the start date.' },
          { step: '03', title: 'Pay Employees',      desc: 'Approve the token once, then use Pay All to batch-pay all due employees in one transaction — or pay individually per entry.' },
          { step: '04', title: 'Swap Tokens',       desc: 'Use the Swap page to exchange QMS, USDT, or USDC via the QWAP router at the live on-chain rate.' },
        ].map(({ step, title, desc }) => (
          <div key={step} style={{ ...card3, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: Q.accDim, border: `1px solid ${Q.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: Q.acc, fontSize: 12, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif" }}>{step}</span>
            </div>
            <div>
              <p style={{ color: Q.ink, fontSize: 14, fontWeight: 700, margin: '0 0 5px', fontFamily: "'Space Grotesk',sans-serif" }}>{title}</p>
              <p style={{ color: Q.muted, fontSize: 13, margin: 0, lineHeight: 1.55 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${Q.border}`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Left: branding */}
        <div>
          <p style={{ color: Q.ink, fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>Qpay</p>
          <p style={{ color: Q.muted, fontSize: 13, margin: '0 0 8px' }}>Non-custodial stablecoin payroll and token swap on QMS Network</p>
          <p style={{ color: Q.subtle, fontSize: 12, margin: 0 }}>© 2026 Qpay. All rights reserved.</p>
        </div>
        {/* Right: legal + docs links */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="https://github.com/Rezaezza/qpay-qms" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              color: Q.muted, fontSize: 12, fontWeight: 500, textDecoration: 'none',
              border: `1px solid ${Q.border}`, borderRadius: 8, padding: '5px 12px',
              background: Q.surf2, transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget).style.color = Q.ink; (e.currentTarget).style.borderColor = Q.acc }}
            onMouseLeave={e => { (e.currentTarget).style.color = Q.muted; (e.currentTarget).style.borderColor = Q.border }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <a href="/docs.html" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              color: Q.muted, fontSize: 12, fontWeight: 500, textDecoration: 'none',
              border: `1px solid ${Q.border}`, borderRadius: 8, padding: '5px 12px',
              background: Q.surf2, transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget).style.color = Q.acc; (e.currentTarget).style.borderColor = Q.acc }}
            onMouseLeave={e => { (e.currentTarget).style.color = Q.muted; (e.currentTarget).style.borderColor = Q.border }}>
            📖 Documents
          </a>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              color: Q.muted, fontSize: 12, fontWeight: 500, textDecoration: 'none',
              border: `1px solid ${Q.border}`, borderRadius: 8, padding: '5px 12px',
              background: Q.surf2, transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget).style.color = Q.acc; (e.currentTarget).style.borderColor = Q.acc }}
            onMouseLeave={e => { (e.currentTarget).style.color = Q.muted; (e.currentTarget).style.borderColor = Q.border }}>
            📄 Terms of Service
          </a>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              color: Q.muted, fontSize: 12, fontWeight: 500, textDecoration: 'none',
              border: `1px solid ${Q.border}`, borderRadius: 8, padding: '5px 12px',
              background: Q.surf2, transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget).style.color = Q.acc; (e.currentTarget).style.borderColor = Q.acc }}
            onMouseLeave={e => { (e.currentTarget).style.color = Q.muted; (e.currentTarget).style.borderColor = Q.border }}>
            🔒 Privacy Policy
          </a>
        </div>
      </div>

    </div>
  )
}
