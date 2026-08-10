import { useEffect, useState } from 'react'
import { authApi } from '../../api/axiosInstance'


/* â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STEPS = ['Your Info', 'Details', 'Thoughts']

const ROLES = ['Admin', 'Manufacturer', 'Transporter', 'Dealer', 'Retail Shop']

const CATEGORIES = [
  'General Experience',
  'Dashboard & Analytics',
  'Shipment Tracking',
  'Blockchain & Verification',
  'Inventory Management',
  'AI Forecasting',
  'Performance & Speed',
  'Bug Report',
]

const PRIORITY_OPTIONS = [
  { label: 'ðŸŸ¢ Low',  value: 'Low'    },
  { label: 'ðŸŸ¡ Med',  value: 'Medium' },
  { label: 'ðŸ”´ High', value: 'High'   },
]

const ROLE_TO_API = {
  Admin:          'admin',
  Manufacturer:   'manufacturer',
  Transporter:    'transporter',
  Dealer:         'dealer',
  'Retail Shop':  'retail_shop',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function FeedbackForm({ initialData = null, onSubmitted }) {
  const badgeLogoSrc = '/favicon.svg'
  const [step, setStep]       = useState(1)
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [name, setName]              = useState('')
  const [email, setEmail]            = useState('')
  const [emailConfirm, setEmailConf] = useState('')
  const [role, setRole]              = useState('')
  const [err1, setErr1]              = useState('')

  // Step 2
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [rating, setRating]     = useState(0)
  const [file, setFile]         = useState(null)
  const [err2, setErr2]         = useState('')

  // Step 3
  const [message, setMessage]           = useState('')
  const [improvements, setImprovements] = useState('')
  const [err3, setErr3]                 = useState('')
  const [feedbackResponse, setFeedbackResponse] = useState({
    message: '',
    email_sent: true,
    email_error: '',
  })

  useEffect(() => {
    if (!initialData) return
    const n = String(initialData.name  || '').trim()
    const e = String(initialData.email || '').trim()
    const r = String(initialData.role  || '').trim()
    if (n) setName(n)
    if (e) { setEmail(e); setEmailConf(e) }
    if (r) setRole(r)
  }, [initialData])

  const progressPct = done ? 100 : step === 1 ? 0 : step === 2 ? 50 : 100

  /* â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function validateStep1() {
    setErr1('')
    if (!name.trim())           { setErr1('Please enter your full name.');                     return false }
    if (!EMAIL_RE.test(email))  { setErr1('Please enter a valid email address.');              return false }
    if (email !== emailConfirm) { setErr1('Emails do not match. Please check and try again.'); return false }
    if (!role)                  { setErr1('Please select your role.');                         return false }
    return true
  }

  function validateStep2() {
    setErr2('')
    if (!category) { setErr2('Please select a feedback category.'); return false }
    if (!priority) { setErr2('Please select a priority level.');    return false }
    if (!rating)   { setErr2('Please give a star rating before continuing.'); return false }
    return true
  }

  function validateStep3() {
    setErr3('')
    if (!message.trim()) { setErr3('Please share your feedback before submitting.'); return false }
    return true
  }

  /* â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function goNext(from) {
    const ok = from === 1 ? validateStep1() : from === 2 ? validateStep2() : true
    if (ok) setStep(from + 1)
  }

  function goBack(from) { setStep(from - 1) }

  /* â”€â”€ File handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); e.target.value = ''; return }
    setFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return }
    setFile(f)
  }

  /* â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  async function submitForm() {
    if (!validateStep3()) return
    setLoading(true)
    setErr3('')
    try {
      const resp = await authApi.submitFeedback({
        name:         name.trim(),
        email:        email.trim(),
        role:         ROLE_TO_API[role] || 'dealer',
        category,
        priority,
        rating,
        message:      message.trim(),
        improvements: improvements.trim(),
        source:       initialData?.source || 'feedback_form',
      })
      setDone(true)
      setFeedbackResponse({
        message: resp?.message || 'Feedback submitted successfully',
        email_sent: resp?.email_sent ?? true,
        email_error: resp?.email_error || '',
      })
      if (typeof onSubmitted === 'function') {
        setTimeout(() => onSubmitted(), 1000)
      }
    } catch (error) {
      setErr3(error?.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* â”€â”€ Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function resetForm() {
    setStep(1); setDone(false); setLoading(false)
    setName(''); setEmail(''); setEmailConf(''); setRole(''); setErr1('')
    setCategory(''); setPriority(''); setRating(0); setFile(null); setErr2('')
    setMessage(''); setImprovements(''); setErr3('')
    setFeedbackResponse({
      message: '',
      email_sent: true,
      email_error: '',
    })
  }

  /* â”€â”€ Char counter class â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const cClass = (rem, warn = 60, over = 20) =>
    `fb-char-counter${rem <= over ? ' over' : rem <= warn ? ' warn' : ''}`

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div className="fb-scene bg-theme-feedback">


      <div className="fb-wrap">

        {/* â”€â”€ Header â”€â”€ */}
        <div className="fb-header">
          <div className="fb-badge">
            <span className="fb-badge-dot" />
            <img
              className="fb-badge-logo"
              src={badgeLogoSrc}
              alt=""
              aria-hidden="true"
              width="22"
              height="22"
              loading="eager"
              title="WayBill"
            />
            WayBill Â· Feedback Portal
          </div>
          <h1 className="fb-title">
            Share Your <span className="fb-title-accent">Experience</span>
          </h1>
          <p className="fb-subtitle">
            Help us improve WayBill: AI-driven logistics, blockchain verification, and supply chain control.
          </p>

        </div>

        {/* â”€â”€ Progress bar â”€â”€ */}
        <div className="fb-progress">
          <div className="fb-steps-track">
            <div className="fb-track-bg" />
            <div className="fb-track-fill" style={{ width: `${progressPct}%` }} />
            {STEPS.map((_, i) => {
              const n      = i + 1
              const isDone = done || n < step
              const isAct  = !done && n === step
              return (
                <div key={n} className={`fb-step-dot${isDone ? ' done' : isAct ? ' active' : ''}`}>
                  {isDone ? 'âœ“' : n}
                </div>
              )
            })}
          </div>
          <div className="fb-step-labels">
            {STEPS.map((label, i) => (
              <span key={label} className={`fb-step-lbl${i + 1 === step && !done ? ' active' : ''}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* â”€â”€ Card â”€â”€ */}
        <div className="fb-card">


          {/* â•â• SUCCESS â•â• */}
          {done && (
            <div className="fb-success">
              <div className="fb-success-icon">âœ¦</div>
              <div className="fb-success-title">Feedback Received</div>
              <p className="fb-success-msg">
                {feedbackResponse.message ||
                  `Thank you, ${name.trim().split(' ')[0] || 'User'}. Your response has been logged.`}
              </p>
              {!feedbackResponse.email_sent && (
                <p className="fb-success-note">
                  Thank-you email could not be delivered.
                  <br />
                  {feedbackResponse.email_error ||
                    'Check SMTP credentials or enable MOCK_EMAIL_DELIVERY.'}
                </p>
              )}
              <span className="fb-success-tag">âœ“ Submitted Successfully</span>
              <button type="button" className="fb-btn-reset" onClick={resetForm} style={{ marginTop: 8 }}>
                â†© Submit Another Response
              </button>
            </div>
          )}

          {/* â•â• STEP 1 Â· Your Info â•â• */}
          {!done && step === 1 && (
            <>
              <div className="fb-section-label">Your Info</div>

              <div className="fb-row2">
                <div className="fb-field">
                  <label className="fb-label">
                    Full Name <span className="fb-label-req">*</span>
                  </label>
                  <input
                    type="text"
                    className={`fb-input${err1 && !name.trim() ? ' err' : ''}`}
                    placeholder="e.g. Arjun Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="fb-field">
                  <label className="fb-label">
                    Role <span className="fb-label-req">*</span>
                  </label>
                  <select
                    className={`fb-select${err1 && !role ? ' err' : ''}`}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="">Select role</option>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Email <span className="fb-label-req">*</span>
                </label>
                <input
                  type="email"
                  className={`fb-input${err1 && !EMAIL_RE.test(email) ? ' err' : ''}`}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Confirm Email <span className="fb-label-req">*</span>
                </label>
                <input
                  type="email"
                  className={`fb-input${err1 && email !== emailConfirm ? ' err' : ''}`}
                  placeholder="Re-enter your email"
                  value={emailConfirm}
                  onChange={(e) => setEmailConf(e.target.value)}
                />
              </div>

              {err1 && <div className="fb-error-msg"><span>âš </span> {err1}</div>}

              <div className="fb-nav-row">
                <button type="button" className="fb-btn-next" onClick={() => goNext(1)}>
                  Continue â†’
                </button>
              </div>
            </>
          )}

          {/* â•â• STEP 2 Â· Feedback Details â•â• */}
          {!done && step === 2 && (
            <>
              <div className="fb-section-label">Feedback Details</div>

              <div className="fb-row2">
                <div className="fb-field">
                  <label className="fb-label">
                    Category <span className="fb-label-req">*</span>
                  </label>
                  <select
                    className={`fb-select${err2 && !category ? ' err' : ''}`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="fb-field">
                  <label className="fb-label">
                    Priority <span className="fb-label-req">*</span>
                  </label>
                  <div className="fb-priority-row">
                    {PRIORITY_OPTIONS.map(({ label, value }) => (
                      <button
                        type="button"
                        key={value}
                        className={`fb-pri-btn${priority === value ? ' sel' : ''}`}
                        data-p={value}
                        onClick={() => setPriority(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Overall Rating <span className="fb-label-req">*</span>
                </label>
                <div className="fb-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`fb-star${n <= rating ? ' on' : ''}`}
                      onClick={() => setRating(n)}
                      aria-label={`${n} star`}
                    >
                      â˜…
                    </button>
                  ))}
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Screenshot <span className="fb-label-opt">(optional Â· max 5MB)</span>
                </label>
                {!file ? (
                  <div
                    className="fb-upload-zone"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover') }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                    onDrop={handleDrop}
                  >
                    <input type="file" accept="image/*,.pdf" onChange={handleFile} />
                    <div className="fb-upload-icon">ðŸ“Ž</div>
                    <div className="fb-upload-txt">
                      Drag & drop or <span>browse</span> to upload<br />
                      <small>PNG Â· JPG Â· PDF Â· max 5MB</small>
                    </div>
                  </div>
                ) : (
                  <div className="fb-file-preview">
                    <span>ðŸ“„</span>
                    <span className="fb-file-name">{file.name}</span>
                    <button
                      type="button"
                      className="fb-remove-file"
                      onClick={() => setFile(null)}
                      title="Remove file"
                    >
                      âœ•
                    </button>
                  </div>
                )}
              </div>

              {err2 && <div className="fb-error-msg"><span>âš </span> {err2}</div>}

              <div className="fb-nav-row">
                <button type="button" className="fb-btn-back" onClick={() => goBack(2)}>
                  â† Back
                </button>
                <button type="button" className="fb-btn-next" onClick={() => goNext(2)}>
                  Continue â†’
                </button>
              </div>
            </>
          )}

          {/* â•â• STEP 3 Â· Your Thoughts â•â• */}
          {!done && step === 3 && (
            <>
              <div className="fb-section-label">Your Thoughts</div>

              <div className="fb-field">
                <label className="fb-label">
                  Feedback &amp; Comments <span className="fb-label-req">*</span>
                </label>
                <div className="fb-char-wrap">
                  <textarea
                    className={`fb-textarea${err3 && !message.trim() ? ' err' : ''}`}
                    maxLength={500}
                    placeholder="Tell us what's working well, or what's been challenging..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <span className={cClass(500 - message.length)}>
                    {500 - message.length}
                  </span>
                </div>
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Suggested Improvements <span className="fb-label-opt">(optional)</span>
                </label>
                <div className="fb-char-wrap">
                  <textarea
                    className="fb-textarea"
                    maxLength={300}
                    style={{ minHeight: 90 }}
                    placeholder="Any features you'd love to see added or changed?"
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                  />
                  <span className={cClass(300 - improvements.length, 50, 15)}>
                    {300 - improvements.length}
                  </span>
                </div>
              </div>

              {err3 && <div className="fb-error-msg"><span>âš </span> {err3}</div>}

              <div className="fb-nav-row">
                <button type="button" className="fb-btn-back" onClick={() => goBack(3)}>
                  â† Back
                </button>
                <button
                  type="button"
                  className="fb-btn-submit"
                  onClick={submitForm}
                  disabled={loading}
                >
                  {loading ? 'Submittingâ€¦' : 'Submit Feedback â†’'}
                </button>
              </div>

              <hr className="fb-divider" />
              <button type="button" className="fb-btn-reset" onClick={resetForm}>
                âœ• Clear &amp; Reset Form
              </button>
            </>
          )}

        </div>{/* /fb-card */}
      </div>{/* /fb-wrap */}
    </div>
  )
}

