import { ConnectKitButton } from 'connectkit'
import { useAccount, useSwitchChain } from 'wagmi'
import { QpayLogo } from './QpayLogo'
import { QMS_CHAIN_ID } from '../config'
import { AlertTriangle } from 'lucide-react'
import { Q } from '../theme'

// onNavigate is optional — when undefined (overview-only mode), logo click is disabled
interface NavbarProps { currentPage: string; onNavigate?: (p: string) => void }

export function Navbar({ onNavigate }: NavbarProps) {
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const wrong = isConnected && chainId !== QMS_CHAIN_ID

  return (
    <header style={{ background: '#0b1424', borderBottom: `1px solid ${Q.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

        {/* Logo — clicks go to dashboard only when app is unlocked */}
        <button onClick={() => onNavigate?.('dashboard')} style={{ background: 'none', border: 'none', cursor: onNavigate ? 'pointer' : 'default', padding: 0, flexShrink: 0 }}>
          <QpayLogo size={32} showText />
        </button>

        {/* Right side: shown only when app is unlocked (onNavigate defined) */}
        {onNavigate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {wrong && (
              <button
                onClick={() => switchChain({ chainId: QMS_CHAIN_ID })}
                disabled={isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                  color: Q.warn, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <AlertTriangle size={13} />
                {isPending ? 'Switching…' : 'Switch to QMS'}
              </button>
            )}

            <ConnectKitButton.Custom>
              {({ isConnected: ck, show, truncatedAddress }) => (
                <button
                  onClick={show}
                  style={{
                    padding: '9px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: ck ? Q.surf2 : Q.acc,
                    border: ck ? `1px solid ${Q.border}` : 'none',
                    color: ck ? Q.ink2 : '#fff',
                    boxShadow: ck ? 'none' : '0 0 20px rgba(14,165,233,0.25)',
                  }}
                >
                  {ck ? truncatedAddress : 'Connect Wallet'}
                </button>
              )}
            </ConnectKitButton.Custom>
          </div>
        )}
      </div>

      {/* Wrong-chain full-width banner — only when unlocked */}
      {onNavigate && wrong && (
        <div style={{ padding: '8px 20px', background: 'rgba(251,191,36,0.07)', borderTop: '1px solid rgba(251,191,36,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: Q.warn, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} /> Connected to wrong network
          </span>
          <button
            onClick={() => switchChain({ chainId: QMS_CHAIN_ID })}
            disabled={isPending}
            style={{ color: Q.warn, fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isPending ? 'Switching…' : 'Switch to QMS Testnet'}
          </button>
        </div>
      )}
    </header>
  )
}
