// pages/LandingPage.jsx — Beautiful landing page

import { useNavigate } from 'react-router-dom'
import Pipeline from '../components/Pipeline'
import Footer from '../components/Footer'



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

          </div>


        </div>

        {/* Doctor + X-ray visual */}
        <div className="hero-visual">
          <div className="doctor-frame">
            <img
              src="/doctor_xray.png"
              alt="Doctor examining lumbar spine X-ray"
              className="doctor-img"
            />
          </div>
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
