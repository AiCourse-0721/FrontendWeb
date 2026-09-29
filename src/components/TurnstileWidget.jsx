import { useEffect, useRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { registerTurnstileRef, unregisterTurnstileRef, setTurnstileToken, SKIP_AUTH } from '../turnstile.js'

//Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = '0x4AAAAAAFImq6Q7GHJ7pmm6'

export default function TurnstileWidget() {
  const ref = useRef(null)

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

  return (
    <div className="turnstile-widget">
      <Turnstile
        ref={ref}
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        onError={() => setTurnstileToken(null)}
      />
    </div>
  )
}
