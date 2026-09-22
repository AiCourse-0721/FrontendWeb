import { useEffect, useRef, useState } from 'react'
import { detectStreamFrame, toDataUri } from '../api.js'

const INTERVAL_OPTIONS = [
  { label: '快 (0.5s)', value: 500 },
  { label: '中 (1s)', value: 1000 },
  { label: '慢 (2s)', value: 2000 }
]

export default function StreamPanel({ onResult }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const inFlightRef = useRef(false)

  const [active, setActive] = useState(false)
  const [intervalMs, setIntervalMs] = useState(1000)
  const [error, setError] = useState(null)
  const [lastDetection, setLastDetection] = useState(null)
  const [lastClassification, setLastClassification] = useState(null)
  const [frameCount, setFrameCount] = useState(0)
  const [latency, setLatency] = useState(null)

  useEffect(() => () => stopStream(), []) // eslint-disable-line react-hooks/exhaustive-deps

  async function startStream() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
      timerRef.current = setInterval(captureAndSend, intervalMs)
    } catch (err) {
      setError('無法存取攝影機：' + (err.message || err))
    }
  }

  function stopStream() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setActive(false)
  }

  async function captureAndSend() {
    if (inFlightRef.current) return
    const video = videoRef.current
    if (!video || video.readyState < 2) return

    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      async (blob) => {
        if (!blob) return
        inFlightRef.current = true
        const start = performance.now()
        try {
          const { detection, classification } = await detectStreamFrame(blob, { withClassify: true })
          setLastDetection(detection)
          setLastClassification(classification)
          if (classification) {
            onResult?.({ class: classification.class_name, ...classification })
          }
          setLatency(Math.round(performance.now() - start))
          setFrameCount((n) => n + 1)
          setError(null)
        } catch (err) {
          setError(err.message || '影格送出失敗')
        } finally {
          inFlightRef.current = false
        }
      },
      'image/jpeg',
      0.85
    )
  }

  function changeInterval(value) {
    setIntervalMs(value)
    if (active) {
      clearInterval(timerRef.current)
      timerRef.current = setInterval(captureAndSend, value)
    }
  }

  const annotatedUri = toDataUri(lastDetection?.annotated_image_base64)
  const boxCount = lastDetection?.boxes?.length ?? 0
  const topBoxConfidence = lastDetection?.boxes?.[0]?.confidence

  return (
    <section className="card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🎥</span> 即時影像辨識
        </span>
      </div>

      <div className="stream-viewport">
        <video ref={videoRef} muted playsInline style={{ display: active && !annotatedUri ? 'block' : 'none' }} />
        {active && annotatedUri && <img className="live-frame" src={annotatedUri} alt="即時偵測結果" />}
        {!active && <div className="placeholder">尚未啟動攝影機串流</div>}
        {active && (
          <>
            <div className="live-badge">
              <span className="dot" /> LIVE
            </div>
            <div className="scan-line" />
            <span className="hud-corner tl" />
            <span className="hud-corner tr" />
            <span className="hud-corner bl" />
            <span className="hud-corner br" />
          </>
        )}
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label>傳送頻率</label>
        <select
          value={intervalMs}
          onChange={(e) => changeInterval(Number(e.target.value))}
          style={{
            background: 'rgba(10,4,20,0.7)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text)',
            borderRadius: 8,
            padding: '10px 12px'
          }}
        >
          {INTERVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="controls-row">
        {!active ? (
          <button className="btn full" onClick={startStream} type="button">
            啟動即時辨識
          </button>
        ) : (
          <button className="btn danger full" onClick={stopStream} type="button">
            停止串流
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {lastDetection && (
        <>
          <div className="result-block">
            {lastClassification ? (
              <>
                <div className="result-class">{lastClassification.display_name}</div>
                <div className="result-sub">
                  信心度：{(lastClassification.ensemble_confidence * 100).toFixed(1)}%
                </div>
                <div className={`status-pill ${lastClassification.is_safe ? 'safe' : 'warning'}`}>
                  {lastClassification.is_safe ? '✓ 安全' : '⚠ 不安全'}
                </div>
              </>
            ) : (
              <div className="result-sub">
                {lastDetection.detected
                  ? `偵測到 ${boxCount} 個輪胎區域，信心度 ${(topBoxConfidence * 100).toFixed(1)}%`
                  : '目前畫面未偵測到輪胎'}
              </div>
            )}
          </div>

          <div className="stream-stats">
            <div className="stat-tile">
              <div className="num">{frameCount}</div>
              <div className="lbl">已送出影格</div>
            </div>
            <div className="stat-tile">
              <div className="num">{latency ?? '—'}</div>
              <div className="lbl">延遲 (ms)</div>
            </div>
            <div className="stat-tile">
              <div className="num">{(1000 / intervalMs).toFixed(1)}</div>
              <div className="lbl">目標 FPS</div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
