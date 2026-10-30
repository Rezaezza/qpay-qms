import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset)
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#111827', border: '1px solid #ef444433', borderRadius: 16, padding: 32, maxWidth: 500, width: '100%' }}>
            <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Page failed to render</div>
            <pre style={{ color: '#9ca3af', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0 0 16px' }}>
              {error.message}
            </pre>
            <button onClick={this.reset}
              style={{ background: '#6c5ce7', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
