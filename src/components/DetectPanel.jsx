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
      const {
        detection: det,
        classification: cls,
      } = await analyzeTireImage(f)

      setDetection(det)
      setClassification(cls)

      onResult?.(
        cls
          ? {
              class: cls.class_name,
              ...cls,
            }
          : null
      )
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

  // AI 分析影像
  // 後端產生：輪胎清楚 + 背景 Gaussian Blur
  const analysisImage = toDataUri(
    detection?.annotated_image_base64
  )

  // 選擇照片後進入 AI 分析畫面
  const hasAnalysisStarted = Boolean(file)

  return (
    <section className="card">

      {/* ==================================================
          上傳區
      ================================================== */}
      {!hasAnalysisStarted && (
        <>
          <div className="card-header">
            <span className="card-title">
              <span className="icon">📷</span>
              輪胎影像偵測
            </span>
          </div>

          <div
            className={`dropzone ${
              dragOver ? 'dragover' : ''
            }`}
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
            <div>
              拖曳或點擊上傳輪胎照片
            </div>

            <div className="hint">
              支援 JPG / JPEG / PNG，上傳後自動辨識
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) =>
                pickFile(e.target.files?.[0])
              }
            />
          </div>
        </>
      )}

      {/* ==================================================
          AI 分析影像
      ================================================== */}
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

      {/* ==================================================
          Loading
      ================================================== */}
      {loading && (
        <div className="alert info">
          <span className="spinner" />
          辨識中…
        </div>
      )}

      {/* ==================================================
          清除
      ================================================== */}
      {file && !loading && (
        <div className="controls-row">
          <button
            className="btn ghost full"
            onClick={reset}
            type="button"
          >
            清除
          </button>
        </div>
      )}

      {/* ==================================================
          Error
      ================================================== */}
      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {/* ==================================================
          未偵測到輪胎
      ================================================== */}
      {detection && !detection.detected && (
        <div className="alert warn">
          未偵測到輪胎，請重新上傳清楚的輪胎照片。
        </div>
      )}

      {/* ==================================================
          分類結果
      ================================================== */}
      {classification && (
        <div className="result-block">

          {/* ==================================================
              最終判定
          ================================================== */}
          <div
            className="result-class"
            style={{
              fontSize: '28px',
              fontWeight: '700',
            }}
          >
            {classification.display_name}
          </div>

          {/* ==================================================
              Ensemble 信心度
          ================================================== */}
          <div
            className="result-sub"
            style={{
              fontSize: '15px',
              color: '#8BEFFF',
              fontWeight: '600',
            }}
          >
            Ensemble 信心度：
            {(classification.ensemble_confidence * 100).toFixed(2)}%
          </div>

          {/* ==================================================
              三分類機率
          ================================================== */}
          <div
            className="confidence-row"
            style={{
              gap: '12px',
              marginTop: '18px',
            }}
          >

            {/* 異常輪胎 */}
            <div className="confidence-item">

              <div
                className="label"
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--primary)',
                }}
              >
                <span>
                  異常輪胎
                </span>

                <span>
                  {(classification.bad_probability * 100).toFixed(2)}%
                </span>
              </div>

              <div
                className="confidence-bar"
                style={{
                  height: '7px',
                }}
              >
                <span
                  style={{
                    width: `${
                      classification.bad_probability * 100
                    }%`,
                  }}
                />
              </div>

            </div>

            {/* 胎紋磨平 */}
            <div className="confidence-item">

              <div
                className="label"
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--primary)',
                }}
              >
                <span>
                  胎紋磨平
                </span>

                <span>
                  {(classification.bald_probability * 100).toFixed(2)}%
                </span>
              </div>

              <div
                className="confidence-bar"
                style={{
                  height: '7px',
                }}
              >
                <span
                  style={{
                    width: `${
                      classification.bald_probability * 100
                    }%`,
                  }}
                />
              </div>

            </div>

            {/* 正常輪胎 */}
            <div className="confidence-item">

              <div
                className="label"
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--primary)',
                }}
              >
                <span>
                  正常輪胎
                </span>

                <span>
                  {(classification.good_probability * 100).toFixed(2)}%
                </span>
              </div>

              <div
                className="confidence-bar"
                style={{
                  height: '7px',
                }}
              >
                <span
                  style={{
                    width: `${
                      classification.good_probability * 100
                    }%`,
                  }}
                />
              </div>

            </div>

          </div>

          {/* ==================================================
              Model Ensemble
          ================================================== */}
          <div className="model-section">

            <div
              className="model-title"
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--primary)',
              }}
            >
              Model Ensemble
            </div>

            <div
              className="model-row"
              style={{
                fontSize: '14px',
                color: '#8BEFFF',
              }}
            >
              <span>
                ResNet18：
              </span>

              <span>
                44%
              </span>
            </div>

            <div
              className="model-row"
              style={{
                fontSize: '14px',
                color: '#8BEFFF',
              }}
            >
              <span>
                ViT-B/16：
              </span>

              <span>
                56%
              </span>
            </div>

            {/* ==================================================
                查看模型詳細資訊
            ================================================== */}
            <details className="model-details">

              <summary
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: 'var(--primary)',
                }}
              >
                查看模型詳細資訊
              </summary>

              <div className="model-details-content">

                <div
                  className="detail-title"
                  style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    marginBottom: '10px',
                    color: '#8BEFFF',
                  }}
                >
                  Model Performance
                </div>

                <div
                  className="detail-performance-row"
                  style={{
                    fontSize: '14px',
                    color: '#8BEFFF',
                  }}
                >
                  <span>
                    ResNet18 Fine-tuning：
                  </span>

                  <span>
                    90.42%
                  </span>
                </div>

                <div
                  className="detail-performance-row"
                  style={{
                    fontSize: '14px',
                    color: '#8BEFFF'
                  }}
                >
                  <span>
                    ViT-B/16 Fine-tuning：
                  </span>

                  <span>
                    89.74%
                  </span>
                </div>

                <div
                  className="detail-performance-row"
                  style={{
                    fontSize: '14px',
                    color: '#8BEFFF'
                  }}
                >
                  <span>
                    Ensemble：
                  </span>

                  <span>
                    93.25%
                  </span>
                </div>

              </div>

            </details>

          </div>

          {/* ==================================================
              安全狀態
              字體放大 2 倍
          ================================================== */}
          <div
            className={`status-pill ${
              classification.is_safe
                ? 'safe'
                : 'warning'
            }`}
            style={{
              fontSize: '24px',
              fontWeight: '700',
              padding: '12px 18px',
              lineHeight: '1.4',
            }}
          >
            {classification.is_safe
              ? '✓ 輪胎狀態：安全'
              : '⚠ 輪胎狀態：不安全'}
          </div>

          {/* ==================================================
              不安全提示
              字體放大 2 倍
          ================================================== */}
          {!classification.is_safe && (
            <div
              className="alert warn"
              style={{
                fontSize: '21px',
                fontWeight: '600',
                lineHeight: '1.6',
                padding: '12px 16px',
              }}
            >
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