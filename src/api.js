const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function handleResponse(res) {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join('; ')
        : data.detail || data.message || JSON.stringify(data)
    } catch {
      /* body was not JSON */
    }
    throw new Error(`API 錯誤 (${res.status})：${detail}`)
  }
  return res.json()
}

export function toDataUri(base64Png) {
  if (!base64Png) return null
  return base64Png.startsWith('data:') ? base64Png : `data:image/png;base64,${base64Png}`
}

function base64ToBlob(base64Png) {
  const raw = atob(base64Png)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return new Blob([bytes], { type: 'image/png' })
}

/**
 * API 1a — YOLO 輪胎偵測：POST /api/v1/detect (multipart, field "file")
 * 回傳偵測框、標註後完整影像，以及可直接餵給 /classify 的裁切影像
 */
export async function detectTire(file, { withAnnotatedImage = true, withCrop = true, signal } = {}) {
  const form = new FormData()
  form.append('file', file)
  const params = new URLSearchParams({
    with_annotated_image: String(withAnnotatedImage),
    with_crop: String(withCrop)
  })
  const res = await fetch(`${API_BASE_URL}/api/v1/detect?${params}`, {
    method: 'POST',
    body: form,
    signal
  })
  return handleResponse(res)
}

/**
 * API 1b — CNN + ViT 狀態分類：POST /api/v1/classify (multipart, field "file")
 * 輸入建議為 /detect 回傳的裁切影像
 */
export async function classifyTire(fileOrBase64, { signal } = {}) {
  const form = new FormData()
  const blob = typeof fileOrBase64 === 'string' ? base64ToBlob(fileOrBase64) : fileOrBase64
  form.append('file', blob, 'crop.png')
  const res = await fetch(`${API_BASE_URL}/api/v1/classify`, {
    method: 'POST',
    body: form,
    signal
  })
  return handleResponse(res)
}

/**
 * 上傳完整輪胎照片，串接 detect → classify，取得完整判讀結果
 */
export async function analyzeTireImage(file, { signal } = {}) {
  const detection = await detectTire(file, { withAnnotatedImage: true, withCrop: true, signal })
  let classification = null
  if (detection.detected && detection.crop_image_base64) {
    classification = await classifyTire(detection.crop_image_base64, { signal })
  }
  return { detection, classification }
}

/**
 * API 2 — 送出剩餘壽命權重參數：POST /api/v1/predict-rul
 */
export async function predictTireRul(payload, { signal } = {}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/predict-rul`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  })
  return handleResponse(res)
}

/**
 * API 3 — 即時影像快速偵測：POST /api/v1/detect/quick (multipart, field "file")
 * 只跑第一階段 YOLO，給串流輪詢用，找到輪胎就回 { detected: true }；
 * 沒找到後端回 404，這裡視為正常的「這幀沒有」結果，不當作錯誤丟出。
 */
export async function quickDetectTire(blob, { signal } = {}) {
  const form = new FormData()
  form.append('file', blob, 'frame.jpg')
  const res = await fetch(`${API_BASE_URL}/api/v1/detect/quick`, {
    method: 'POST',
    body: form,
    signal
  })
  if (res.status === 404) {
    return { detected: false }
  }
  return handleResponse(res)
}

/**
 * 健康檢查：GET /health
 */
export async function checkHealth({ signal } = {}) {
  const res = await fetch(`${API_BASE_URL}/health`, { signal })
  return handleResponse(res)
}
