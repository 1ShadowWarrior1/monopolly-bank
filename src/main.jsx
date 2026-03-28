import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

class RootBoundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) {
    return { err }
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16, fontFamily: 'system-ui', color: '#fecaca', background: '#020617' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Ошибка приложения</p>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>{String(this.state.err)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <RootBoundary>
        <App />
      </RootBoundary>
    </StrictMode>,
  )
}

registerSW({
  immediate: true,
  onRegisterError(e) {
    console.warn('[PWA] register failed', e)
  },
})
