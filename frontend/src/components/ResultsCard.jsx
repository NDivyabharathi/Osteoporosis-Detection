// components/ResultsCard.jsx — Prediction results, score bars, preprocessed image, and suggestions

import Suggestions from './Suggestions'

function ScoreBar({ label, value, color }) {
  return (
    <div className="score-item">
      <div className="score-label-row">
        <div className="score-label-group">
          <span className={`score-dot ${color}`}></span>
          <span className="score-label">{label}</span>
        </div>
        <span className={`score-value ${color}`}>{value}%</span>
      </div>
      <div className="score-bar-track">
        <div className={`score-bar-fill ${color}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  )
}

export default function ResultsCard({ result, error, showResults }) {
  const isNormal = result?.prediction?.class === 'Normal'

  return (
    <div className="card card-results">
      {/* Card Header */}
      <div className="card-header">
        <div className="card-icon results-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        </div>
        <div>
          <div className="card-title">Analysis Results</div>
          <div className="card-subtitle">Classification output</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {showResults && result?.success ? (
        <div className="result-section">

          {/* Prediction Badge */}
          <div className={`prediction-card ${isNormal ? 'normal' : 'osteoporosis'}`}>
            <div className="prediction-icon-large">
              {isNormal ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            <div className="prediction-text">
              <div className="prediction-label">Diagnosis</div>
              <div className="prediction-class">{result.prediction.class}</div>
            </div>
            <div className="prediction-confidence">{result.prediction.confidence}%</div>
          </div>

          {/* Score Bars */}
          <div className="scores-container">
            <ScoreBar label="Normal" value={result.prediction.normal_score} color="green" />
            <ScoreBar label="Osteoporosis" value={result.prediction.osteoporosis_score} color="red" />
          </div>

          {/* Preprocessed Image */}
          {result.preprocessed_image && (
            <div className="preprocessed-section">
              <div className="preprocessed-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
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

          {/* Clinical Suggestions */}
          <Suggestions predictionClass={result.prediction.class} />

        </div>
      ) : (
        !error && (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="empty-svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="empty-text">Awaiting Analysis</div>
            <div className="empty-hint">Upload an X-ray image and click Analyze to get started</div>
          </div>
        )
      )}
    </div>
  )
}
