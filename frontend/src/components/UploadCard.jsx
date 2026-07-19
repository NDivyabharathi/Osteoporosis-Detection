// components/UploadCard.jsx — Drag-and-drop X-ray upload area

import { useRef, useCallback } from 'react'

export default function UploadCard({
  selectedFile,
  previewUrl,
  dragging,
  loading,
  onFileSelect,
  onRemove,
  onAnalyze,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const fileInputRef = useRef(null)

  const handleInputChange = useCallback(
    (e) => onFileSelect(e.target.files[0]),
    [onFileSelect]
  )

  return (
    <div className="card card-upload">
      {/* Card Header */}
      <div className="card-header">
        <div className="card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </div>
        <div>
          <div className="card-title">Upload Image</div>
          <div className="card-subtitle">Drag &amp; drop or click to browse</div>
        </div>
      </div>

      {/* Upload Zone */}
      {!previewUrl ? (
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="upload-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="upload-svg">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="upload-text">Drop your X-ray image here</div>
          <div className="upload-hint">Supports JPG, PNG, BMP, TIFF</div>
          <div className="upload-btn-small">Browse Files</div>
        </div>
      ) : (
        <div className="upload-zone has-image">
          <div className="preview-container">
            <img src={previewUrl} alt="Uploaded X-ray" className="preview-image" />
            <button
              className="remove-btn"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="image-info">
              <span className="image-name">{selectedFile?.name}</span>
              <span className="image-size">{(selectedFile?.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Analyze Button */}
      <button
        className={`analyze-btn ${loading ? 'loading' : ''}`}
        onClick={onAnalyze}
        disabled={!selectedFile || loading}
      >
        {loading ? (
          <>
            <div className="spinner"></div>
            Analyzing X-ray...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Analyze X-ray
          </>
        )}
      </button>
    </div>
  )
}
