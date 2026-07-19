// components/Pipeline.jsx — 4-step analysis pipeline visualization

const STEPS = [
  {
    num: '01',
    title: 'CLAHE Enhancement',
    desc: 'Adaptive contrast enhancement on the luminance channel',
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
  },
  {
    num: '02',
    title: 'MobileNetV4',
    desc: 'Local bone texture feature extraction',
    icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  },
  {
    num: '03',
    title: 'Vision Transformer',
    desc: 'Global structural pattern recognition',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </>
    ),
  },
  {
    num: '04',
    title: 'Fusion & Classify',
    desc: 'Combined prediction with confidence score',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  },
]

const ChevronRight = () => (
  <div className="pipeline-connector">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </div>
)

export default function Pipeline() {
  return (
    <div className="pipeline-section">
      <h3 className="pipeline-title">Analysis Pipeline</h3>
      <div className="pipeline-grid">
        {STEPS.map((step, i) => (
          <>
            <div key={step.num} className="pipeline-step">
              <div className="pipeline-num">{step.num}</div>
              <div className="pipeline-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {step.icon}
                </svg>
              </div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
            {i < STEPS.length - 1 && <ChevronRight key={`connector-${i}`} />}
          </>
        ))}
      </div>
    </div>
  )
}
