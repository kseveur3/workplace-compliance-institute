import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'

const ADMIN_EMAIL = 'kseveur@gmail.com'

interface LessonContent {
  title: string
  estimatedTime: string
  body: string[]
}

interface ExampleItem {
  title: string
  scenario: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
}

export function AdminAiContentPage() {
  const { user } = useUser()

  const primaryEmail = user?.primaryEmailAddress?.emailAddress

  const [sectionName, setSectionName] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [lessonDraft, setLessonDraft] = useState('')
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null)
  const [exampleDraft, setExampleDraft] = useState('')
  const [exampleContent, setExampleContent] = useState<ExampleItem[] | null>(null)
  const [quizDraft, setQuizDraft] = useState('')
  const [quizContent, setQuizContent] = useState<QuizQuestion[] | null>(null)
  const [activeGenerationType, setActiveGenerationType] = useState<string | null>(null)
  const [lessonCopied, setLessonCopied] = useState(false)

  if (primaryEmail !== ADMIN_EMAIL) {
    return <p>Access denied. Set ADMIN_EMAIL in admin-ai-content.tsx.</p>
  }

  async function handleGenerateQuiz() {
    setActiveGenerationType('quiz')
    setQuizContent(null)
    setQuizDraft('Generating quiz...')
    try {
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionTitle: sectionName, topic: lessonTopic, notes, generationType: 'quiz' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setQuizDraft(`Error: ${data.error ?? 'Request failed'}`)
        return
      }
      setQuizContent(data.content.questions)
      setQuizDraft('')
    } catch (err: any) {
      setQuizDraft(`Error: ${err.message ?? 'Unexpected error'}`)
    }
  }

  async function handleGenerateExamples() {
    setActiveGenerationType('examples')
    setExampleContent(null)
    setExampleDraft('Generating examples...')
    try {
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionTitle: sectionName, topic: lessonTopic, notes, generationType: 'examples' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExampleDraft(`Error: ${data.error ?? 'Request failed'}`)
        return
      }
      setExampleContent(data.content.examples)
      setExampleDraft('')
    } catch (err: any) {
      setExampleDraft(`Error: ${err.message ?? 'Unexpected error'}`)
    }
  }

  async function handleGenerateLesson() {
    setActiveGenerationType('lesson')
    setLessonContent(null)
    setLessonDraft('Generating lesson...')
    try {
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionTitle: sectionName, topic: lessonTopic, notes, generationType: 'lesson' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLessonDraft(`Error: ${data.error ?? 'Request failed'}`)
        return
      }
      setLessonContent(data.content)
      setLessonDraft('')
    } catch (err: any) {
      setLessonDraft(`Error: ${err.message ?? 'Unexpected error'}`)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--sp-10) var(--sp-6)' }}>
      <h1 className="page-title" style={{ marginBottom: 'var(--sp-2)' }}>AI Content Generator</h1>
      <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', marginBottom: 'var(--sp-8)' }}>
        Generate lesson drafts, examples, and quizzes for admin review.
      </p>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', marginBottom: 'var(--sp-8)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Section Name
          <input
            type="text"
            placeholder="e.g. Workplace Harassment"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.95rem',
              padding: 'var(--sp-3) var(--sp-4)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Lesson Topic
          <input
            type="text"
            placeholder="e.g. Recognizing hostile work environment"
            value={lessonTopic}
            onChange={(e) => setLessonTopic(e.target.value)}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.95rem',
              padding: 'var(--sp-3) var(--sp-4)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Notes / Instructions
          <textarea
            placeholder="Any specific tone, coverage, or constraints..."
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.95rem',
              padding: 'var(--sp-3) var(--sp-4)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </label>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-10)' }}>
        <button
          className="btn-primary"
          type="button"
          onClick={handleGenerateLesson}
        >
          Generate Lesson
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleGenerateExamples}
        >
          Generate Examples
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleGenerateQuiz}
        >
          Generate Quiz
        </button>
      </div>

      {/* Result panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        {/* Lesson Draft */}
        <div style={{
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-5)',
          background: 'var(--bg-card)',
        }}>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 'var(--sp-3)',
          }}>
            Lesson Draft
          </p>
          {lessonContent ? (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <p style={{ fontWeight: 600, marginBottom: 'var(--sp-1)' }}>{lessonContent.title}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--sp-4)' }}>{lessonContent.estimatedTime}</p>
              {lessonContent.body.map((para, i) => (
                <p key={i} style={{ marginBottom: 'var(--sp-3)' }}>{para}</p>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => {
                    const slug = lessonContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    const lessonJson = JSON.stringify({
                      id: slug,
                      title: lessonContent.title,
                      estimatedTime: lessonContent.estimatedTime,
                      content: lessonContent.body,
                      narrationPlaceholder: '',
                    }, null, 2)
                    navigator.clipboard.writeText(lessonJson).then(() => {
                      setLessonCopied(true)
                      setTimeout(() => setLessonCopied(false), 2500)
                    })
                  }}
                >
                  Copy as Lesson JSON
                </button>
                {lessonCopied && (
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--color-success)' }}>Lesson JSON copied</span>
                )}
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-ui)', color: lessonDraft ? 'var(--text-primary)' : 'var(--border-dark)', fontSize: '0.9rem' }}>
              {lessonDraft || 'Output will appear here.'}
            </p>
          )}
        </div>

        {/* Example Scenarios */}
        <div style={{
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-5)',
          background: 'var(--bg-card)',
        }}>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 'var(--sp-3)',
          }}>
            Example Scenarios
          </p>
          {exampleContent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {exampleContent.map((ex, i) => (
                <div key={i}>
                  <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 'var(--sp-1)' }}>{ex.title}</p>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{ex.scenario}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-ui)', color: exampleDraft ? 'var(--text-primary)' : 'var(--border-dark)', fontSize: '0.9rem' }}>
              {exampleDraft || 'Output will appear here.'}
            </p>
          )}
        </div>

        {/* Quiz Draft */}
        <div style={{
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-5)',
          background: 'var(--bg-card)',
        }}>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 'var(--sp-3)',
          }}>
            Quiz Draft
          </p>
          {quizContent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
              {quizContent.map((q, i) => (
                <div key={i}>
                  <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 'var(--sp-2)' }}>{i + 1}. {q.question}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--sp-2)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                    {q.options.map((opt, j) => (
                      <li key={j} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.88rem', color: j === q.correctAnswerIndex ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                        {j === q.correctAnswerIndex ? '✓ ' : '   '}{opt}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-ui)', color: quizDraft ? 'var(--text-primary)' : 'var(--border-dark)', fontSize: '0.9rem' }}>
              {quizDraft || 'Output will appear here.'}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
