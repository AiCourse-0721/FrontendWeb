import { useEffect, useState } from 'react'
import { checkHealth } from '../api.js'

const HEALTHY_INTERVAL_MS = 10000
const UNHEALTHY_INTERVAL_MS = 1000

export default function Header() {
  const [status, setStatus] = useState('idle') // idle | ok | bad

  useEffect(() => {
    let cancelled = false
    let timer = null

    async function poll() {
      let nextDelay = UNHEALTHY_INTERVAL_MS
      try {
        const data = await checkHealth()
        if (cancelled) return
        const healthy = data.status === 'ok' && data.models_loaded
        setStatus(healthy ? 'ok' : 'bad')
        nextDelay = healthy ? HEALTHY_INTERVAL_MS : UNHEALTHY_INTERVAL_MS
      } catch {
        if (cancelled) return
        setStatus('bad')
      }
      if (!cancelled) timer = setTimeout(poll, nextDelay)
    }

    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  return (
    <header className="hud-header">
      <div className="eyebrow">NEURAL VISION · REALTIME INFERENCE</div>
      <h1>🛞 TireGuard AI</h1>
      <p className="subtitle">
        智慧輪胎安全辨識系統
        <span className={`status-dot inline ${status}`} />
      </p>
      <div className="hud-divider" />
    </header>
  )
}
