// components/PatientForm.jsx — Patient details intake form

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const RISK_FACTORS = [
  { id: 'prev_fracture',   label: 'Previous bone fractures' },
  { id: 'family_history',  label: 'Family history of osteoporosis' },
  { id: 'steroid_use',     label: 'Long-term steroid use (>3 months)' },
  { id: 'low_calcium',     label: 'Low calcium / Vitamin D diet' },
  { id: 'smoking',         label: 'Current smoker' },
  { id: 'alcohol',         label: 'Excessive alcohol consumption' },
  { id: 'menopause',       label: 'Early menopause (< 45 years)' },
  { id: 'low_bmi',         label: 'Low BMI (< 19 kg/m²)' },
]

const INITIAL = {
  firstName: '', lastName: '', age: '', dob: '',
  gender: '', email: '', phone: '',
  doctor: '', notes: '', medications: '',
  riskFactors: {},
}

function InputField({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="required-star">*</span>}
      </label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default function PatientForm({ onSubmit }) {
  const navigate = useNavigate()
  const [form, setForm]       = useState(INITIAL)
  const [errors, setErrors]   = useState({})
  const [submitted, setSubmitted] = useState(false)

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const toggleRisk = (id) =>
    setForm((prev) => ({
      ...prev,
      riskFactors: { ...prev.riskFactors, [id]: !prev.riskFactors[id] },
    }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim())  e.lastName  = 'Last name is required'
    if (!form.age || form.age < 1 || form.age > 120) e.age = 'Enter a valid age (1–120)'
    if (!form.gender) e.gender = 'Please select a gender'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setSubmitted(true)
    if (onSubmit) onSubmit(form)
  }

  if (submitted) {
    return (
      <div className="form-success">
        <div className="form-success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="form-success-title">Patient Details Saved</h2>
        <p className="form-success-desc">
          Details for <strong>{form.firstName} {form.lastName}</strong> have been recorded.
          You can now proceed to the X-ray analysis.
        </p>
        <div className="form-success-actions">
          <button className="cta-primary" onClick={() => navigate('/analyze')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Proceed to Analysis
          </button>
          <button className="cta-secondary" onClick={() => { setForm(INITIAL); setSubmitted(false) }}>
            Add Another Patient
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="patient-form" onSubmit={handleSubmit} noValidate>

      {/* ── Personal Information ── */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div className="form-section-title">Personal Information</div>
            <div className="form-section-desc">Basic patient identity details</div>
          </div>
        </div>

        <div className="form-row-2">
          <InputField label="First Name" required error={errors.firstName}>
            <input
              className={`form-input ${errors.firstName ? 'input-error' : ''}`}
              type="text"
              placeholder="e.g. Priya"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
          </InputField>
          <InputField label="Last Name" required error={errors.lastName}>
            <input
              className={`form-input ${errors.lastName ? 'input-error' : ''}`}
              type="text"
              placeholder="e.g. Sharma"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
            />
          </InputField>
        </div>

        <div className="form-row-3">
          <InputField label="Age (years)" required error={errors.age}>
            <input
              className={`form-input ${errors.age ? 'input-error' : ''}`}
              type="number"
              placeholder="e.g. 65"
              min="1" max="120"
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
            />
          </InputField>
          <InputField label="Date of Birth">
            <input
              className="form-input"
              type="date"
              value={form.dob}
              onChange={(e) => set('dob', e.target.value)}
            />
          </InputField>
          <InputField label="Gender" required error={errors.gender}>
            <select
              className={`form-input form-select ${errors.gender ? 'input-error' : ''}`}
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </InputField>
        </div>
      </div>

      {/* ── Contact Information ── */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.91 14a16 16 0 006 6l.41-.41a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div>
            <div className="form-section-title">Contact Information</div>
            <div className="form-section-desc">Optional contact and referral details</div>
          </div>
        </div>

        <div className="form-row-2">
          <InputField label="Email Address" error={errors.email}>
            <input
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              type="email"
              placeholder="patient@email.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </InputField>
          <InputField label="Phone Number">
            <input
              className="form-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </InputField>
        </div>

        <InputField label="Referring Doctor / Physician">
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Dr. Rajesh Kumar, Orthopedics"
            value={form.doctor}
            onChange={(e) => set('doctor', e.target.value)}
          />
        </InputField>
      </div>

      {/* ── Medical History ── */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <div className="form-section-title">Medical History & Risk Factors</div>
            <div className="form-section-desc">Select all that apply to this patient</div>
          </div>
        </div>

        <div className="risk-grid">
          {RISK_FACTORS.map((rf) => (
            <label key={rf.id} className={`risk-checkbox ${form.riskFactors[rf.id] ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={!!form.riskFactors[rf.id]}
                onChange={() => toggleRisk(rf.id)}
              />
              <div className="risk-check-icon">
                {form.riskFactors[rf.id] && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span>{rf.label}</span>
            </label>
          ))}
        </div>

        <InputField label="Current Medications">
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Alendronate, Calcium supplements, Vitamin D3"
            value={form.medications}
            onChange={(e) => set('medications', e.target.value)}
          />
        </InputField>

        <InputField label="Additional Clinical Notes">
          <textarea
            className="form-input form-textarea"
            placeholder="Any other relevant medical history, symptoms, or notes for the radiologist..."
            rows={4}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </InputField>
      </div>

      {/* ── Actions ── */}
      <div className="form-actions">
        <button type="button" className="cta-secondary" onClick={() => { setForm(INITIAL); setErrors({}) }}>
          Reset Form
        </button>
        <button type="submit" className="cta-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save Patient Details
        </button>
      </div>
    </form>
  )
}
