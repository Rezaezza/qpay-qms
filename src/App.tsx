import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Q } from './theme'
import { Navbar } from './components/Navbar'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { WelcomeSplash } from './components/WelcomeSplash'
import { Dashboard } from './pages/Dashboard'
import Payroll from './pages/Payroll'
import { CreatePayroll } from './pages/CreatePayroll'
import { Swap } from './pages/Swap'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { Overview } from './pages/Overview'

export type Page = 'dashboard' | 'payroll' | 'payroll/create' | 'swap' | 'history' | 'settings' | 'overview'

export default function App() {
  const [page, setPage]           = useState<Page>('overview')
  // Stage 1: overview-only  Stage 2: splash (connect wallet)  Stage 3: full app
  const [stage, setStage]         = useState<'overview' | 'splash' | 'app'>('overview')
  const { isConnected }           = useAccount()

  // Auto-advance from splash to app once wallet connects, land on dashboard
  const effectiveStage = stage === 'splash' && isConnected ? 'app' : stage
  // When just unlocked via wallet connect, show dashboard regardless of page state
  const effectivePage: Page = effectiveStage === 'app' && page === 'overview' ? 'dashboard' : page

  function navigate(p: string) {
    setPage(p as Page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openApp() {
    setStage('splash')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Navbar onNavigate: only available in full app stage
  const navNavigate = effectiveStage === 'app' ? navigate : undefined

  function renderContent() {
    // Stage 1: Overview landing
    if (effectiveStage === 'overview') {
      return (
        <>
          <Navbar currentPage="overview" onNavigate={undefined} />
          <main style={{ flex: 1 }}>
            <ErrorBoundary key="overview">
              <Overview onNavigate={navigate} onOpen={openApp} />
            </ErrorBoundary>
          </main>
        </>
      )
    }

    // Stage 2: Splash — connect wallet
    if (effectiveStage === 'splash') {
      return (
        <>
          <Navbar currentPage="overview" onNavigate={undefined} />
          <main style={{ flex: 1 }}>
            <WelcomeSplash />
          </main>
        </>
      )
    }

    // Stage 3: Full app
    function renderPage() {
      switch (effectivePage) {
        case 'overview':       return <Overview onNavigate={navigate} />
        case 'dashboard':      return <Dashboard onNavigate={navigate} />
        case 'payroll':        return <Payroll onNavigate={navigate} />
        case 'payroll/create': return <CreatePayroll onNavigate={navigate} />
        case 'swap':           return <Swap />
        case 'history':        return <History />
        case 'settings':       return <Settings />
        default:               return <Dashboard onNavigate={navigate} />
      }
    }

    return (
      <>
        <Navbar currentPage={effectivePage} onNavigate={navNavigate} />
        <main style={{ flex: 1, paddingBottom: 80 }}>
          <ErrorBoundary key={effectivePage}>
            {renderPage()}
          </ErrorBoundary>
        </main>
        <BottomNav currentPage={effectivePage} onNavigate={navigate} />
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: Q.bg, color: Q.ink, display: 'flex', flexDirection: 'column' }}>
      {renderContent()}
    </div>
  )
}
