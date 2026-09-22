import { useState } from 'react'
import BackgroundFX from './components/BackgroundFX.jsx'
import Header from './components/Header.jsx'
import SettingsBar from './components/SettingsBar.jsx'
import DetectPanel from './components/DetectPanel.jsx'
import RulPanel from './components/RulPanel.jsx'
import StreamPanel from './components/StreamPanel.jsx'

export default function App() {
  const [detection, setDetection] = useState(null)

  return (
    <>
      <BackgroundFX />
      <div className="app-shell">
        <Header />
        <SettingsBar />

        <div className="panel-grid two-col">
          <DetectPanel onResult={setDetection} />
          <RulPanel detection={detection} />
        </div>

        <div className="panel-grid" style={{ marginTop: 24 }}>
          <StreamPanel />
        </div>

        <footer className="app-footer">TireGuard AI · React Neural Interface · YOLO + CNN/ViT Ensemble + RUL</footer>
      </div>
    </>
  )
}
