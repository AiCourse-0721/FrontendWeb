import { useEffect, useState } from 'react'
import { predictTireRul } from '../api.js'

const TREAD_DEPTH_MIN = 0
const TREAD_DEPTH_MAX = 8
const EXPECTED_LIFE_MIN = 50000
const EXPECTED_LIFE_MAX = 80000

const DEFAULTS = {
  current_tread_depth: 5.019628,
  expected_tyre_life: 80000,
  kilometers_driven: 26858
}

const DEBOUNCE_MS = 500

// 三個欄位的合理範圍檢查；回傳 null 代表通過，否則回傳要顯示的錯誤文字
function validateForm({ current_tread_depth, expected_tyre_life, kilometers_driven }) {
  const depth = Number(current_tread_depth)
  const life = Number(expected_tyre_life)
  const km = Number(kilometers_driven)

  if (!Number.isFinite(depth) || depth < TREAD_DEPTH_MIN || depth > TREAD_DEPTH_MAX) {
    return `目前胎紋深度須介於 ${TREAD_DEPTH_MIN}～${TREAD_DEPTH_MAX} mm 之間`
  }
  if (!Number.isFinite(life) || life < EXPECTED_LIFE_MIN || life > EXPECTED_LIFE_MAX) {
    return `預期輪胎壽命須介於 ${EXPECTED_LIFE_MIN.toLocaleString()}～${EXPECTED_LIFE_MAX.toLocaleString()} km 之間`
  }
  if (!Number.isFinite(km) || km < 0 || km > life) {
    return '目前已行駛里程不可小於 0，也不可超過預期輪胎壽命'
  }
  return null
}

export default function RulPanel({ detection }) {
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const blockedClass =
    detection &&
    (detection.class === 'BAD' || detection.class === 'BALD')

  const validationError = validateForm(form)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (blockedClass) {
      // 輪胎判定為故障/磨平時，清掉舊的預測結果跟錯誤訊息，避免殘留數字之後又跳出來造成誤會
      setResult(null)
      setError(null)
      return
    }

    if (validationError) {
      setResult(null)
      setError(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await predictTireRul({
          current_tread_depth: Number(form.current_tread_depth),
          expected_tyre_life: Number(form.expected_tyre_life),
          kilometers_driven: Number(form.kilometers_driven)
        })

        setResult(data)
      } catch (err) {
        // 這次請求失敗，把上一次成功的舊結果一併清掉，不然錯誤訊息會跟過期的數字同時顯示
        setResult(null)
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
    blockedClass,
    validationError
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
              step="0.1"
              min={TREAD_DEPTH_MIN}
              max={TREAD_DEPTH_MAX}
              value={form.current_tread_depth}
              onChange={(e) =>
                update(
                  'current_tread_depth',
                  e.target.value
                )
              }
            />

            <span className="helper">
              範圍 {TREAD_DEPTH_MIN}～{TREAD_DEPTH_MAX} mm，未輸入時使用預設值 5.019628 mm，建議填入實測值。
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
              min={EXPECTED_LIFE_MIN}
              max={EXPECTED_LIFE_MAX}
              value={form.expected_tyre_life}
              onChange={(e) =>
                update(
                  'expected_tyre_life',
                  e.target.value
                )
              }
            />

            <span className="helper">
              範圍 {EXPECTED_LIFE_MIN.toLocaleString()}～{EXPECTED_LIFE_MAX.toLocaleString()} km
            </span>
          </div>

          {/* =========================
              目前已行駛里程
          ========================= */}
          <div className="field">
            <label>目前已行駛里程（km）</label>

            <input
              type="number"
              step="1000"
              min={0}
              max={form.expected_tyre_life}
              value={form.kilometers_driven}
              onChange={(e) =>
                update(
                  'kilometers_driven',
                  e.target.value
                )
              }
            />

            <span className="helper">
              不可小於 0，也不可超過上方填寫的預期輪胎壽命
            </span>
          </div>

          {/* =========================
              驗證錯誤
          ========================= */}
          {validationError && (
            <div className="alert warn">
              {validationError}
            </div>
          )}

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
