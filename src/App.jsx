import { useState } from 'react'
import BackgroundFX from './components/BackgroundFX.jsx'
import Header from './components/Header.jsx'
import SettingsBar from './components/SettingsBar.jsx'
import DetectPanel from './components/DetectPanel.jsx'
import RulPanel from './components/RulPanel.jsx'
import StreamPanel from './components/StreamPanel.jsx'

const MODES = [
  { id: 'detect', label: '輪胎影像偵測', icon: '📷' },
  { id: 'live', label: '即時影像辨識', icon: '🎥' }
]

export default function App() {
  const [mode, setMode] = useState('detect')
  const [detection, setDetection] = useState(null)

  function switchMode(next) {
    if (next === mode) return
    setMode(next)
    setDetection(null)
  }

  return (
    <>
      <BackgroundFX />
      <div className="app-shell">
        <Header />
        <SettingsBar />

        <nav className="mode-toggle">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={mode === m.id ? 'active' : ''}
              onClick={() => switchMode(m.id)}
            >
              <span className="icon">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </nav>

        <div className={`panel-grid ${detection ? 'two-col' : ''}`}>
          {mode === 'detect' && <DetectPanel onResult={setDetection} />}
          {mode === 'live' && <StreamPanel onResult={setDetection} />}
          {detection && <RulPanel detection={detection} />}
        </div>

        <footer className="app-footer">TireGuard AI · React Neural Interface · YOLO + CNN/ViT Ensemble + RUL</footer>
      </div>
    </>
  )
}
