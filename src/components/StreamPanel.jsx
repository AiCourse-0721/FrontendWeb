import { useEffect, useRef, useState } from 'react'
import { analyzeTireImage, quickDetectTire, toDataUri } from '../api.js'

// 鏡頭擷取頻率固定值，不開放 UI 調整；要改的話直接改這裡即可
const SCAN_INTERVAL_MS = 500

export default function StreamPanel({ onResult }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const inFlightRef = useRef(false)

  const [phase, setPhase] = useState('idle') // idle | scanning | analyzing | done
  const [error, setError] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [latency, setLatency] = useState(null)
  const [capturedUrl, setCapturedUrl] = useState(null)
  const [detection, setDetection] = useState(null)
  const [classification, setClassification] = useState(null)

  useEffect(() => () => stopCamera(), []) // eslint-disable-line react-hooks/exhaustive-deps

  function stopCamera() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  async function startScan() {
    setError(null)
    setDetection(null)
    setClassification(null)
    setCapturedUrl(null)
    setScanCount(0)
    onResult?.(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPhase('scanning')
      timerRef.current = setInterval(captureAndScan, SCAN_INTERVAL_MS)
    } catch (err) {
      setError('無法存取攝影機：' + (err.message || err))
    }
  }

  function stopScan() {
    stopCamera()
    setPhase('idle')
  }

  async function captureAndScan() {
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
          const result = await quickDetectTire(blob)
          setLatency(Math.round(performance.now() - start))
          setScanCount((n) => n + 1)
          setError(null)

          if (result.detected) {
            // 找到輪胎：停止輪詢、關掉攝影機，改用這一幀跑完整兩階段分析
            stopCamera()
            setCapturedUrl(URL.createObjectURL(blob))
            setPhase('analyzing')

            try {
              const { detection: det, classification: cls } = await analyzeTireImage(blob)
              setDetection(det)
              setClassification(cls)
              onResult?.(cls ? { class: cls.class_name, ...cls } : null)
              setPhase('done')
            } catch (err) {
              setError(err.message || '分析失敗，請重新掃描')
              setPhase('idle')
            }
          }
        } catch (err) {
          // quick-detect 本身失敗（例如網路問題），不中斷掃描，等下一輪重試
          setError(err.message || '偵測失敗')
        } finally {
          inFlightRef.current = false
        }
      },
      'image/jpeg',
      0.85
    )
  }

  const annotatedUri = toDataUri(detection?.annotated_image_base64)
  const displayImage = annotatedUri || capturedUrl

  return (
    <section className="card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🎥</span> 即時影像辨識
        </span>
      </div>

      <div className="stream-viewport">
        <video ref={videoRef} muted playsInline style={{ display: phase === 'scanning' ? 'block' : 'none' }} />
        {phase !== 'scanning' && displayImage && <img className="live-frame" src={displayImage} alt="擷取畫面" />}
        {phase === 'idle' && !displayImage && <div className="placeholder">尚未啟動攝影機掃描</div>}
        {phase === 'scanning' && (
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
        {phase === 'analyzing' && (
          <div className="live-badge" style={{ color: 'var(--primary)' }}>
            <span className="spinner" style={{ margin: 0 }} /> 分析中
          </div>
        )}
      </div>

      <div className="controls-row">
        {phase === 'idle' && (
          <button className="btn full" onClick={startScan} type="button">
            啟動掃描
          </button>
        )}
        {phase === 'scanning' && (
          <button className="btn danger full" onClick={stopScan} type="button">
            停止掃描
          </button>
        )}
        {phase === 'done' && (
          <button className="btn full" onClick={startScan} type="button">
            重新掃描
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {phase === 'scanning' && (
        <div className="stream-stats">
          <div className="stat-tile">
            <div className="num">{scanCount}</div>
            <div className="lbl">掃描次數</div>
          </div>
          <div className="stat-tile">
            <div className="num">{latency ?? '—'}</div>
            <div className="lbl">延遲 (ms)</div>
          </div>
          <div className="stat-tile">
            <div className="num">{(1000 / SCAN_INTERVAL_MS).toFixed(1)}</div>
            <div className="lbl">目標 FPS</div>
          </div>
        </div>
      )}

      {classification && (
        <div className="result-block">
          <div className="result-class">{classification.display_name}</div>
          <div className="result-sub">Ensemble 信心度：{(classification.ensemble_confidence * 100).toFixed(2)}%</div>

          <div className="confidence-row">
            <div className="confidence-item">
              <div className="label">
                <span>CNN 35%</span>
                <span>{(classification.cnn_confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="confidence-bar">
                <span style={{ width: `${classification.cnn_confidence * 100}%` }} />
              </div>
            </div>
            <div className="confidence-item">
              <div className="label">
                <span>ViT 65%</span>
                <span>{(classification.vit_confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="confidence-bar">
                <span style={{ width: `${classification.vit_confidence * 100}%` }} />
              </div>
            </div>
          </div>

          <div className={`status-pill ${classification.is_safe ? 'safe' : 'warning'}`}>
            {classification.is_safe ? '✓ 輪胎狀態：安全' : '⚠ 輪胎狀態：不安全'}
          </div>
          {!classification.is_safe && (
            <div className="alert warn">
              {classification.class_name === 'BALD'
                ? '胎紋可能已磨平，建議盡快前往車廠檢查。'
                : '偵測到輪胎異常，建議盡快前往車廠檢查。'}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
