import { useRef, useState } from 'react'
import { analyzeTireImage, toDataUri } from '../api.js'

export default function DetectPanel({ onResult }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detection, setDetection] = useState(null)
  const [classification, setClassification] = useState(null)

  function pickFile(f) {
    if (!f) return
    setFile(f)
    setDetection(null)
    setClassification(null)
    setError(null)
    onResult?.(null)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const { detection: det, classification: cls } = await analyzeTireImage(file)
      setDetection(det)
      setClassification(cls)
      onResult?.(cls ? { class: cls.class_name, ...cls } : null)
    } catch (err) {
      setError(err.message || '偵測失敗')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setPreviewUrl(null)
    setDetection(null)
    setClassification(null)
    setError(null)
    onResult?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const annotatedUri = toDataUri(detection?.annotated_image_base64)
  const displayImage = annotatedUri || previewUrl

  return (
    <section className="card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📷</span> 輪胎影像偵測
        </span>
        <span className="card-tag">API 1 · /api/v1/detect + /classify</span>
      </div>

      <div
        className={`dropzone ${dragOver ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          pickFile(e.dataTransfer.files?.[0])
        }}
      >
        <div>拖曳或點擊上傳輪胎照片</div>
        <div className="hint">支援 JPG / JPEG / PNG</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {displayImage && (
        <div className="preview-wrap">
          <img src={displayImage} alt="輪胎預覽" />
        </div>
      )}

      <div className="controls-row">
        <button className="btn full" disabled={!file || loading} onClick={handleSubmit} type="button">
          {loading && <span className="spinner" />}
          {loading ? '辨識中…' : '送出偵測'}
        </button>
        {file && (
          <button className="btn ghost" onClick={reset} type="button">
            清除
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {detection && !detection.detected && (
        <div className="alert warn">未偵測到輪胎，請重新上傳清楚的輪胎照片。</div>
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
