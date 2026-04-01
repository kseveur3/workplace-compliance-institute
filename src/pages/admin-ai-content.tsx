import { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'

const ADMIN_EMAIL = 'kseveur@gmail.com'

// ── Shared styles ─────────────────────────────────────────────────────────────

const PANEL_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontWeight: 600,
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 'var(--sp-3)',
}

const PANEL: React.CSSProperties = {
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: 'var(--sp-5)',
  background: 'var(--bg-card)',
}

const BODY: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.9rem',
  color: 'var(--text-primary)',
  lineHeight: 1.6,
}

const MUTED: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  color: 'var(--border-dark)',
  fontSize: '0.9rem',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CertResult {
  sourceSummary: string
  curriculumOutline: { section: string; lessons: number }[]
  lessons: { section: string; lessons: { title: string; estimatedTime: string; content: string[] }[] }[]
  examples: { title: string; scenario: string }[]
  sectionQuizzes: { section: string; questions: { question: string; options: string[]; correctIndex: number }[] }[]
  finalExam: { totalQuestions: number; passingScore: string; coverage: string[] }
}

interface CeuResult {
  detectedChanges: string[]
  ceuLessons: string[]
  ceuQuiz: { question: string; correctAnswer: string }[]
}

// ── Output Panel ─────────────────────────────────────────────────────────────

