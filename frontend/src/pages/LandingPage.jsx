// pages/LandingPage.jsx — Beautiful landing page

import { useNavigate } from 'react-router-dom'
import Pipeline from '../components/Pipeline'
import Footer from '../components/Footer'

const FEATURES = [
  {
    color: 'blue',
    title: 'Dual-Branch Architecture',
    desc: 'MobileNetV4 extracts local bone texture features while Vision Transformer captures global structural patterns for superior accuracy.',
    icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  },
  {
    color: 'teal',
    title: 'CLAHE Preprocessing',
    desc: 'Advanced Contrast Limited Adaptive Histogram Equalization combined with Gaussian denoising enhances X-ray clarity.',
    icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
  },
  {
    color: 'purple',
    title: '99.68% Accuracy',
    desc: 'Trained on 2,059 lumbar spine X-ray images with ROC-AUC of 1.0, achieving near-perfect classification performance.',
    icon: <path d="M18 20V10M12 20V4M6 20v-6" />,
  },
  {
    color: 'green',
    title: 'Instant Results',
    desc: 'Upload any lumbar spine X-ray and receive a comprehensive diagnosis report with confidence scores in seconds.',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  },
  {
    color: 'amber',
    title: 'Clinical Suggestions',
    desc: 'Each prediction comes with tailored clinical recommendations — from lifestyle changes to specialist referrals.',
    icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>,
  },
  {
    color: 'red',
    title: 'Open Architecture',
    desc: 'Built with PyTorch, FastAPI and React. Fully modular codebase ready for research, extension, and deployment.',
    icon: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>,
  },
]

const STATS = [
  { value: '99.68%', label: 'Test Accuracy' },
  { value: '100%',   label: 'ROC-AUC Score' },
  { value: '2,059',  label: 'Training Images' },
  { value: '24.8M',  label: 'Parameters' },
]

function FeatureCard({ color, title, desc, icon }) {
  return (
    <div className={`feature-card feature-${color}`}>
      <div className={`feature-icon-box feature-icon-${color}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {icon}
        </svg>
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <span className="badge-dot"></span>
            AI-Powered Medical Imaging
          </div>

          <h1 className="landing-title">
            Detect Osteoporosis
            <br />
            <span className="gradient-text">Before It's Too Late</span>
          </h1>

          <p className="landing-desc">
            Upload a lumbar spine X-ray and let our dual-branch deep learning
            model — combining MobileNetV4 and Vision Transformer — deliver
            instant, high-accuracy osteoporosis screening with clinical recommendations.
          </p>

          <div className="landing-cta">
            <button className="cta-primary" onClick={() => navigate('/analyze')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Start Analysis
            </button>
            <button
              className="cta-secondary"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Stats Strip */}
          <div className="landing-stats">
            {STATS.map((s, i) => (
              <div key={s.label} style={{ display: 'contents' }}>
                <div className="landing-stat">
                  <div className="landing-stat-value">{s.value}</div>
                  <div className="landing-stat-label">{s.label}</div>
                </div>
                {i < STATS.length - 1 && <div className="stat-divider"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative X-ray visual */}
        <div className="hero-visual">
          <div className="xray-frame">
            <div className="xray-scanlines"></div>
            <div className="xray-inner">
              <svg viewBox="0 0 200 300" fill="none" className="xray-svg">
                <rect x="70" y="20"  width="60" height="30" rx="8" fill="rgba(96,165,250,0.15)" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5"/>
                <rect x="72" y="60"  width="56" height="28" rx="7" fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.35)" strokeWidth="1.5"/>
                <rect x="74" y="96"  width="52" height="28" rx="7" fill="rgba(96,165,250,0.10)" stroke="rgba(96,165,250,0.3)" strokeWidth="1.5"/>
                <rect x="76" y="132" width="48" height="28" rx="6" fill="rgba(96,165,250,0.08)" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5"/>
                <rect x="78" y="168" width="44" height="28" rx="6" fill="rgba(96,165,250,0.06)" stroke="rgba(96,165,250,0.2)" strokeWidth="1.5"/>
                <line x1="100" y1="20" x2="100" y2="280" stroke="rgba(6,182,212,0.2)" strokeWidth="1" strokeDasharray="4 4"/>
                <ellipse cx="100" cy="245" rx="50" ry="30" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.15)" strokeWidth="1.5"/>
                <line x1="40" y1="110" x2="160" y2="110" stroke="rgba(6,182,212,0.6)" strokeWidth="1.5">
                  <animate attributeName="y1" values="20;280;20" dur="4s" repeatCount="indefinite"/>
                  <animate attributeName="y2" values="20;280;20" dur="4s" repeatCount="indefinite"/>
                </line>
              </svg>
              <div className="xray-label">L1 – L5 Analysis</div>
              <div className="xray-result-chip normal-chip">Normal Bone Density</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="section-center">
          <div className="section-tag">Why OsteoAI</div>
          <h2 className="features-title">Built for Accuracy. Designed for Clarity.</h2>
          <p className="features-subtitle">
            A complete end-to-end deep learning pipeline for osteoporosis screening,
            from raw X-ray to clinical recommendation.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section className="pipeline-wrapper">
        <div className="section-center">
          <div className="section-tag">How It Works</div>
          <h2 className="features-title">4-Step Analysis Pipeline</h2>
        </div>
        <Pipeline />
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <h2 className="cta-banner-title">Ready to Analyze Your X-ray?</h2>
        <p className="cta-banner-desc">
          Upload a lumbar spine X-ray image and get an instant AI-powered
          osteoporosis screening report.
        </p>
        <button className="cta-primary cta-large" onClick={() => navigate('/analyze')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Go to Analyzer
        </button>
      </section>

      <Footer />
    </div>
  )
}
