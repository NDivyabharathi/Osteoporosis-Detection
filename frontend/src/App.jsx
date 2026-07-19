import { useState, useRef, useCallback } from 'react'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)
  const fileInputRef = useRef(null)

  // Check API health on mount
  useState(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiOnline(data.model_ready))
      .catch(() => setApiOnline(false))
  })

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, BMP, TIFF)')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }, [])

  // Drag & drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }, [handleFileSelect])

  // Remove selected image
  const handleRemove = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Send image to API for prediction
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to connect to the API server.')
    } finally {
      setLoading(false)
    }
  }, [selectedFile])

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">🦴</div>
          <div>
            <div className="header-title">Osteoporosis Detection</div>
            <div className="header-subtitle">MobileNetV4 + Vision Transformer</div>
          </div>
        </div>
        <div className="header-status">
          <div className={`status-dot ${apiOnline ? '' : 'offline'}`}></div>
          {apiOnline ? 'Model Ready' : 'API Offline'}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main-content">
        <div className="content-grid">
          {/* ── Left Column: Upload ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon">📤</div>
              <div className="card-title">Upload X-ray Image</div>
            </div>

            {!previewUrl ? (
              <div
                className={`upload-zone ${dragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-icon">🩻</div>
                <div className="upload-text">
                  Drag & drop your X-ray image here
                </div>
                <div className="upload-hint">
                  or click to browse — Supports JPG, PNG, BMP, TIFF
                </div>
              </div>
            ) : (
              <div className="upload-zone has-image">
                <div className="preview-container">
                  <img
                    src={previewUrl}
                    alt="Uploaded X-ray"
                    className="preview-image"
                  />
                  <button className="remove-btn" onClick={handleRemove}>
                    ✕
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            <button
              className={`analyze-btn ${loading ? 'loading' : ''}`}
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing...
                </>
              ) : (
                <>🔬 Analyze X-ray</>
              )}
            </button>

            {/* How it works */}
            <div className="info-panel">
              <h4>How It Works</h4>
              <ul className="info-steps">
                <li>
                  <span className="step-num">1</span>
                  Image enhanced with CLAHE contrast & Gaussian denoising
                </li>
                <li>
                  <span className="step-num">2</span>
                  MobileNetV4 extracts local bone texture features
                </li>
                <li>
                  <span className="step-num">3</span>
                  Vision Transformer captures global structural patterns
                </li>
                <li>
                  <span className="step-num">4</span>
                  Dual-branch fusion produces the final prediction
                </li>
              </ul>
            </div>
          </div>

          {/* ── Right Column: Results ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon">📊</div>
              <div className="card-title">Analysis Results</div>
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {result && result.success ? (
              <div className="result-section">
                {/* Prediction Badge */}
                <div
                  className={`prediction-badge ${
                    result.prediction.class === 'Normal'
                      ? 'normal'
                      : 'osteoporosis'
                  }`}
                >
                  <span className="prediction-badge-icon">
                    {result.prediction.class === 'Normal' ? '✅' : '⚠️'}
                  </span>
                  {result.prediction.class}
                </div>

                {/* Confidence Scores */}
                <div className="scores-container">
                  <div className="score-item">
                    <div className="score-label-row">
                      <span className="score-label">Normal</span>
                      <span className="score-value green">
                        {result.prediction.normal_score}%
                      </span>
                    </div>
                    <div className="score-bar-track">
                      <div
                        className="score-bar-fill green"
                        style={{ width: `${result.prediction.normal_score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="score-item">
                    <div className="score-label-row">
                      <span className="score-label">Osteoporosis</span>
                      <span className="score-value red">
                        {result.prediction.osteoporosis_score}%
                      </span>
                    </div>
                    <div className="score-bar-track">
                      <div
                        className="score-bar-fill red"
                        style={{
                          width: `${result.prediction.osteoporosis_score}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Preprocessed Image */}
                {result.preprocessed_image && (
                  <div className="preprocessed-section">
                    <div className="preprocessed-title">
                      Preprocessed Image (CLAHE + Denoised)
                    </div>
                    <img
                      src={`data:image/png;base64,${result.preprocessed_image}`}
                      alt="Preprocessed X-ray"
                      className="preprocessed-image"
                    />
                  </div>
                )}
              </div>
            ) : (
              !error && (
                <div className="empty-state">
                  <div className="empty-icon">🩻</div>
                  <div className="empty-text">No results yet</div>
                  <div className="empty-hint">
                    Upload an X-ray image and click Analyze
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-text">
          Dual-Branch Architecture:{' '}
          <span className="footer-highlight">MobileNetV4</span> (local texture) +{' '}
          <span className="footer-highlight">ViT</span> (global structure)
          <br />
          For research and educational purposes only. Not a medical diagnostic
          tool.
        </div>
      </footer>
    </div>
  )
}

export default App
