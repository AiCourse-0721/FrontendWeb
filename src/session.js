// Session token 換發：Turnstile 只在這裡用一次，換到的 session token（後端為10分鐘效期）
// 在有效期內可以重複用在所有高頻/低頻 API，不用每次都重新過一次 Turnstile 挑戰。
import { getTurnstileToken, resetTurnstileWidget } from './turnstile.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 跟後端 issueSessionToken(..., 600) 的 10 分鐘一致；提早一點視為過期，
// 避免卡在邊界（例如快取顯示還有效，送出時後端剛好已經判定過期）
const SESSION_TTL_MS = 10 * 60 * 1000
const SESSION_SAFETY_MARGIN_MS = 15 * 1000

let sessionToken = null
let sessionExpiresAt = 0
let pendingSessionRequest = null

function isSessionValid() {
  return Boolean(sessionToken) && Date.now() < sessionExpiresAt - SESSION_SAFETY_MARGIN_MS
}

// 呼叫端遇到 403（session 失效/過期）時呼叫這個，讓下一次 getSessionToken() 重新換發
export function invalidateSessionToken() {
  sessionToken = null
  sessionExpiresAt = 0
}

async function requestNewSession() {
  const turnstileToken = getTurnstileToken()
  if (!turnstileToken) {
    throw new Error('請先完成人機驗證，稍等片刻或重新整理頁面後再試一次')
  }

  let res
  try {
    res = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'POST',
      headers: { 'X-Turnstile-Token': turnstileToken }
    })
  } finally {
    // Turnstile token 是一次性的，不管換發成不成功都要重置 widget 才能拿到下一個
    resetTurnstileWidget()
  }

  if (!res.ok) {
    throw new Error('人機驗證失敗，請重新整理頁面後再試一次')
  }

  const data = await res.json()
  sessionToken = data.sessionToken
  sessionExpiresAt = Date.now() + SESSION_TTL_MS
  return sessionToken
}

// 取得目前有效的 session token，沒有或已過期就自動換發一個新的；
// 多個 API 呼叫同時觸發時共用同一個進行中的換發請求，不會重複打 /auth/session
export async function getSessionToken() {
  if (isSessionValid()) return sessionToken

  if (!pendingSessionRequest) {
    pendingSessionRequest = requestNewSession().finally(() => {
      pendingSessionRequest = null
    })
  }
  return pendingSessionRequest
}
