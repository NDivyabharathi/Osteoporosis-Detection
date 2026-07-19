// components/Suggestions.jsx — Clinical recommendations based on prediction

const NORMAL_SUGGESTIONS = [
  {
    color: 'green',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    title: 'Maintain Bone Health',
    desc: 'Continue regular weight-bearing exercise (30 min/day) to preserve bone density.',
  },
  {
    color: 'blue',
    icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    title: 'Routine Screening',
    desc: 'Schedule a DEXA bone density scan every 2 years, especially after age 50.',
  },
  {
    color: 'teal',
    icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    title: 'Diet & Nutrition',
    desc: 'Maintain adequate Calcium (1000 mg/day) and Vitamin D (600–800 IU/day) intake.',
  },
  {
    color: 'purple',
    icon: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    title: 'Lifestyle',
    desc: 'Avoid smoking and excessive alcohol; both accelerate bone density loss.',
  },
]

const OSTEO_SUGGESTIONS = [
  {
    color: 'red',
    icon: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    title: 'Consult a Specialist',
    desc: 'See an orthopedic surgeon or endocrinologist immediately for a clinical diagnosis and treatment plan.',
  },
  {
    color: 'amber',
    icon: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>,
    title: 'DEXA Scan Required',
    desc: 'A DEXA (bone densitometry) scan is required to measure T-score and confirm osteoporosis severity.',
  },
  {
    color: 'blue',
    icon: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>,
    title: 'Medication Review',
    desc: 'Ask your doctor about bisphosphonates (e.g., alendronate) or other anti-resorptive therapies.',
  },
  {
    color: 'teal',
    icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    title: 'Fall Prevention',
    desc: 'Remove trip hazards at home, use assistive devices, and avoid high-impact activities to prevent fractures.',
  },
]

function SuggestionItem({ color, icon, title, desc }) {
  return (
    <div className="suggestion-item">
      <div className={`suggestion-icon suggestion-${color}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {icon}
        </svg>
      </div>
      <div>
        <div className="suggestion-title">{title}</div>
        <div className="suggestion-desc">{desc}</div>
      </div>
    </div>
  )
}

export default function Suggestions({ predictionClass }) {
  const isNormal = predictionClass === 'Normal'
  const suggestions = isNormal ? NORMAL_SUGGESTIONS : OSTEO_SUGGESTIONS

  return (
    <div className={`suggestions-panel ${isNormal ? 'suggestions-normal' : 'suggestions-osteo'}`}>
      <div className="suggestions-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <span>Clinical Recommendations</span>
      </div>

      <div className="suggestions-grid">
        {suggestions.map((s) => (
          <SuggestionItem key={s.title} {...s} />
        ))}
      </div>

      <div className="suggestions-disclaimer">
        This AI analysis is for screening purposes only. Always consult a qualified
        medical professional for diagnosis and treatment.
      </div>
    </div>
  )
}
