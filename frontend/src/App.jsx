import { useState, useRef, useCallback, useEffect } from 'react'
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
  const [showResults, setShowResults] = useState(false)
  const fileInputRef = useRef(null)

  // Check API health on mount
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiOnline(data.model_ready))
      .catch(() => setApiOnline(false))
  }, [])

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
    setShowResults(false)
  }, [])

  // Drag & drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    },
    [handleFileSelect]
  )

  // Remove selected image
  const handleRemove = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setShowResults(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Send image to API for prediction
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    setResult(null)
    setShowResults(false)

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
      setShowResults(true)
    } catch (err) {
      setError(err.message || 'Failed to connect to the API server.')
    } finally {
      setLoading(false)
    }
  }, [selectedFile])

  return (
    <div className="app">
      {/* ── Animated Background ── */}
      <div className="bg-effects">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="url(#iconGrad)"
              />
              <defs>
                <linearGradient id="iconGrad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="header-title">OsteoAI</div>
            <div className="header-subtitle">
              Dual-Branch Deep Learning Analysis
            </div>
          </div>
        </div>
        <nav className="header-nav">
          <div className="nav-chip">
            <span className="chip-dot blue"></span>
            MobileNetV4
          </div>
          <div className="nav-chip">
            <span className="chip-dot purple"></span>
            ViT
          </div>
          <div className={`header-status ${apiOnline ? 'online' : ''}`}>
            <div
              className={`status-dot ${apiOnline ? '' : 'offline'}`}
            ></div>
            {apiOnline ? 'Model Ready' : 'API Offline'}
          </div>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">AI-Powered Diagnostics</div>
          <h1 className="hero-title">
            Lumbar Spine
            <br />
            <span className="gradient-text">Osteoporosis Detection</span>
          </h1>
          <p className="hero-desc">
            Upload a lumbar spine X-ray image for instant AI analysis using our
            dual-branch architecture combining local bone texture features with
            global structural pattern recognition.
          </p>
          <div className="hero-stats">
            
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="main-content" id="analyze">
        <div className="section-header">
          <h2 className="section-title">X-ray Analysis</h2>
          <p className="section-desc">
            Upload your lumbar spine X-ray for instant classification
          </p>
        </div>

        <div className="content-grid">
          {/* ── Left Column: Upload ── */}
          <div className="card card-upload">
            <div className="card-header">
              <div className="card-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <div>
                <div className="card-title">Upload Image</div>
                <div className="card-subtitle">
                  Drag & drop or click to browse
                </div>
              </div>
            </div>

            {!previewUrl ? (
              <div
                className={`upload-zone ${dragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-icon-wrapper">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="upload-svg"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="upload-text">
                  Drop your X-ray image here
                </div>
                <div className="upload-hint">
                  Supports JPG, PNG, BMP, TIFF
                </div>
                <div className="upload-btn-small">Browse Files</div>
              </div>
            ) : (
              <div className="upload-zone has-image">
                <div className="preview-container">
                  <img
                    src={previewUrl}
                    alt="Uploaded X-ray"
                    className="preview-image"
                  />
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove()
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <div className="image-info">
                    <span className="image-name">{selectedFile?.name}</span>
                    <span className="image-size">
                      {(selectedFile?.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
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
                  Analyzing X-ray...
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Analyze X-ray
                </>
              )}
            </button>
          </div>

          {/* ── Right Column: Results ── */}
          <div className="card card-results">
            <div className="card-header">
              <div className="card-icon results-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              </div>
              <div>
                <div className="card-title">Analysis Results</div>
                <div className="card-subtitle">Classification output</div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {showResults && result?.success ? (
              <div className="result-section">
                {/* Prediction Badge */}
                <div
                  className={`prediction-card ${
                    result.prediction.class === 'Normal'
                      ? 'normal'
                      : 'osteoporosis'
                  }`}
                >
                  <div className="prediction-icon-large">
                    {result.prediction.class === 'Normal' ? (
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    ) : (
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    )}
                  </div>
                  <div className="prediction-text">
                    <div className="prediction-label">Diagnosis</div>
                    <div className="prediction-class">
                      {result.prediction.class}
                    </div>
                  </div>
                  <div className="prediction-confidence">
                    {result.prediction.confidence}%
                  </div>
                </div>

                {/* Score Bars */}
                <div className="scores-container">
                  <div className="score-item">
                    <div className="score-label-row">
                      <div className="score-label-group">
                        <span className="score-dot green"></span>
                        <span className="score-label">Normal</span>
                      </div>
                      <span className="score-value green">
                        {result.prediction.normal_score}%
                      </span>
                    </div>
                    <div className="score-bar-track">
                      <div
                        className="score-bar-fill green"
                        style={{
                          width: `${result.prediction.normal_score}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="score-item">
                    <div className="score-label-row">
                      <div className="score-label-group">
                        <span className="score-dot red"></span>
                        <span className="score-label">Osteoporosis</span>
                      </div>
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
                    <div className="preprocessed-header">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Preprocessed (CLAHE + Denoised)</span>
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
                  <div className="empty-icon-wrapper">
                    <svg
                      width="56"
                      height="56"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="empty-svg"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="empty-text">Awaiting Analysis</div>
                  <div className="empty-hint">
                    Upload an X-ray image and click Analyze to get started
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ── Pipeline Section ── */}
        <div className="pipeline-section">
          <h3 className="pipeline-title">Analysis Pipeline</h3>
          <div className="pipeline-grid">
            <div className="pipeline-step">
              <div className="pipeline-num">01</div>
              <div className="pipeline-icon-box">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h4>CLAHE Enhancement</h4>
              <p>Adaptive contrast enhancement on the luminance channel</p>
            </div>
            <div className="pipeline-connector">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="pipeline-step">
              <div className="pipeline-num">02</div>
              <div className="pipeline-icon-box">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h4>MobileNetV4</h4>
              <p>Local bone texture feature extraction</p>
            </div>
            <div className="pipeline-connector">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="pipeline-step">
              <div className="pipeline-num">03</div>
              <div className="pipeline-icon-box">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <h4>Vision Transformer</h4>
              <p>Global structural pattern recognition</p>
            </div>
            <div className="pipeline-connector">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="pipeline-step">
              <div className="pipeline-num">04</div>
              <div className="pipeline-icon-box">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h4>Fusion & Classify</h4>
              <p>Combined prediction with confidence score</p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">OsteoAI</div>
          <div className="footer-text">
            Dual-Branch Architecture:{' '}
            <span className="footer-highlight">MobileNetV4</span> +{' '}
            <span className="footer-highlight">ViT</span> | For research
            purposes only
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
