// pages/AnalyzePage.jsx — X-ray analysis subpage

import { useState, useCallback } from 'react'
import UploadCard  from '../components/UploadCard'
import ResultsCard from '../components/ResultsCard'
import Footer      from '../components/Footer'

const API_URL = 'http://localhost:8000'

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [dragging,     setDragging]     = useState(false)
  const [showResults,  setShowResults]  = useState(false)

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

  const handleDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true) }, [])
  const handleDragLeave = useCallback(() => { setDragging(false) }, [])
  const handleDrop      = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFileSelect(e.dataTransfer.files[0])
  }, [handleFileSelect])

  const handleRemove = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setShowResults(false)
  }, [])

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
    <div className="analyze-page">
      <div className="analyze-hero">
        <div className="analyze-badge">AI Analysis</div>
        <h1 className="analyze-title">
          X-ray <span className="gradient-text">Osteoporosis Screening</span>
        </h1>
        <p className="analyze-desc">
          Upload a lumbar spine X-ray to receive an instant AI classification
          with clinical confidence scores and recommendations.
        </p>
      </div>

      <div className="main-content">
        <div className="content-grid">
          <UploadCard
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            dragging={dragging}
            loading={loading}
            onFileSelect={handleFileSelect}
            onRemove={handleRemove}
            onAnalyze={handleAnalyze}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
          <ResultsCard
            result={result}
            error={error}
            showResults={showResults}
          />
        </div>
      </div>

      <Footer />
    </div>
  )
}
