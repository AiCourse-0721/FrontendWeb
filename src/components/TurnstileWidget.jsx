import { useEffect, useRef, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { registerTurnstileRef, unregisterTurnstileRef, setTurnstileToken, setWidgetReady, SKIP_AUTH } from '../turnstile.js'

//Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = '0x4AAAAAAFImq6Q7GHJ7pmm6'

export default function TurnstileWidget() {
  const ref = useRef(null)
  const [verified, setVerified] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (SKIP_AUTH) return // 本機開發旁路模式，連 widget 都不渲染，避免打本機開發網域驗證失敗

    if (!TURNSTILE_SITE_KEY) {
      console.warn('尚未設定 TURNSTILE_SITE_KEY，Turnstile 驗證不會啟動，受保護的 API 會被擋下來')
      return
    }
    registerTurnstileRef(ref.current)
    return () => unregisterTurnstileRef()
  }, [])

  if (SKIP_AUTH || !TURNSTILE_SITE_KEY) return null

  function handleSuccess(token) {
    setTurnstileToken(token)
    setVerified(true)
  }

  function handleExpireOrError() {
    setTurnstileToken(null)
    setVerified(false)
  }

  return (
    <div className={`turnstile-widget ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="turnstile-badge"
        onClick={() => setExpanded((v) => !v)}
        title={verified ? '人機驗證已完成，點擊查看' : '人機驗證進行中…'}
        aria-label={verified ? '人機驗證已完成，點擊查看' : '人機驗證進行中'}
      >
        {verified ? '✓' : <span className="turnstile-badge-spinner" />}
      </button>

      <div className="turnstile-frame">
        <Turnstile
          ref={ref}
          siteKey={TURNSTILE_SITE_KEY}
          options={{ size: 'compact' }}
          onWidgetLoad={() => setWidgetReady(true)}
          onSuccess={handleSuccess}
          onExpire={handleExpireOrError}
          onError={handleExpireOrError}
        />
      </div>
    </div>
  )
}
