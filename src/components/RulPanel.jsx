import { useState } from 'react'
import { predictTireRul } from '../api.js'

const DEFAULTS = {
  current_tread_depth: 5.019628,
  expected_tyre_life: 82318,
  kilometers_driven: 26858
}

export default function RulPanel({ detection }) {
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const blockedClass = detection && (detection.class === 'BAD' || detection.class === 'BALD')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        current_tread_depth: Number(form.current_tread_depth),
        expected_tyre_life: Number(form.expected_tyre_life),
        kilometers_driven: Number(form.kilometers_driven)
      }
      const data = await predictTireRul(payload)
      setResult(data)
    } catch (err) {
      setError(err.message || '預測失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🔧</span> 剩餘壽命權重分析
        </span>
        <span className="card-tag">API 2 · /api/v1/predict-rul</span>
      </div>

      {blockedClass ? (
        <div className="alert warn">
          ⚠ 輪胎檢測為{detection.class === 'BAD' ? '故障' : '磨平'}，建議直接更換，不進行壽命預測。
        </div>
      ) : (
        <>
          <div className="field">
            <label>目前胎紋深度（mm）</label>
            <input
              type="number"
              step="0.000001"
              min="0.01"
              value={form.current_tread_depth}
              onChange={(e) => update('current_tread_depth', e.target.value)}
            />
            <span className="helper">未輸入時使用預設值 5.019628 mm，建議填入實測值。</span>
          </div>

          <div className="field">
            <label>預期輪胎壽命（km）</label>
            <input
              type="number"
              step="1000"
              min="1"
              value={form.expected_tyre_life}
              onChange={(e) => update('expected_tyre_life', e.target.value)}
            />
          </div>

          <div className="field">
            <label>目前已行駛里程（km）</label>
            <input
              type="number"
              step="1000"
              min="1"
              value={form.kilometers_driven}
              onChange={(e) => update('kilometers_driven', e.target.value)}
            />
          </div>

          <button className="btn full" disabled={loading} onClick={handleSubmit} type="button">
            {loading && <span className="spinner" />}
            {loading ? '預測中…' : '送出權重進行預測'}
          </button>

          {error && <div className="alert error">{error}</div>}

          {result && (
            <div className="rul-result">
              <div className="value">
                約 {Number(result.predicted_rul_km ?? 0).toLocaleString()}
                <small>km</small>
              </div>
              <div className="result-sub">以上為 AI 模型估算結果，實際壽命仍需由專業人員檢查確認。</div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
