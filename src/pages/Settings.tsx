import { useAccount, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { QMS_CHAIN_ID, qmsTestnet, STABLECOINS } from '../config'
import { CheckCircle, AlertTriangle, ExternalLink, Copy, Globe, Zap, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Q } from '../theme'

type Provider = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> }

async function addNetwork(): Promise<void> {
  const p = (window as { ethereum?: Provider }).ethereum
  if (!p) { toast.error('No wallet detected. Install MetaMask first.'); return }
  try {
    await p.request({ method: 'wallet_addEthereumChain', params: [{ chainId: `0x${QMS_CHAIN_ID.toString(16)}`, chainName: qmsTestnet.name, nativeCurrency: qmsTestnet.nativeCurrency, rpcUrls: [qmsTestnet.rpcUrls.default.http[0]], blockExplorerUrls: [qmsTestnet.blockExplorers.default.url] }] })
    toast.success('QMS Testnet added to wallet!')
  } catch { toast.error('Failed to add network. Try manually.') }
}

const card = { background: Q.surf2, border: `1px solid ${Q.border}`, borderRadius: 16, overflow: 'hidden' }

function Row({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: `1px solid ${Q.border}` }}>
      <span style={{ color: Q.subtle, fontSize: 13 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: Q.ink, fontSize: 12, fontFamily: mono ? 'monospace' : 'inherit', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        {onCopy && <button onClick={onCopy} style={{ background: 'none', border: 'none', color: Q.subtle, cursor: 'pointer', padding: 2 }}><Copy size={12} /></button>}
      </div>
    </div>
  )
}

export function Settings() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const ok = chainId === QMS_CHAIN_ID

  function copy(v: string, label: string) { void navigator.clipboard.writeText(v).then(() => toast.success(`${label} copied!`)) }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", margin: 0, fontSize: 28, fontWeight: 700, color: Q.ink }}>Settings</h1>
        <p style={{ margin: '4px 0 0', color: Q.muted, fontSize: 14 }}>Network configuration and wallet settings</p>
      </div>

      {/* Network Status */}
      <div style={{ ...card }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={16} style={{ color: Q.acc }} />
          <h2 style={{ margin: 0, color: Q.ink, fontSize: 14, fontWeight: 600 }}>Network Status</h2>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {ok ? (
              <><div style={{ width: 8, height: 8, borderRadius: '50%', background: Q.success }} /><span style={{ color: Q.success, fontSize: 13, fontWeight: 500 }}>Connected to QMS Testnet</span></>
            ) : (
              <><AlertTriangle size={16} style={{ color: Q.warn }} /><span style={{ color: Q.warn, fontSize: 13, fontWeight: 500 }}>{isConnected ? 'Wrong network' : 'Wallet not connected'}</span></>
            )}
          </div>
          {isConnected && !ok && (
            <button onClick={() => switchChain({ chainId: QMS_CHAIN_ID })} disabled={isPending} style={{ padding: '8px 16px', background: Q.acc, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {isPending ? 'Switching…' : 'Switch to QMS Testnet'}
            </button>
          )}
          {ok && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: Q.success, fontSize: 12 }}><CheckCircle size={12} /> Active</span>
          )}
        </div>
      </div>

      {/* Network Details */}
      <div style={{ ...card }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} style={{ color: Q.acc }} />
          <h2 style={{ margin: 0, color: Q.ink, fontSize: 14, fontWeight: 600 }}>QMS Testnet Details</h2>
        </div>
        <Row label="Network Name" value={qmsTestnet.name} />
        <Row label="Chain ID" value={String(QMS_CHAIN_ID)} onCopy={() => copy(String(QMS_CHAIN_ID), 'Chain ID')} />
        <Row label="RPC URL" value={qmsTestnet.rpcUrls.default.http[0]} mono onCopy={() => copy(qmsTestnet.rpcUrls.default.http[0], 'RPC URL')} />
        <Row label="Currency" value={qmsTestnet.nativeCurrency.symbol} />
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: Q.subtle, fontSize: 13 }}>Block Explorer</span>
          <a href={qmsTestnet.blockExplorers.default.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: Q.acc, fontSize: 12, textDecoration: 'none' }}>
            {qmsTestnet.blockExplorers.default.url} <ExternalLink size={10} />
          </a>
        </div>
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${Q.border}` }}>
          <button onClick={() => { void addNetwork() }} style={{ width: '100%', padding: '12px 0', background: Q.accDim, border: `1px solid ${Q.border2}`, color: Q.acc, borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Add QMS Testnet to MetaMask
          </button>
        </div>
      </div>

      {/* Stablecoins */}
      <div style={{ ...card }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: Q.acc }} />
          <h2 style={{ margin: 0, color: Q.ink, fontSize: 14, fontWeight: 600 }}>Stablecoins (QMS Testnet)</h2>
        </div>
        {STABLECOINS.map((t, i) => (
          <div key={t.symbol} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: i < STABLECOINS.length - 1 ? `1px solid ${Q.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: t.bgColor, border: `2px solid ${t.color}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: t.color, flexShrink: 0 }}>{t.symbol.slice(0, 2)}</span>
              <div>
                <p style={{ color: Q.ink, fontSize: 14, fontWeight: 600, margin: 0 }}>{t.symbol}</p>
                <p style={{ color: Q.subtle, fontSize: 12, margin: '2px 0 0' }}>{t.name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: Q.subtle, fontSize: 11, fontFamily: 'monospace' }}>{t.address.slice(0, 10)}…</span>
              <button onClick={() => copy(t.address, `${t.symbol} address`)} style={{ background: 'none', border: 'none', color: Q.subtle, cursor: 'pointer' }}>
                <Copy size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Wallet */}
      {isConnected && address && (
        <div style={{ ...card }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${Q.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} style={{ color: Q.success }} />
            <h2 style={{ margin: 0, color: Q.ink, fontSize: 14, fontWeight: 600 }}>Connected Wallet</h2>
          </div>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: Q.ink, fontSize: 13, fontFamily: 'monospace' }}>{address}</span>
            <button onClick={() => copy(address, 'Address')} style={{ background: 'none', border: 'none', color: Q.subtle, cursor: 'pointer' }}><Copy size={14} /></button>
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button onClick={show} style={{ width: '100%', padding: '10px 0', background: Q.surf, border: `1px solid ${Q.border}`, color: Q.muted, borderRadius: 10, fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                  Manage Wallet
                </button>
              )}
            </ConnectKitButton.Custom>
          </div>
        </div>
      )}
    </div>
  )
}
