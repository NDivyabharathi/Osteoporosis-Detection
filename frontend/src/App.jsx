// App.jsx — Root with React Router. Manages API status and shared layout.

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import Header      from './components/Header'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import PatientPage from './pages/PatientPage'

const API_URL = 'http://localhost:8000'

export default function App() {
  const [apiOnline, setApiOnline] = useState(false)

  // Check API health on mount
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiOnline(data.model_ready))
      .catch(() => setApiOnline(false))
  }, [])

  return (
    <BrowserRouter>
      {/* Animated Background (global) */}
      <div className="bg-effects">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Sticky Header (shared across all pages) */}
      <Header apiOnline={apiOnline} />

      {/* Page Routes */}
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/patient" element={<PatientPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
      </Routes>
    </BrowserRouter>
  )
}
