import { useRef, useState } from 'react'
import { analyzeTireImage, toDataUri } from '../api.js'
import ClassificationResult from './ClassificationResult.jsx'

export default function DetectPanel({ onResult }) {
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detection, setDetection] = useState(null)
  const [classification, setClassification] = useState(null)

  async function pickFile(f) {
    if (!f) return

    setFile(f)
    setDetection(null)
    setClassification(null)
    setError(null)
    onResult?.(null)

    setPreviewUrl(URL.createObjectURL(f))
    setLoading(true)

    try {
      const { detection: det, classification: cls } = await analyzeTireImage(f)

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

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // 選完照片後 detection 回來前先用本地預覽圖，回來後換成後端標註後的影像
  const analysisImage = toDataUri(detection?.annotated_image_base64) || previewUrl

  // 選擇照片後進入 AI 分析畫面
  const hasAnalysisStarted = Boolean(file)

  return (
    <section className="card">
      {/* 上傳區 */}
      {!hasAnalysisStarted && (
        <>
          <div className="card-header">
            <span className="card-title">
              <span className="icon">📷</span>
              輪胎影像偵測
            </span>
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
            <div className="hint">支援 JPG / JPEG / PNG，上傳後自動辨識</div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </div>
        </>
      )}

      {/* AI 分析影像 */}
      {analysisImage && (
        <div className="preview-section">
          <div
            className="preview-title"
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--primary)',
            }}
          >
            🛞 AI 分析影像
          </div>

          <div
            className="preview-wrap"
            style={{
              width: '100%',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            <img
              src={analysisImage}
              alt="AI 分析影像"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="alert info">
          <span className="spinner" />
          辨識中…
        </div>
      )}

      {/* 清除 */}
      {file && !loading && (
        <div className="controls-row">
          <button className="btn ghost full" onClick={reset} type="button">
            清除
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className="alert error">{error}</div>}

      {/* 未偵測到輪胎 */}
      {detection && !detection.detected && (
        <div className="alert warn">未偵測到輪胎，請重新上傳清楚的輪胎照片。</div>
      )}

      {/* 分類結果 */}
      {classification && <ClassificationResult classification={classification} />}
    </section>
  )
}
