import { ConnectKitButton } from 'connectkit'
import { QpayLogo } from './QpayLogo'
import { Q } from '../theme'

export function WelcomeSplash() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: Q.bg, padding: '24px 20px', gap: 0,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28 }}>
        <QpayLogo size={64} showText={false} />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 32, fontWeight: 800, color: Q.ink,
        margin: '0 0 10px', letterSpacing: '-0.03em', textAlign: 'center',
      }}>
        Welcome to Qpay
      </h1>

      <p style={{
        color: Q.ink2, fontSize: 15, margin: '0 0 36px',
        textAlign: 'center', maxWidth: 320, lineHeight: 1.5,
      }}>
        Modern payroll &amp; token swap on QMS Testnet.
      </p>

      {/* Connect Wallet button */}
      <ConnectKitButton.Custom>
        {({ show }) => (
          <button
            onClick={show}
            style={{
              padding: '14px 40px', borderRadius: 14, fontSize: 16,
              fontWeight: 700, cursor: 'pointer', border: 'none',
              background: `linear-gradient(135deg, ${Q.acc} 0%, #38bdf8 100%)`,
              color: '#fff', boxShadow: '0 0 32px rgba(14,165,233,0.4)',
              letterSpacing: '-0.01em', marginBottom: 40,
            }}
          >
            Connect Wallet
          </button>
        )}
      </ConnectKitButton.Custom>

      {/* Feature chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380 }}>
        {[
          { icon: '💳', label: 'Payroll', sub: 'Pay in USDT/USDC' },
          { icon: '🔄', label: 'Swap',    sub: 'Trade tokens' },
          { icon: '📋', label: 'History', sub: 'Track activity' },
        ].map(({ icon, label, sub }) => (
          <div key={label} style={{
            background: Q.surf, border: `1px solid ${Q.border}`,
            borderRadius: 14, padding: '12px 18px', minWidth: 100,
            textAlign: 'center', flex: '1 1 90px',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: Q.ink }}>{label}</div>
            <div style={{ fontSize: 11, color: Q.ink2, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
