import { useEffect, useState } from 'react'
import { checkHealth } from '../api.js'

const STATUS_LABEL = {
  idle: '連線中…',
  ok: '後端服務正常',
  bad: '後端服務異常'
}

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
    <div className="status-indicator" title={STATUS_LABEL[status]}>
      <span className={`status-dot ${status}`} />
    </div>
  )
}
