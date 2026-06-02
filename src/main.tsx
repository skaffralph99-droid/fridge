import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: string | null}> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: Error) { return { error: error.message } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: '#EF4444', fontFamily: 'monospace', background: '#0A1628', minHeight: '100vh' }}>
        <h1 style={{ color: '#E8EDF2' }}>App Error</h1>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>{this.state.error}</pre>
      </div>
    )
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary><App /></ErrorBoundary>
)
