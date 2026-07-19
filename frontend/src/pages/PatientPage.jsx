// pages/PatientPage.jsx — Patient details intake page

import PatientForm from '../components/PatientForm'
import Footer from '../components/Footer'

export default function PatientPage() {
  const handleSubmit = (data) => {
    // Store patient data in sessionStorage so AnalyzePage can access it
    sessionStorage.setItem('patientData', JSON.stringify(data))
    console.log('[PatientPage] Patient saved:', data)
  }

  return (
    <div className="patient-page">
      {/* Page Hero */}
      <div className="analyze-hero">
        <div className="analyze-badge">Patient Registration</div>
        <h1 className="analyze-title">
          Patient <span className="gradient-text">Details</span>
        </h1>
        <p className="analyze-desc">
          Enter the patient's personal, contact, and medical history information
          before proceeding to the X-ray osteoporosis analysis.
        </p>
      </div>

      {/* Form Container */}
      <div className="patient-page-body">
        <PatientForm onSubmit={handleSubmit} />
      </div>

      <Footer />
    </div>
  )
}
