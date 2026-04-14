import { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import type { CertResult } from '../types/certification'

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
// CertResult is imported from src/types/certification.ts

interface CeuResult {
  detectedChanges: string[]
  ceuLessons: string[]
  ceuQuiz: { question: string; correctAnswer: string }[]
}

interface CeuContentResult {
  modules: {
    id: string
    title: string
    summary: string
    questions: { question: string; options: string[]; correctIndex: number }[]
  }[]
  finalExam: { question: string; options: string[]; correctIndex: number }[]
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
  const [certContentLoading, setCertContentLoading] = useState(false)
  const [certResult, setCertResult] = useState<CertResult | null>(null)
  const [certError, setCertError] = useState<string | null>(null)
  const [certCopied, setCertCopied] = useState(false)
  const [certLoaded, setCertLoaded] = useState(false)
  const [certTimestamp, setCertTimestamp] = useState<Date | null>(null)
  const [certDurationMs, setCertDurationMs] = useState<number | null>(null)
  const [certGenType, setCertGenType] = useState<'Skeleton' | 'Full Content' | null>(null)

  const [ceuLoading, setCeuLoading] = useState(false)
  const [ceuResult, setCeuResult] = useState<CeuResult | null>(null)
  const [ceuError, setCeuError] = useState<string | null>(null)

  const [ceuContentLoading, setCeuContentLoading] = useState(false)
  const [ceuContentResult, setCeuContentResult] = useState<CeuContentResult | null>(null)
  const [ceuContentError, setCeuContentError] = useState<string | null>(null)
  const [ceuContentLoaded, setCeuContentLoaded] = useState(false)

  if (!isLoaded) return <p>Loading...</p>
  if (primaryEmail !== ADMIN_EMAIL) {
    return <p>Access denied. Set ADMIN_EMAIL in admin-ai-content.tsx.</p>
  }

  async function handleGenerateCertification() {
    setCertLoading(true)
    setCertResult(null)
    setCertError(null)
    setCertTimestamp(null)
    setCertDurationMs(null)
    setCertGenType(null)
    const t0 = Date.now()
    try {
      const res = await fetch('/api/admin/generate-certification-eeoc-skeleton', { method: 'POST' })
      const text = await res.text()
      const data = JSON.parse(text)
      if (!res.ok) {
        setCertError(data.error ?? 'Request failed.')
      } else {
        setCertResult(data)
        setCertTimestamp(new Date())
        setCertDurationMs(Date.now() - t0)
        setCertGenType('Skeleton')
      }
    } catch (err: any) {
      setCertError(err.message ?? 'Unexpected error.')
    } finally {
      setCertLoading(false)
    }
  }

  async function handleGenerateCertificationContent() {
    setCertContentLoading(true)
    setCertResult(null)
    setCertError(null)
    setCertTimestamp(null)
    setCertDurationMs(null)
    setCertGenType(null)
    const t0 = Date.now()
    try {
      const res = await fetch('/api/admin/generate-certification-eeoc-content', { method: 'POST' })
      const text = await res.text()
      const data = JSON.parse(text)
      if (!res.ok) {
        setCertError(data.error ?? 'Request failed.')
      } else {
        setCertResult(data)
        setCertTimestamp(new Date())
        setCertDurationMs(Date.now() - t0)
        setCertGenType('Full Content')
      }
    } catch (err: any) {
      setCertError(err.message ?? 'Unexpected error.')
    } finally {
      setCertContentLoading(false)
    }
  }

  async function handleGenerateCeuContent() {
    setCeuContentLoading(true)
    setCeuContentResult(null)
    setCeuContentError(null)
    try {
      const res = await fetch('/api/admin/generate-ceu-content', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setCeuContentError(data.error ?? 'Request failed.')
      } else {
        setCeuContentResult(data)
      }
    } catch (err: any) {
      setCeuContentError(err.message ?? 'Unexpected error.')
    } finally {
      setCeuContentLoading(false)
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
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'var(--sp-10) var(--sp-6)' }}>

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

        {/* Outer wrapper: centers the whole action block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--sp-8)' }}>
          {/* Row 1: buttons side-by-side */}
          <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              type="button"
              onClick={handleGenerateCertification}
              disabled={certLoading || certContentLoading}
              style={{ opacity: certContentLoading ? 0.3 : 1, transition: 'opacity 0.2s' }}
            >
              {certLoading ? 'Generating...' : 'Generate Full Certification'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleGenerateCertificationContent}
              disabled={certLoading || certContentLoading}
            >
              {certContentLoading
                ? 'Generating Full Certification Content...'
                : 'Generate Full Certification Content (Temp)'}
            </button>
          </div>
          {/* Row 2: loading indicator centered under buttons, space always reserved */}
          <div style={{
            marginTop: 'var(--sp-4)',
            minHeight: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: certContentLoading ? 'visible' : 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
              background: 'var(--teal-50)',
              border: '1px solid var(--teal-100)',
              borderRadius: 'var(--r-lg)',
              padding: 'var(--sp-3) var(--sp-5)',
            }}>
              <span className="spinner spinner--lg" aria-hidden="true" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                  Generating certification content...
                </span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  This can take about a minute.
                </span>
              </div>
            </div>
          </div>
        </div>

        {certResult && certTimestamp && (() => {
          const sectionCount = certResult.curriculumOutline.length
          const lessonCount  = certResult.lessons.reduce((n, s) => n + s.lessons.length, 0)
          const timeStr      = certTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const durationStr  = certDurationMs !== null
            ? certDurationMs < 60_000
              ? `${(certDurationMs / 1000).toFixed(1)}s`
              : `${Math.round(certDurationMs / 1000)}s`
            : null
          return (
            <div style={{
              display: 'flex', gap: 'var(--sp-6)', flexWrap: 'wrap', alignItems: 'center',
              background: 'var(--teal-50)', border: '1px solid var(--teal-100)',
              borderRadius: 'var(--r-lg)', padding: 'var(--sp-3) var(--sp-5)',
              marginBottom: 'var(--sp-6)',
              fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-secondary)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ✓ Generated
              </span>
              <span><strong style={{ color: 'var(--navy)' }}>{sectionCount}</strong> sections</span>
              <span><strong style={{ color: 'var(--navy)' }}>{lessonCount}</strong> lessons</span>
              <span>Source: <strong style={{ color: 'var(--navy)' }}>EEOC</strong></span>
              {certGenType && <span>Type: <strong style={{ color: 'var(--navy)' }}>{certGenType}</strong></span>}
              <span>At <strong style={{ color: 'var(--navy)' }}>{timeStr}</strong></span>
              {durationStr && <span>Took <strong style={{ color: 'var(--navy)' }}>{durationStr}</strong></span>}
            </div>
          )
        })()}

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
            <button
              className="btn-secondary"
              type="button"
              style={{ marginTop: 'var(--sp-3)' }}
              onClick={() => {
                localStorage.setItem('generatedCertification', JSON.stringify(certResult))
                localStorage.setItem('wci_admin_preview', '1')
                window.open('/course', '_blank', 'noopener,noreferrer')
              }}
            >
              Preview as User ↗
            </button>
            <button
              className="btn-secondary"
              type="button"
              style={{ marginTop: 'var(--sp-2)' }}
              onClick={() => {
                localStorage.setItem('generatedCertification', JSON.stringify(certResult))
                localStorage.setItem('wci_admin_preview', '1')
                localStorage.setItem('wci_admin_exam_preview', '1')
                window.open('/final-exam', '_blank', 'noopener,noreferrer')
              }}
            >
              Preview Final Exam ↗
            </button>
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

        {/* ── CEU Assessment Generator ── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-8)', marginTop: 'var(--sp-10)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-h)', fontSize: '1.15rem', marginBottom: 'var(--sp-2)' }}>
            CEU Assessment Generator
          </h3>
          <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--sp-6)' }}>
            Generates a full CEU renewal assessment: 4 modules with questions and a 20-question final exam,
            grounded in federal EEO law. Load into localStorage to preview at <code>/ceu</code>.
          </p>

          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-6)' }}>
            <button
              className="btn-primary"
              type="button"
              onClick={handleGenerateCeuContent}
              disabled={ceuContentLoading}
            >
              {ceuContentLoading ? 'Generating...' : 'Generate CEU Content'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                localStorage.removeItem('generatedCeuContent')
                setCeuContentLoaded(false)
              }}
            >
              Clear localStorage
            </button>
          </div>

          {ceuContentError && (
            <p style={{ ...MUTED, color: 'var(--color-error)', marginBottom: 'var(--sp-4)' }}>{ceuContentError}</p>
          )}

          {ceuContentResult && (() => {
            const moduleCount = Array.isArray(ceuContentResult.modules) ? ceuContentResult.modules.length : 0
            const finalExamCount = Array.isArray(ceuContentResult.finalExam) ? ceuContentResult.finalExam.length : 0
            const allModulesHaveQuestions = ceuContentResult.modules?.every(
              (m) => Array.isArray(m.questions) && m.questions.length > 0
            ) ?? false
            const isValid = moduleCount > 0 && finalExamCount > 0 && allModulesHaveQuestions

            return (
              <>
                {!isValid && (
                  <p style={{ ...MUTED, color: 'var(--color-error)', marginBottom: 'var(--sp-4)' }}>
                    Generated content is incomplete or malformed — cannot load. Try regenerating.
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    type="button"
                    disabled={!isValid}
                    onClick={() => {
                      localStorage.setItem('generatedCeuContent', JSON.stringify(ceuContentResult))
                      setCeuContentLoaded(true)
                      setTimeout(() => setCeuContentLoaded(false), 2500)
                    }}
                  >
                    Load to localStorage
                  </button>
                  {ceuContentLoaded && (
                    <p style={{ ...MUTED, margin: 0 }}>Loaded — refresh /ceu to preview</p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
                  <OutputPanel label={`Modules (${moduleCount})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                      {ceuContentResult.modules?.map((mod, i) => {
                        const qCount = Array.isArray(mod.questions) ? mod.questions.length : 0
                        const sampleQs = (mod.questions ?? []).slice(0, 2)
                        return (
                          <div key={mod.id ?? i}>
                            <p style={{ ...BODY, fontWeight: 600, marginBottom: 'var(--sp-1)' }}>
                              {i + 1}. {mod.title ?? '(no title)'}
                            </p>
                            {mod.summary && (
                              <p style={{ ...BODY, color: 'var(--text-secondary)', marginBottom: 'var(--sp-2)' }}>
                                {mod.summary}
                              </p>
                            )}
                            <p style={{ ...MUTED, color: qCount === 0 ? 'var(--color-error)' : undefined, marginBottom: sampleQs.length > 0 ? 'var(--sp-3)' : 0 }}>
                              {qCount} question{qCount !== 1 ? 's' : ''}{qCount === 0 ? ' ⚠ missing' : ''}
                            </p>
                            {sampleQs.map((q, qi) => (
                              <div key={qi} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 'var(--sp-4)', marginBottom: 'var(--sp-3)' }}>
                                <p style={{ ...BODY, fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--sp-1)' }}>
                                  Q{qi + 1}. {q.question}
                                </p>
                                <ul style={{ margin: 0, paddingLeft: 'var(--sp-4)', listStyle: 'none' }}>
                                  {q.options.map((opt: string, oi: number) => (
                                    <li key={oi} style={{
                                      fontFamily: 'var(--font-ui)',
                                      fontSize: '0.8rem',
                                      color: oi === q.correctIndex ? 'var(--color-success)' : 'var(--text-secondary)',
                                      fontWeight: oi === q.correctIndex ? 600 : 400,
                                      marginBottom: '2px',
                                    }}>
                                      {oi === q.correctIndex ? '✓ ' : '○ '}{opt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </OutputPanel>

                  <OutputPanel label={`Final Exam (${finalExamCount} questions)`}>
                    {finalExamCount === 0 ? (
                      <p style={{ ...BODY, color: 'var(--color-error)' }}>⚠ missing</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                        <p style={MUTED}>{finalExamCount} question{finalExamCount !== 1 ? 's' : ''} — showing first 3</p>
                        {(ceuContentResult.finalExam ?? []).slice(0, 3).map((q, qi) => (
                          <div key={qi} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 'var(--sp-4)' }}>
                            <p style={{ ...BODY, fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--sp-1)' }}>
                              Q{qi + 1}. {q.question}
                            </p>
                            <ul style={{ margin: 0, paddingLeft: 'var(--sp-4)', listStyle: 'none' }}>
                              {q.options.map((opt: string, oi: number) => (
                                <li key={oi} style={{
                                  fontFamily: 'var(--font-ui)',
                                  fontSize: '0.8rem',
                                  color: oi === q.correctIndex ? 'var(--color-success)' : 'var(--text-secondary)',
                                  fontWeight: oi === q.correctIndex ? 600 : 400,
                                  marginBottom: '2px',
                                }}>
                                  {oi === q.correctIndex ? '✓ ' : '○ '}{opt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </OutputPanel>
                </div>
              </>
            )
          })()}
        </div>

      </section>

    </div>
  )
}