function OutputPanel({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div style={PANEL}>
      <p style={PANEL_LABEL}>{label}</p>
      {children ?? <p style={MUTED}>Output will appear here.</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminAiContentPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const primaryEmail = user?.primaryEmailAddress?.emailAddress

  const [certLoading, setCertLoading] = useState(false)
  const [certResult, setCertResult] = useState<CertResult | null>(null)
  const [certError, setCertError] = useState<string | null>(null)
  const [certCopied, setCertCopied] = useState(false)
  const [certLoaded, setCertLoaded] = useState(false)

  const [ceuLoading, setCeuLoading] = useState(false)
  const [ceuResult, setCeuResult] = useState<CeuResult | null>(null)
  const [ceuError, setCeuError] = useState<string | null>(null)

  if (!isLoaded) return <p>Loading...</p>
  if (primaryEmail !== ADMIN_EMAIL) {
    return <p>Access denied. Set ADMIN_EMAIL in admin-ai-content.tsx.</p>
  }

  async function handleGenerateCertification() {
    console.log('CLICKED generate')
    setCertLoading(true)
    setCertResult(null)
    setCertError(null)
    try {
      console.log('BEFORE fetch')
      const res = await fetch('/api/admin/generate-certification', { method: 'POST' })
      console.log('AFTER fetch')
      console.log('status', res.status)
      console.log('headers', Object.fromEntries(res.headers.entries()))
      const text = await res.text()
      console.log('AFTER text')
      console.log('raw response', text)
      const data = JSON.parse(text)
      console.log('AFTER parse')
      if (!res.ok) {
        setCertError(data.error ?? 'Request failed.')
      } else {
        setCertResult(data)
      }
    } catch (err: any) {
      setCertError(err.message ?? 'Unexpected error.')
    } finally {
      setCertLoading(false)
    }
  }

  async function handleScanCeuUpdates() {
    setCeuLoading(true)
    setCeuResult(null)
    setCeuError(null)
    try {
      const res = await fetch('/api/admin/scan-ceu-updates', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setCeuError(data.error ?? 'Request failed.')
      } else {
        setCeuResult(data)
      }
    } catch (err: any) {
      setCeuError(err.message ?? 'Unexpected error.')
    } finally {
      setCeuLoading(false)
    }
  }

  const certErr = (msg: string) => <p style={{ ...MUTED, color: 'var(--color-error)' }}>{msg}</p>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--sp-10) var(--sp-6)' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--sp-4)' }}>
        <button className="btn-secondary" type="button" onClick={() => signOut({ redirectUrl: '/admin/sign-in' })}>Logout</button>
      </div>

      <h1 className="page-title" style={{ marginBottom: 'var(--sp-2)' }}>AI Content Generator</h1>
      <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }}>
        Admin tools for generating and updating certification content using AI.
      </p>

      {/* ── Section A: Full Certification Builder ── */}
      <section style={{ marginBottom: 'var(--sp-12)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-h)', fontSize: '1.4rem', marginBottom: 'var(--sp-2)' }}>
          Full Certification Builder
        </h2>
        <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--sp-6)' }}>
          Generates a complete certification course from EEOC source material. Produces a structured curriculum,
          lessons, real-world examples, section quizzes, and a final exam — ready for admin review before publishing.
        </p>

        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <button className="btn-primary" type="button" onClick={handleGenerateCertification} disabled={certLoading}>
            {certLoading ? 'Generating...' : 'Generate Full Certification'}
          </button>
        </div>

        {certResult && (
          <div style={{ marginBottom: 'var(--sp-8)' }}>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(certResult, null, 2))
                setCertCopied(true)
                setTimeout(() => setCertCopied(false), 2500)
              }}
            >
              Copy Certification JSON
            </button>
            {certCopied && <p style={{ ...MUTED, marginTop: 'var(--sp-2)' }}>Certification JSON copied</p>}
            <button
              className="btn-secondary"
              type="button"
              style={{ marginTop: 'var(--sp-3)' }}
              onClick={() => {
                localStorage.setItem('generatedCertification', JSON.stringify(certResult))
                setCertLoaded(true)
                setTimeout(() => setCertLoaded(false), 2500)
              }}
            >
              Load Certification (Temp)
            </button>
            {certLoaded && <p style={{ ...MUTED, marginTop: 'var(--sp-2)' }}>Certification loaded locally</p>}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

          <OutputPanel label="Source Summary">
            {certLoading && <p style={MUTED}>Generating source summary...</p>}
            {certError && certErr(certError)}
            {certResult && <p style={BODY}>{certResult.sourceSummary}</p>}
          </OutputPanel>

          <OutputPanel label="Curriculum Outline">
            {certLoading && <p style={MUTED}>Generating curriculum outline...</p>}
            {certError && certErr(certError)}
            {certResult && (
              <ul style={{ ...BODY, paddingLeft: 'var(--sp-5)', margin: 0 }}>
                {certResult.curriculumOutline.map((s, i) => (
                  <li key={i} style={{ marginBottom: 'var(--sp-1)' }}>
                    <strong>{s.section}</strong> — {s.lessons} lessons
                  </li>
                ))}
              </ul>
            )}
          </OutputPanel>

          <OutputPanel label="Lessons">
            {certLoading && <p style={MUTED}>Generating lessons...</p>}
            {certError && certErr(certError)}
            {certResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                {certResult.lessons.map((s, i) => (
                  <div key={i}>
                    <p style={{ ...BODY, fontWeight: 600, marginBottom: 'var(--sp-1)' }}>{s.section}</p>
                    <ul style={{ ...BODY, paddingLeft: 'var(--sp-5)', margin: 0 }}>
                      {Array.isArray(s.lessons) && s.lessons.map((l, j) => <li key={j}>{l.title}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </OutputPanel>

          <OutputPanel label="Examples">
            {certLoading && <p style={MUTED}>Generating examples...</p>}
            {certError && certErr(certError)}
            {certResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                {certResult.examples.map((ex, i) => (
                  <div key={i}>
                    <p style={{ ...BODY, fontWeight: 600, marginBottom: 'var(--sp-1)' }}>{ex.title}</p>
                    <p style={BODY}>{ex.scenario}</p>
                  </div>
                ))}
              </div>
            )}
          </OutputPanel>

          <OutputPanel label="Section Quizzes">
            {certLoading && <p style={MUTED}>Generating section quizzes...</p>}
            {certError && certErr(certError)}
            {certResult && (
              <ul style={{ ...BODY, paddingLeft: 'var(--sp-5)', margin: 0 }}>
                {certResult.sectionQuizzes.map((q, i) => (
                  <li key={i} style={{ marginBottom: 'var(--sp-1)' }}>
                    {q.section} — {Array.isArray(q.questions) ? q.questions.length : 0} questions
                  </li>
                ))}
              </ul>
            )}
          </OutputPanel>

          <OutputPanel label="Final Exam">
            {certLoading && <p style={MUTED}>Generating final exam...</p>}
            {certError && certErr(certError)}
            {certResult && (
              <div style={BODY}>
                <ul style={{ paddingLeft: 'var(--sp-5)', margin: '0 0 var(--sp-3)' }}>
                  {certResult.finalExam.coverage.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
                <p><strong>Total questions:</strong> {certResult.finalExam.totalQuestions} &nbsp;|&nbsp; <strong>Passing score:</strong> {certResult.finalExam.passingScore}</p>
              </div>
            )}
          </OutputPanel>

        </div>
      </section>

      {/* ── Section B: Annual CEU Builder ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-h)', fontSize: '1.4rem', marginBottom: 'var(--sp-2)' }}>
          Annual CEU Builder
        </h2>
        <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--sp-6)' }}>
          Scans for EEOC regulatory updates and generates annual CEU renewal training based on detected changes.
          Keeps certification content current without manual review of source documents.
        </p>

        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <button className="btn-secondary" type="button" onClick={handleScanCeuUpdates} disabled={ceuLoading}>
            {ceuLoading ? 'Scanning...' : 'Scan EEOC Updates'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

          <OutputPanel label="Detected Changes">
            {ceuLoading && <p style={MUTED}>Scanning for EEOC changes...</p>}
            {ceuError && certErr(ceuError)}
            {ceuResult && (
              <ul style={{ ...BODY, paddingLeft: 'var(--sp-5)', margin: 0 }}>
                {ceuResult.detectedChanges.map((c, i) => (
                  <li key={i} style={{ marginBottom: 'var(--sp-2)' }}>{c}</li>
                ))}
              </ul>
            )}
          </OutputPanel>

          <OutputPanel label="CEU Lessons">
            {ceuLoading && <p style={MUTED}>Generating CEU lessons...</p>}
            {ceuError && certErr(ceuError)}
            {ceuResult && (
              <ul style={{ ...BODY, paddingLeft: 'var(--sp-5)', margin: 0 }}>
                {ceuResult.ceuLessons.map((l, i) => (
                  <li key={i} style={{ marginBottom: 'var(--sp-1)' }}>{l}</li>
                ))}
              </ul>
            )}
          </OutputPanel>

          <OutputPanel label="CEU Quiz">
            {ceuLoading && <p style={MUTED}>Generating CEU quiz...</p>}
            {ceuError && certErr(ceuError)}
            {ceuResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                {ceuResult.ceuQuiz.map((q, i) => (
                  <div key={i}>
                    <p style={{ ...BODY, fontWeight: 600, marginBottom: 'var(--sp-1)' }}>{i + 1}. {q.question}</p>
                    <p style={{ ...BODY, color: 'var(--color-success)' }}>✓ {q.correctAnswer}</p>
                  </div>
                ))}
              </div>
            )}
          </OutputPanel>

        </div>
      </section>

    </div>
  )
}
