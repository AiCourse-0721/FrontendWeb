import { useEffect, useRef, useState } from 'react'
import BackgroundFX from './components/BackgroundFX.jsx'
import Header from './components/Header.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import DetectPanel from './components/DetectPanel.jsx'
import RulPanel from './components/RulPanel.jsx'
import StreamPanel from './components/StreamPanel.jsx'

const MODES = [
  { id: 'detect', label: '輪胎影像偵測', icon: '📷' },
  { id: 'live', label: '即時影像辨識', icon: '🎥' }
]

const DAY_START_HOUR = 6
const DAY_END_HOUR = 18
const THEME_CHECK_INTERVAL_MS = 60000

function currentTheme() {
  const hour = new Date().getHours()
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR ? 'light' : 'dark'
}

export default function App() {
  const [mode, setMode] = useState('detect')
  const [detection, setDetection] = useState(null)
  const [theme, setTheme] = useState(currentTheme)
  const autoThemeRef = useRef(true)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const timer = setInterval(() => {
      if (autoThemeRef.current) setTheme(currentTheme())
    }, THEME_CHECK_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  function toggleTheme() {
    autoThemeRef.current = false
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  function switchMode(next) {
    if (next === mode) return
    setMode(next)
    setDetection(null)
  }

  return (
    <>
      <BackgroundFX />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <div className="app-shell">
        <Header />

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
