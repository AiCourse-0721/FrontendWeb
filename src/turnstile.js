// Cloudflare Turnstile 的共用存取點：TurnstileWidget.jsx 掛載時把 ref 註冊進來、
// onSuccess/onExpire/onError 把目前 token 寫進這裡；api.js 送出受保護的請求前
//從這裡讀 token，不用把它一路透過 props 傳給每個元件。

// 純本機開發用的旁路開關：本機直接測 FastAPI 後端時（沒有 Worker、沒有
// /auth/session 路由），整個 Turnstile/session 流程都打不通，靠這個開關整套跳過。
// TurnstileWidget.jsx 開這個旗標時直接不渲染 widget，api.js 也不會要求 session token。
// 只在自己的 .env.local 設 VITE_SKIP_AUTH=true，絕對不要設進 GitHub Actions 的
// repository variable，正式站一旦誤設，Turnstile/session/流量限制會整套失效。
export const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true'

let widgetRef = null
let currentToken = null

export function registerTurnstileRef(ref) {
  widgetRef = ref
}

export function unregisterTurnstileRef() {
  widgetRef = null
  currentToken = null
}

export function setTurnstileToken(token) {
  currentToken = token || null
}

export function getTurnstileToken() {
  return currentToken
}

// token 是一次性的，送出一次請求後就要重置 widget 才能拿到下一個
export function resetTurnstileWidget() {
  currentToken = null
  widgetRef?.reset()
}
