// 三分類機率的欄位是 bad/bald/normal_probability，不是 good_probability
const PROBABILITY_ROWS = [
  { label: '異常輪胎', key: 'bad_probability' },
  { label: '胎紋磨平', key: 'bald_probability' },
  { label: '正常輪胎', key: 'normal_probability' },
]

const PROBABILITY_LABEL_STYLE = {
  fontSize: '15px',
  fontWeight: '600',
  color: 'var(--primary)',
}

const SUB_TEXT_STYLE = {
  color: 'var(--primary-soft)',
}

export default function ClassificationResult({ classification }) {
  return (
    <div className="result-block">
      {/* 最終判定 */}
      <div
        className="result-class"
        style={{
          fontSize: '28px',
          fontWeight: '700',
        }}
      >
        {classification.display_name}
      </div>

      {/* Ensemble 信心度 */}
      <div
        className="result-sub"
        style={{
          fontSize: '15px',
          ...SUB_TEXT_STYLE,
          fontWeight: '600',
        }}
      >
        Ensemble 信心度：
        {(classification.ensemble_confidence * 100).toFixed(2)}%
      </div>

      {/* 三分類機率 */}
      <div
        className="confidence-row"
        style={{
          gap: '12px',
          marginTop: '18px',
        }}
      >
        {PROBABILITY_ROWS.map(({ label, key }) => {
          const value = classification[key] * 100
          return (
            <div className="confidence-item" key={key}>
              <div className="label" style={PROBABILITY_LABEL_STYLE}>
                <span>{label}</span>
                <span>{value.toFixed(2)}%</span>
              </div>

              <div className="confidence-bar" style={{ height: '7px' }}>
                <span style={{ width: `${value}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Model Ensemble：靜態展示用數字，非後端即時資料，不隨辨識結果變動 */}
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

        <div className="model-row" style={{ fontSize: '14px', ...SUB_TEXT_STYLE }}>
          <span>ResNet18：</span>
          <span>44%</span>
        </div>

        <div className="model-row" style={{ fontSize: '14px', ...SUB_TEXT_STYLE }}>
          <span>ViT-B/16：</span>
          <span>56%</span>
        </div>

        <details className="model-details">
          <summary
            style={{
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              color: 'var(--primary)',
            }}
          >
            查看模型權重分配
          </summary>

          <div className="model-details-content">
            <div
              className="detail-title"
              style={{
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '10px',
                ...SUB_TEXT_STYLE,
              }}
            >
              Model Performance
            </div>

            <div className="detail-performance-row" style={{ fontSize: '14px', ...SUB_TEXT_STYLE }}>
              <span>ResNet18 Fine-tuning：</span>
              <span>90.42%</span>
            </div>

            <div className="detail-performance-row" style={{ fontSize: '14px', ...SUB_TEXT_STYLE }}>
              <span>ViT-B/16 Fine-tuning：</span>
              <span>89.74%</span>
            </div>

            <div className="detail-performance-row" style={{ fontSize: '14px', ...SUB_TEXT_STYLE }}>
              <span>Ensemble：</span>
              <span>93.25%</span>
            </div>
          </div>
        </details>
      </div>

      {/* 安全狀態 */}
      <div
        className={`status-pill ${classification.is_safe ? 'safe' : 'warning'}`}
        style={{
          fontSize: '24px',
          fontWeight: '700',
          padding: '12px 18px',
          lineHeight: '1.4',
        }}
      >
        {classification.is_safe ? '✓ 輪胎狀態：安全' : '⚠ 輪胎狀態：不安全'}
      </div>

      {/* 不安全提示 */}
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
  )
}
