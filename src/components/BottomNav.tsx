import { LayoutDashboard, Users, ArrowLeftRight, Clock, BookOpen } from 'lucide-react'
import { Q } from '../theme'

interface BottomNavProps { currentPage: string; onNavigate: (p: string) => void }

const NAV = [
  { id: 'dashboard', label: 'Home',     Icon: LayoutDashboard },
  { id: 'payroll',   label: 'Payroll',  Icon: Users           },
  { id: 'swap',      label: 'Swap',     Icon: ArrowLeftRight  },
  { id: 'history',   label: 'History',  Icon: Clock           },
  { id: 'overview',  label: 'Overview', Icon: BookOpen        },
]

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav style={{
      background: '#0b1424',
      borderTop: `1px solid ${Q.border}`,
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      height: 64, paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV.map(({ id, label, Icon }) => {
        const active = currentPage === id || (id !== 'dashboard' && currentPage.startsWith(id))
        return (
          <button key={id} onClick={() => onNavigate(id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 10px', minWidth: 52, background: 'none', border: 'none',
            cursor: 'pointer', color: active ? Q.acc : Q.subtle, transition: 'color 0.15s',
            position: 'relative',
          }}>
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, borderRadius: 2, background: Q.acc,
              }} />
            )}
            <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
