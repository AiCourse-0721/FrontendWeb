import { useEffect, useState } from 'react'
import { predictTireRul } from '../api.js'

const DEFAULTS = {
  current_tread_depth: 5.019628,
  expected_tyre_life: 82318,
  kilometers_driven: 26858
}

const DEBOUNCE_MS = 500

export default function RulPanel({ detection }) {
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const blockedClass =
    detection &&
    (detection.class === 'BAD' || detection.class === 'BALD')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (blockedClass) return

    const depth = Number(form.current_tread_depth)
    const life = Number(form.expected_tyre_life)
    const km = Number(form.kilometers_driven)

    if (!(depth > 0) || !(life > 0) || !(km > 0)) return

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await predictTireRul({
          current_tread_depth: depth,
          expected_tyre_life: life,
          kilometers_driven: km
        })

        setResult(data)
      } catch (err) {
        setError(err.message || '預測失敗')
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [
    form.current_tread_depth,
    form.expected_tyre_life,
    form.kilometers_driven,
    blockedClass
  ])

  return (
    <section className="card">

      {/* =========================
          標題
          保持原本樣式，不修改顏色
      ========================= */}
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🔧</span> 剩餘壽命權重分析
        </span>
      </div>

      {blockedClass ? (

        /* =========================
            輪胎異常時
            警告文字 1.5 倍
        ========================= */
        <div
          className="alert warn"
          style={{
            fontSize: '21px',
            fontWeight: '600',
            lineHeight: '1.6',
          }}
        >
          ⚠ 輪胎檢測為
          {detection.class === 'BAD' ? '故障' : '磨平'}
          ，建議直接更換，不進行壽命預測。
        </div>

      ) : (

        <>
          {/* =========================
              目前胎紋深度
          ========================= */}
          <div className="field">
            <label>目前胎紋深度（mm）</label>

            <input
              type="number"
              step="0.000001"
              min="0.01"
              value={form.current_tread_depth}
              onChange={(e) =>
                update(
                  'current_tread_depth',
                  e.target.value
                )
              }
            />

            <span className="helper">
              未輸入時使用預設值 5.019628 mm，建議填入實測值。
            </span>
          </div>

          {/* =========================
              預期輪胎壽命
          ========================= */}
          <div className="field">
            <label>預期輪胎壽命（km）</label>

            <input
              type="number"
              step="1000"
              min="1"
              value={form.expected_tyre_life}
              onChange={(e) =>
                update(
                  'expected_tyre_life',
                  e.target.value
                )
              }
            />
          </div>

          {/* =========================
              目前已行駛里程
          ========================= */}
          <div className="field">
            <label>目前已行駛里程（km）</label>

            <input
              type="number"
              step="1000"
              min="1"
              value={form.kilometers_driven}
              onChange={(e) =>
                update(
                  'kilometers_driven',
                  e.target.value
                )
              }
            />
          </div>

          {/* =========================
              Loading
          ========================= */}
          {loading && (
            <div className="alert info">
              <span className="spinner" />
              預測中…
            </div>
          )}

          {/* =========================
              Error
          ========================= */}
          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {/* =========================
              RUL 預測結果
          ========================= */}
          {result && !loading && (
            <div className="rul-result">

              <div className="value">
                約{' '}
                {Number(
                  result.predicted_rul_km ?? 0
                ).toLocaleString()}
                <small>km</small>
              </div>

              <div className="result-sub">
                以上為 AI 模型估算結果，實際壽命仍需由專業人員檢查確認，變更數值會自動重新預測。
              </div>

            </div>
          )}

        </>

      )}
    </section>
  )
}