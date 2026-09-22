import { useEffect, useState } from 'react'
import { checkHealth } from '../api.js'


export default function SettingsBar() {
  const [status, setStatus] = useState('idle') // idle | ok | bad

  useEffect(() => {
    let cancelled = false
    checkHealth()
      .then((data) => {
        if (!cancelled) setStatus(data.status === 'ok' && data.models_loaded ? 'ok' : 'bad')
      })
      .catch(() => {
        if (!cancelled) setStatus('bad')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="settings-bar">
      <span className={`status-dot ${status}`} title="後端連線狀態" />
      <label>後端服務</label>
      <span className="api-base-readout">{status}</span>
    </div>
  )
}
