import { useState, useEffect, createContext, useContext } from 'react'
import { AdminAiContentPage } from './pages/admin-ai-content'
import { Routes, Route, Link, Navigate, useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, SignOutButton, useUser, useAuth } from '@clerk/clerk-react'
import './app.css'

interface Lesson {
  id: string
  title: string
  estimatedTime: string
  content: string[]
  narrationPlaceholder: string
}

interface Section {
  id: string
  title: string
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  sections: Section[]
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

interface SectionQuiz {
  sectionId: string
  questions: QuizQuestion[]
}

const QUIZZES: SectionQuiz[] = [
  {
    sectionId: 'section-1',
    questions: [
      {
        id: 'q1-1',
        question: 'Which federal agency is primarily responsible for enforcing EEO laws?',
        options: [
          'Department of Labor',
          'Equal Employment Opportunity Commission (EEOC)',
          'Department of Justice',
          'Office of Personnel Management',
        ],
        correctIndex: 1,
      },
      {
        id: 'q1-2',
        question: 'Which of the following is NOT a protected characteristic under Title VII?',
        options: ['Race', 'Religion', 'Political affiliation', 'National origin'],
        correctIndex: 2,
      },
    ],
  },
  {
    sectionId: 'section-2',
    questions: [
      {
        id: 'q2-1',
        question: 'Disparate treatment occurs when an employer:',
        options: [
          'Applies a neutral policy that disproportionately impacts a protected group',
          'Treats an employee less favorably because of a protected characteristic',
          'Fails to provide a reasonable accommodation',
          'Retaliates against an employee for filing a complaint',
        ],
        correctIndex: 1,
      },
      {
        id: 'q2-2',
        question: 'For a hostile work environment claim, the conduct must be:',
        options: [
          'Intentional and physical in nature',
          'Reported to HR before it legally qualifies',
          'Both subjectively and objectively offensive',
          'Committed only by a direct supervisor',
        ],
        correctIndex: 2,
      },
    ],
  },
]

const FINAL_EXAM_QUESTIONS: QuizQuestion[] = [
  {
    id: 'fe-1',
    question: 'Which federal agency is the primary enforcement body for EEO laws in the United States?',
    options: [
      'Department of Labor',
      'Office of Personnel Management',
      'Equal Employment Opportunity Commission (EEOC)',
      'Department of Justice',
    ],
    correctIndex: 2,
  },
  {
    id: 'fe-2',
    question: 'Title VII of the Civil Rights Act of 1964 prohibits discrimination based on all of the following EXCEPT:',
    options: ['Race', 'National origin', 'Political affiliation', 'Religion'],
    correctIndex: 2,
  },
  {
    id: 'fe-3',
    question: 'In a disparate treatment claim, the burden-shifting framework was established in:',
    options: [
      'Harris v. Forklift Systems',
      'McDonnell Douglas Corp. v. Green',
      'Meritor Savings Bank v. Vinson',
      'Burlington Industries v. Ellerth',
    ],
    correctIndex: 1,
  },
  {
    id: 'fe-4',
    question: 'A hostile work environment claim requires that the conduct be:',
    options: [
      'Physical and intentional',
      'Reported to a supervisor before filing',
      'Both subjectively and objectively offensive',
      'Committed only by a supervisor',
    ],
    correctIndex: 2,
  },
]

const CEU_QUESTIONS: QuizQuestion[] = [
  {
    id: 'ceu-1',
    question: 'Which federal agency is the primary enforcement body for EEO laws in the United States?',
    options: [
      'Department of Labor',
      'Office of Personnel Management',
      'Equal Employment Opportunity Commission (EEOC)',
      'Department of Justice',
    ],
    correctIndex: 2,
  },
  {
    id: 'ceu-2',
    question: 'Title VII of the Civil Rights Act of 1964 prohibits discrimination based on all of the following EXCEPT:',
    options: ['Race', 'National origin', 'Political affiliation', 'Religion'],
    correctIndex: 2,
  },
  {
    id: 'ceu-3',
    question: 'In a disparate treatment claim, the burden-shifting framework was established in:',
    options: [
      'Harris v. Forklift Systems',
      'McDonnell Douglas Corp. v. Green',
      'Meritor Savings Bank v. Vinson',
      'Burlington Industries v. Ellerth',
    ],
    correctIndex: 1,
  },
  {
    id: 'ceu-4',
    question: 'A hostile work environment claim requires that the conduct be:',
    options: [
      'Physical and intentional',
      'Reported to a supervisor before filing',
      'Both subjectively and objectively offensive',
      'Committed only by a supervisor',
    ],
    correctIndex: 2,
  },
]

const COURSE: Course = {
  id: 'eeo-investigator',
  title: 'EEO Investigator Certification',
  sections: [
    {
      id: 'section-1',
      title: 'Section 1: Foundations of EEO Law',
      lessons: [
        {
          id: 'lesson-1',
          title: 'Overview of EEO Framework',
          estimatedTime: 'Estimated time: 20 minutes',
          content: [
            'The Equal Employment Opportunity (EEO) framework is a set of federal laws designed to prevent workplace discrimination based on protected characteristics such as race, color, religion, sex, national origin, age, and disability.',
            'Federal agencies enforce these protections through the Equal Employment Opportunity Commission (EEOC), which receives, investigates, and resolves discrimination complaints filed by employees and applicants.',
            'As an EEO investigator, your role is to gather facts impartially, apply the relevant legal standards, and produce a report of investigation that serves as the evidentiary record for resolution.',
            'Understanding the full scope of the EEO framework — including which laws apply, which agencies have jurisdiction, and what remedies are available — is the foundation of effective investigation.',
          ],
          narrationPlaceholder: 'Audio narration for Overview of EEO Framework coming soon.',
        },
        {
          id: 'lesson-2',
          title: 'Title VII Basics',
          estimatedTime: 'Estimated time: 25 minutes',
          content: [
            'Title VII of the Civil Rights Act of 1964 prohibits employment discrimination based on race, color, religion, sex, and national origin. It applies to employers with 15 or more employees, including federal agencies.',
            'Title VII covers all aspects of employment: hiring, firing, pay, job assignments, promotions, layoffs, training, fringe benefits, and any other term or condition of employment.',
            "Amendments and related statutes — including the Pregnancy Discrimination Act and Title II of the Genetic Information Nondiscrimination Act — have expanded Title VII's protections over time.",
            'Investigators must be familiar with the basic elements of a Title VII claim, including the concept of adverse action and the requirement that the protected characteristic be a motivating factor in the employment decision.',
          ],
          narrationPlaceholder: 'Audio narration for Title VII Basics coming soon.',
        },
      ],
    },
    {
      id: 'section-2',
      title: 'Section 2: Types of Claims',
      lessons: [
        {
          id: 'lesson-3',
          title: 'Disparate Treatment',
          estimatedTime: 'Estimated time: 20 minutes',
          content: [
            'Disparate treatment is the most common theory of discrimination. It occurs when an employer treats an employee less favorably than similarly situated employees because of a protected characteristic.',
            "To establish a disparate treatment claim, a complainant must show that: they are a member of a protected class, they suffered an adverse employment action, and there is an inference that the action was motivated by discriminatory intent.",
            "Investigators look for comparative evidence — how were employees outside the complainant's protected class treated under similar circumstances? Inconsistencies in disciplinary records, promotions, or performance reviews are key indicators.",
            'Direct evidence of discriminatory intent, such as a discriminatory statement by a decision-maker, is rare. Most cases rely on circumstantial evidence and the burden-shifting framework established in McDonnell Douglas Corp. v. Green.',
          ],
          narrationPlaceholder: 'Audio narration for Disparate Treatment coming soon.',
        },
        {
          id: 'lesson-4',
          title: 'Hostile Work Environment',
          estimatedTime: 'Estimated time: 25 minutes',
          content: [
            'A hostile work environment claim arises when an employee is subjected to unwelcome conduct based on a protected characteristic that is severe or pervasive enough to create an abusive working environment.',
            'The conduct must be both subjectively and objectively offensive — meaning the complainant found it hostile and a reasonable person in the same situation would also find it hostile.',
            'Investigators must assess the totality of circumstances, including the frequency of the conduct, its severity, whether it was physically threatening or humiliating, and whether it unreasonably interfered with work performance.',
            'Employer liability depends in part on whether the harasser was a supervisor or co-worker, and whether the employer knew or should have known about the conduct and failed to take prompt corrective action.',
          ],
          narrationPlaceholder: 'Audio narration for Hostile Work Environment coming soon.',
        },
      ],
    },
  ],
}

function loadActiveCourse(): Course {
  try {
    const raw = localStorage.getItem('generatedCertification')
    if (raw) {
      const gen = JSON.parse(raw)
      console.log('Using generated certification')
      const sections: Section[] = (gen.lessons as { section: string; lessons: { title: string; estimatedTime: string; content: string[] }[] }[]).map((group, si) => ({
        id: `section-${si + 1}`,
        title: group.section,
        lessons: group.lessons.map((lesson, li) => ({
          id: `lesson-${si + 1}-${li + 1}`,
          title: lesson.title,
          estimatedTime: lesson.estimatedTime,
          content: lesson.content,
          narrationPlaceholder: `Audio narration for ${lesson.title} coming soon.`,
        })),
      }))
      return { id: COURSE.id, title: COURSE.title, sections }
    }
  } catch { /* ignore parse errors */ }
  console.log('Using default COURSE')
  return COURSE
}

function loadActiveQuizzes(): SectionQuiz[] {
  try {
    const raw = localStorage.getItem('generatedCertification')
    if (raw) {
      const gen = JSON.parse(raw)
      if (Array.isArray(gen.sectionQuizzes) && gen.sectionQuizzes[0]?.questions?.[0]?.question) {
        return (gen.sectionQuizzes as { section: string; questions: { question: string; options: string[]; correctIndex: number }[] }[]).map((sq, si) => ({
          sectionId: `section-${si + 1}`,
          questions: sq.questions.map((q, qi) => ({
            id: `gen-q${si + 1}-${qi + 1}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        }))
      }
    }
  } catch { /* ignore parse errors */ }
  return QUIZZES
}

function loadActiveFinalExam(): QuizQuestion[] {
  try {
    const raw = localStorage.getItem('generatedCertification')
    if (raw) {
      const gen = JSON.parse(raw)
      if (Array.isArray(gen.finalExam?.questions) && gen.finalExam.questions[0]?.question) {
        return gen.finalExam.questions.map((q: { question: string; options: string[]; correctIndex: number }, i: number) => ({
          id: `gen-fe-${i + 1}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
        }))
      }
    }
  } catch { /* ignore parse errors */ }
  return FINAL_EXAM_QUESTIONS
}

const ACTIVE_COURSE = loadActiveCourse()
const ACTIVE_QUIZZES = loadActiveQuizzes()
const ACTIVE_FINAL_EXAM = loadActiveFinalExam()

const ALL_LESSONS = ACTIVE_COURSE.sections.flatMap((s) => s.lessons)

type QuizResult = 'passed' | 'failed'

interface CompletionContextValue {
  completed: Set<string>
  toggle: (id: string) => void
  quizResults: Record<string, QuizResult>
  setQuizResult: (sectionId: string, result: QuizResult) => void
  finalExamResult: QuizResult | null
  setFinalExamResult: (result: QuizResult) => void
  paid: boolean
  paidLoading: boolean
  refetchPaidStatus: () => void
}

const CompletionContext = createContext<CompletionContextValue>({
  completed: new Set(),
  toggle: () => {},
  quizResults: {},
  setQuizResult: () => {},
  finalExamResult: null,
  setFinalExamResult: () => {},
  paid: false,
  paidLoading: true,
  refetchPaidStatus: () => {},
})

function useCompletion() {
  return useContext(CompletionContext)
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage() {
  const { paid } = useCompletion()
  const { user } = useUser()
  const [purchasing, setPurchasing] = useState(false)

  async function handlePurchase() {
    setPurchasing(true)
    try {
      const base = import.meta.env.VITE_API_URL ?? ''
      const res = await fetch(`${base}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user?.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setPurchasing(false)
    } catch {
      setPurchasing(false)
    }
  }

  return (
    <>
    <div className="home-shell">
      <header className="home-brand">
        <h1>Workplace Compliance Institute</h1>
        <hr className="home-brand-rule" />
        <p>Professional Certification &amp; Training</p>
      </header>

      <main>
        <h2 className="home-cta-title">EEO Investigator Certification</h2>
        <p className="home-cta-desc">
          Complete a self-paced training program and earn a verifiable certification in federal equal employment opportunity law and investigation.
        </p>

        <SignedOut>
          {paid ? (
            <Link to="/sign-in" className="btn-primary">Log In</Link>
          ) : (
            <div className="home-btn-row">
              <Link to="/sign-up" className="btn-primary">Start Certification</Link>
              <Link to="/sign-in" className="btn-secondary">Log In</Link>
            </div>
          )}
        </SignedOut>

        <SignedIn>
          {paid ? (
            <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="btn-teal"
              style={{ opacity: purchasing ? 0.7 : 1 }}
            >
              {purchasing ? 'Redirecting…' : 'Purchase Certification'}
            </button>
          )}
        </SignedIn>

        <p className="home-verify-link">
          <Link to="/verify">Verify a Certificate</Link>
        </p>
      </main>

    </div>

      <footer style={{ position: 'fixed', bottom: 'var(--sp-4)', left: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
        <Link to="/admin/sign-in" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', pointerEvents: 'auto' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >Admin</Link>
      </footer>
    </>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { completed, quizResults } = useCompletion()
  const totalLessons = ACTIVE_COURSE.sections.reduce((sum, s) => sum + s.lessons.length, 0)
  const quizzesPassed = ACTIVE_COURSE.sections.filter((s) => quizResults[s.id] === 'passed').length

  const [ceuStatusText, setCeuStatusText] = useState("")

  useEffect(() => {
    if (!user?.id) return
    const base = import.meta.env.VITE_API_URL ?? ''
    fetch(`${base}/payment-status?clerkUserId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ceuAccessUntil) return
        const until = new Date(data.ceuAccessUntil)
        const now = new Date()
        if (until <= now) {
          setCeuStatusText('CEU access expired — renew to continue')
        } else {
          const days = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          setCeuStatusText(`CEU access: ${days} day${days === 1 ? '' : 's'} remaining`)
        }
      })
      .catch(() => {})
  }, [user?.id])

  return (
    <div className="page-shell">
      <Link to="/" className="page-back-link" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'underline', marginBottom: '12px' }}>← Back to Home</Link>
      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-meta">{user?.primaryEmailAddress?.emailAddress}</p>
      </div>

      <hr className="dash-divider" />

      <div
        className="info-panel info-panel--warm info-panel--featured"
        style={{ marginBottom: ceuStatusText ? 'var(--sp-3)' : 'var(--sp-6)' }}
      >
        <p className="info-panel__title">EEO Investigator Certification</p>
        <p className="dash-course-desc">
          A structured program covering federal equal employment opportunity law,
          complaint investigation procedures, and agency compliance standards.
        </p>
        <p className="dash-course-progress">
          {completed.size} of {totalLessons} lessons completed
          {quizzesPassed > 0 &&
            ` · ${quizzesPassed} of ${ACTIVE_COURSE.sections.length} section quizzes passed`}
        </p>
      </div>

      {ceuStatusText && <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{ceuStatusText}</p>}
      <div className="action-row">
        <Link to="/course" className="link-btn">View Course</Link>
        <Link to="/ceu" className="btn-primary">Renew Certification</Link>
        <SignOutButton />
      </div>
    </div>
  )
}

// ─── Course Page ──────────────────────────────────────────────────────────────

const TOTAL_LESSONS = ACTIVE_COURSE.sections.reduce((sum, s) => sum + s.lessons.length, 0)

function CoursePage() {
  const { completed, quizResults, finalExamResult } = useCompletion()
  const location = useLocation()
  const quizSummary = (
    location.state as {
      quizSummary?: {
        correct: number
        total: number
        passed: boolean
        sectionTitle: string
      }
    } | null
  )?.quizSummary

  const allLessonsDone = ALL_LESSONS.every((l) => completed.has(l.id))
  const allQuizzesPassed = ACTIVE_COURSE.sections.every((s) => quizResults[s.id] === 'passed')
  const eligible = allLessonsDone && allQuizzesPassed

  return (
    <div className="page-shell">
      <Link to="/dashboard" className="page-back-link">← Back to Dashboard</Link>

      <div className="page-header">
        <h1 className="page-title">{ACTIVE_COURSE.title}</h1>
        <p className="page-subtitle">
          Progress: {completed.size} of {TOTAL_LESSONS} lessons completed
        </p>
      </div>

      {/* Certification requirements */}
      <div className="info-panel" style={{ marginBottom: 'var(--sp-5)' }}>
        <p className="info-panel__title">Certification Requirements</p>
        <ul className="req-list">
          <li style={{ color: allLessonsDone ? 'var(--color-success)' : 'inherit' }}>
            All lessons completed: {allLessonsDone ? '✓ Yes' : 'No'}
          </li>
          <li style={{ color: allQuizzesPassed ? 'var(--color-success)' : 'inherit' }}>
            All section quizzes passed: {allQuizzesPassed ? '✓ Yes' : 'No'}
          </li>
          <li
            style={{
              color:
                finalExamResult === 'passed'
                  ? 'var(--color-success)'
                  : finalExamResult === 'failed'
                  ? 'var(--color-error)'
                  : 'inherit',
            }}
          >
            Final exam:{' '}
            {finalExamResult === 'passed'
              ? '✓ Passed'
              : finalExamResult === 'failed'
              ? '✗ Failed'
              : 'Not started'}
          </li>
        </ul>
      </div>

      {/* Quiz result notice */}
      {quizSummary && (
        <div className="info-panel info-panel--notice" style={{ marginBottom: 'var(--sp-5)' }}>
          <strong>{quizSummary.sectionTitle}:</strong> You scored {quizSummary.correct} out of{' '}
          {quizSummary.total}.{' '}
          <span
            style={{
              color: quizSummary.passed ? 'var(--color-success)' : 'var(--color-error)',
              fontWeight: 600,
            }}
          >
            {quizSummary.passed
              ? 'Section passed.'
              : 'You must review the section before retrying.'}
          </span>
        </div>
      )}

      {/* Certification / exam status bar */}
      {finalExamResult === 'passed' ? (
        <div className="status-bar status-bar--certified">
          <span className="status-label" style={{ color: 'var(--color-gold)' }}>
            ✓ Certified
          </span>
          <Link to="/certificate">View Certificate →</Link>
        </div>
      ) : (
        <div className="status-bar">
          <span
            className="status-label"
            style={{
              color: eligible ? 'var(--color-success)' : 'var(--text-muted)',
            }}
          >
            {eligible ? '✓ Certification Unlocked' : '⊘ Certification Locked'}
          </span>
          {eligible ? (
            <Link to="/final-exam" className="btn-primary" style={{ fontSize: '0.75rem' }}>
              Take Final Exam
            </Link>
          ) : (
            <button disabled className="btn-primary" style={{ fontSize: '0.75rem', opacity: 0.35, cursor: 'not-allowed' }}>
              Take Final Exam
            </button>
          )}
        </div>
      )}

      {/* Sections */}
      {ACTIVE_COURSE.sections.map((section) => {
        const quizResult = quizResults[section.id]
        const quizLabel =
          quizResult === 'passed'
            ? '✓ Passed'
            : quizResult === 'failed'
            ? '✗ Failed'
            : 'Not started'

        return (
          <div key={section.id} className="section-block">
            <h2>{section.title}</h2>
            <div className="lesson-list">
              {section.lessons.map((lesson) => (
                <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                  {completed.has(lesson.id) ? '✓ ' : ''}
                  {lesson.title}
                </Link>
              ))}
            </div>
            <div className="quiz-row">
              <Link to={`/quiz/${section.id}`}>Start Quiz</Link>
              <span
                className="quiz-status"
                style={{
                  color:
                    quizResult === 'passed'
                      ? 'var(--color-success)'
                      : quizResult === 'failed'
                      ? 'var(--color-error)'
                      : 'var(--text-muted)',
                }}
              >
                Quiz: {quizLabel}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Lesson Page ──────────────────────────────────────────────────────────────

function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const { completed, toggle } = useCompletion()

  let foundLesson: {
    section: (typeof ACTIVE_COURSE.sections)[0]
    lesson: (typeof ACTIVE_COURSE.sections)[0]['lessons'][0]
  } | null = null

  for (const section of ACTIVE_COURSE.sections) {
    const lesson = section.lessons.find((l) => l.id === id)
    if (lesson) {
      foundLesson = { section, lesson }
      break
    }
  }

  if (!foundLesson) {
    return (
      <div className="page-shell">
        <p>Lesson not found.</p>
        <Link to="/course" className="page-back-link">← Back to Course</Link>
      </div>
    )
  }

  const { section, lesson } = foundLesson
  const lessonIndex = ALL_LESSONS.findIndex((l) => l.id === id)
  const prevLesson = lessonIndex > 0 ? ALL_LESSONS[lessonIndex - 1] : null
  const nextLesson = lessonIndex < ALL_LESSONS.length - 1 ? ALL_LESSONS[lessonIndex + 1] : null
  const isDone = completed.has(lesson.id)

  return (
    <div className="page-shell">
      <Link to="/course" className="page-back-link">← Back to Course</Link>

      <div className="lesson-header">
        <p className="lesson-section-label">{section.title}</p>
        <h1 className="lesson-title">{lesson.title}</h1>
        <p className="lesson-meta">{lesson.estimatedTime}</p>
      </div>

      <div className="lesson-body">
        {lesson.content.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="lesson-audio">{lesson.narrationPlaceholder}</div>

      <div className="lesson-complete-row">
        <button onClick={() => toggle(lesson.id)}>
          {isDone ? 'Mark as Incomplete' : 'Mark as Complete'}
        </button>
        <span
          className="lesson-complete-status"
          style={{ color: isDone ? 'var(--color-success)' : 'var(--text-muted)' }}
        >
          {isDone ? '✓ Completed' : 'Not completed'}
        </span>
      </div>

      <div className="lesson-nav">
        {prevLesson ? (
          <Link to={`/lesson/${prevLesson.id}`}>← Previous Lesson</Link>
        ) : (
          <span />
        )}
        {nextLesson && <Link to={`/lesson/${nextLesson.id}`}>Next Lesson →</Link>}
      </div>

      <div className="lesson-nav-back">
        <Link to="/course">Back to Course</Link>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  )
}

// ─── Quiz Page ────────────────────────────────────────────────────────────────

function QuizPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const { setQuizResult } = useCompletion()
  const navigate = useNavigate()

  const quiz = ACTIVE_QUIZZES.find((q) => q.sectionId === sectionId)
  const section = ACTIVE_COURSE.sections.find((s) => s.id === sectionId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    quiz ? Array(quiz.questions.length).fill(null) : []
  )

  if (!quiz || !section) {
    return (
      <div className="quiz-shell">
        <p>Quiz not found.</p>
        <Link to="/course" className="page-back-link">← Back to Course</Link>
      </div>
    )
  }

  const question = quiz.questions[currentIndex]
  const selected = answers[currentIndex]
  const isLast = currentIndex === quiz.questions.length - 1
  const progressPct = Math.round((currentIndex / quiz.questions.length) * 100)

  return (
    <div className="quiz-shell">
      <Link to="/course" className="page-back-link">← Back to Course</Link>

      <p className="quiz-context">{section.title}</p>
      <h1 className="quiz-heading">Section Quiz</h1>

      <div className="quiz-progress">
        <div className="quiz-progress__fill" style={{ width: `${progressPct}%` }} />
      </div>

      <p className="quiz-counter">
        Question {currentIndex + 1} of {quiz.questions.length}
      </p>

      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options">
        {question.options.map((option, i) => (
          <button
            key={i}
            className={`quiz-option${selected === i ? ' quiz-option--selected' : ''}`}
            onClick={() =>
              setAnswers((prev) => {
                const next = [...prev]
                next[currentIndex] = i
                return next
              })
            }
          >
            <span className="quiz-option__dot" />
            <span className="quiz-option__label">{option}</span>
          </button>
        ))}
      </div>

      <button
        className="quiz-submit"
        disabled={selected === null}
        onClick={() => {
          if (isLast) {
            const correct = answers.filter(
              (a, i) => a === quiz.questions[i].correctIndex
            ).length
            const total = quiz.questions.length
            const passed = correct / total >= 0.8
            setQuizResult(section.id, passed ? 'passed' : 'failed')
            navigate('/course', {
              state: {
                quizSummary: {
                  correct,
                  total,
                  passed,
                  sectionTitle: section.title,
                },
              },
            })
          } else {
            setCurrentIndex((i) => i + 1)
          }
        }}
      >
        {isLast ? 'Submit Quiz' : 'Next Question'}
      </button>
    </div>
  )
}

// ─── Final Exam Page ──────────────────────────────────────────────────────────

const DEV_BYPASS_FINAL_EXAM = false // TODO: remove before production

function FinalExamPage() {
  const { completed, quizResults, finalExamResult, setFinalExamResult } = useCompletion()
  const { user } = useUser()
  const allLessonsDone = ALL_LESSONS.every((l) => completed.has(l.id))
  const allQuizzesPassed = ACTIVE_COURSE.sections.every((s) => quizResults[s.id] === 'passed')
  const eligible = DEV_BYPASS_FINAL_EXAM || (allLessonsDone && allQuizzesPassed)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(ACTIVE_FINAL_EXAM.length).fill(null)
  )
  const [showResults, setShowResults] = useState(false)

  if (!eligible) {
    return (
      <div className="exam-shell">
        <Link to="/course" className="page-back-link">← Back to Course</Link>
        <div className="info-panel info-panel--notice" style={{ marginTop: 'var(--sp-6)' }}>
          You must complete all lessons and pass all section quizzes before taking the final exam.
        </div>
      </div>
    )
  }

  if (finalExamResult === 'passed') {
    return (
      <div className="exam-shell">
        <Link to="/course" className="page-back-link">← Back to Course</Link>
        <div
          className="status-bar status-bar--certified"
          style={{ marginTop: 'var(--sp-6)' }}
        >
          <span className="status-label" style={{ color: 'var(--color-gold)' }}>
            ✓ Final Exam Passed
          </span>
          <Link to="/certificate">View Certificate →</Link>
        </div>
      </div>
    )
  }

  if (showResults) {
    const correct = answers.filter(
      (a, i) => a === ACTIVE_FINAL_EXAM[i].correctIndex
    ).length
    const total = ACTIVE_FINAL_EXAM.length
    const passed = correct / total >= 0.8

    return (
      <div className="exam-shell">
        <h1 className="page-title" style={{ marginBottom: 'var(--sp-6)' }}>
          Final Exam Results
        </h1>
        <div className="exam-results-panel">
          <p className="results-label">Score</p>
          <p className="results-score">
            {correct}/{total}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: passed ? 'var(--color-success)' : 'var(--color-error)',
              marginTop: 'var(--sp-3)',
            }}
          >
            {passed ? '✓ Final exam passed.' : '✗ Final exam failed.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
          {!passed && (
            <button
              className="btn-primary"
              onClick={() => {
                setAnswers(Array(ACTIVE_FINAL_EXAM.length).fill(null))
                setCurrentIndex(0)
                setShowResults(false)
              }}
            >
              Retry Exam
            </button>
          )}
          <Link to="/course" className="btn-secondary">
            Back to Course
          </Link>
        </div>
      </div>
    )
  }

  const question = ACTIVE_FINAL_EXAM[currentIndex]
  const selected = answers[currentIndex]
  const isLast = currentIndex === ACTIVE_FINAL_EXAM.length - 1
  const progressPct = Math.round((currentIndex / ACTIVE_FINAL_EXAM.length) * 100)

  return (
    <div className="exam-shell">
      <Link to="/course" className="page-back-link">← Back to Course</Link>
      <h1 className="quiz-heading">Final Exam</h1>

      <div className="quiz-progress">
        <div className="quiz-progress__fill" style={{ width: `${progressPct}%` }} />
      </div>

      <p className="quiz-counter">
        Question {currentIndex + 1} of {ACTIVE_FINAL_EXAM.length}
      </p>

      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options">
        {question.options.map((option, i) => (
          <button
            key={i}
            className={`quiz-option${selected === i ? ' quiz-option--selected' : ''}`}
            onClick={() =>
              setAnswers((prev) => {
                const next = [...prev]
                next[currentIndex] = i
                return next
              })
            }
          >
            <span className="quiz-option__dot" />
            <span className="quiz-option__label">{option}</span>
          </button>
        ))}
      </div>

      <button
        className="quiz-submit"
        disabled={selected === null}
        onClick={() => {
          if (isLast) {
            const correct = answers.filter(
              (a, i) => a === ACTIVE_FINAL_EXAM[i].correctIndex
            ).length
            const passed = correct / ACTIVE_FINAL_EXAM.length >= 0.8
            setFinalExamResult(passed ? 'passed' : 'failed')
            if (passed) {
              const email = user?.primaryEmailAddress?.emailAddress
              if (email) {
                const records: {
                  email: string
                  courseName: string
                  completionDate: string
                }[] = JSON.parse(
                  localStorage.getItem('wci_certifications') || '[]'
                )
                const date = new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                const idx = records.findIndex((r) => r.email === email)
                const record = { email, courseName: ACTIVE_COURSE.title, completionDate: date }
                if (idx >= 0) records[idx] = record
                else records.push(record)
                localStorage.setItem('wci_certifications', JSON.stringify(records))
              }
            }
            setShowResults(true)
          } else {
            setCurrentIndex((i) => i + 1)
          }
        }}
      >
        {isLast ? 'Submit Exam' : 'Next Question'}
      </button>
    </div>
  )
}

// ─── CEU Renewal Exam Page ────────────────────────────────────────────────────

function CeuPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [searchParams] = useSearchParams()
  const certId = searchParams.get('certId')
  const returnType = searchParams.get('type')
  const justPaid = returnType === 'paid'

  const [accessChecked, setAccessChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    getToken().then((token) => {
      fetch('/my-certification', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => { if (data?.expiresAt) setExpiresAt(new Date(data.expiresAt).toLocaleDateString()) })
        .catch(() => {})
    })
  }, [getToken])

  useEffect(() => {
    if (justPaid) { setAllowed(true); setAccessChecked(true); return }
    const url = certId ? `/ceu-access?certId=${encodeURIComponent(certId)}` : '/ceu-access'
    getToken().then((token) => {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => { setAllowed(!!data.allowed); setAccessChecked(true) })
        .catch(() => setAccessChecked(true))
    })
  }, [certId, justPaid, getToken])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(CEU_QUESTIONS.length).fill(null)
  )
  const [showResults, setShowResults] = useState(false)

  if (!accessChecked) {
    return <div className="exam-shell"><p>Loading...</p></div>
  }

  if (!allowed) {
    return (
      <div className="exam-shell">
        <h1 className="page-title" style={{ marginBottom: 'var(--sp-6)' }}>Certification Renewal (CEU)</h1>
        {expiresAt && <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-muted)', marginBottom: 'var(--sp-4)' }}>Current Expiration: {expiresAt}</p>}
        <div className="info-panel info-panel--notice" style={{ marginTop: 'var(--sp-6)' }}>
          Payment required to access the CEU renewal exam.
        </div>
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <button
            className="btn-primary"
            onClick={async () => {
              const token = await getToken()
              const base = import.meta.env.VITE_API_URL ?? ''
              const res = await fetch(`${base}/create-ceu-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ certId }),
              })
              const text = await res.text()
              let data: any = {}
              try { data = JSON.parse(text) } catch { /* non-JSON error response */ }
              if (data.url) window.location.href = data.url
            }}
          >
            Purchase CEU Renewal
          </button>
        </div>
      </div>
    )
  }

  if (showResults) {
    const correct = answers.filter(
      (a, i) => a === CEU_QUESTIONS[i].correctIndex
    ).length
    const total = CEU_QUESTIONS.length
    const passed = correct / total >= 0.8

    return (
      <div className="exam-shell">
        <h1 className="page-title" style={{ marginBottom: 'var(--sp-6)' }}>
          Certification Renewal (CEU) Results
        </h1>
        {passed && (
          <div className="info-panel info-panel--success" style={{ marginBottom: 'var(--sp-6)' }}>
            Your certification has been successfully renewed.
          </div>
        )}
        <div className="exam-results-panel">
          <p className="results-label">Score</p>
          <p className="results-score">{correct}/{total}</p>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: passed ? 'var(--color-success)' : 'var(--color-error)',
              marginTop: 'var(--sp-3)',
            }}
          >
            {passed ? '✓ Renewal exam passed.' : '✗ Renewal exam failed.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
          {!passed && (
            <button
              className="btn-primary"
              onClick={() => {
                setAnswers(Array(CEU_QUESTIONS.length).fill(null))
                setCurrentIndex(0)
                setShowResults(false)
              }}
            >
              Retry Exam
            </button>
          )}
          <Link to="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const question = CEU_QUESTIONS[currentIndex]
  const selected = answers[currentIndex]
  const isLast = currentIndex === CEU_QUESTIONS.length - 1
  const progressPct = Math.round((currentIndex / CEU_QUESTIONS.length) * 100)

  return (
    <div className="exam-shell">
      <Link to="/dashboard" className="page-back-link">← Back to Dashboard</Link>
      <h1 className="quiz-heading">Certification Renewal (CEU)</h1>
      {expiresAt && <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-muted)', marginBottom: 'var(--sp-4)' }}>Current Expiration: {expiresAt}</p>}

      <div className="quiz-progress">
        <div className="quiz-progress__fill" style={{ width: `${progressPct}%` }} />
      </div>

      <p className="quiz-counter">
        Question {currentIndex + 1} of {CEU_QUESTIONS.length}
      </p>

      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options">
        {question.options.map((option, i) => (
          <button
            key={i}
            className={`quiz-option${selected === i ? ' quiz-option--selected' : ''}`}
            onClick={() =>
              setAnswers((prev) => {
                const next = [...prev]
                next[currentIndex] = i
                return next
              })
            }
          >
            <span className="quiz-option__dot" />
            <span className="quiz-option__label">{option}</span>
          </button>
        ))}
      </div>

      <button
        className="quiz-submit"
        disabled={selected === null}
        onClick={async () => {
          if (isLast) {
            const correct = answers.filter(
              (a, i) => a === CEU_QUESTIONS[i].correctIndex
            ).length
            const passed = correct / CEU_QUESTIONS.length >= 0.8

            if (passed && user?.id) {
              // Trigger CEU renewal on pass (certId may be null for external users)
              try {
                await fetch('/ceu-complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clerkUserId: user.id, certId }),
                })
              } catch (err) {
                console.error('Failed to record CEU renewal:', err)
              }
            }

            setShowResults(true)
          } else {
            setCurrentIndex((i) => i + 1)
          }
        }}
      >
        {isLast ? 'Submit Exam' : 'Next Question'}
      </button>
    </div>
  )
}

function ProtectedCeu() {
  return (
    <>
      <SignedIn><CeuPage /></SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

// ─── Certificate Page ─────────────────────────────────────────────────────────

function CertificatePage() {
  const { finalExamResult } = useCompletion()
  const { user } = useUser()

  if (finalExamResult !== 'passed') return <Navigate to="/course" replace />

  const email = user?.primaryEmailAddress?.emailAddress ?? 'the participant'
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="certificate-shell">
      <div className="no-print certificate-actions">
        <Link to="/course" className="btn-secondary">← Back to Course</Link>
        <button className="btn-primary" onClick={() => window.print()}>
          Download PDF
        </button>
      </div>

      <div className="certificate-document">
        <p className="certificate-institute">Workplace Compliance Institute</p>

        <h1 className="certificate-heading">Certificate of Completion</h1>

        <p className="certificate-presents">This certifies that</p>

        <p className="certificate-name">{email}</p>

        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
          }}
        >
          has successfully completed the course
        </p>

        <p className="certificate-course">EEO Investigator Certification</p>

        <hr className="certificate-divider" />

        <p className="certificate-date">Issued {date}</p>
      </div>
    </div>
  )
}

// ─── Verify Page ──────────────────────────────────────────────────────────────

function VerifyPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<
    { email: string; courseName: string; completionDate: string } | 'not-found' | null
  >(null)

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const records: { email: string; courseName: string; completionDate: string }[] = JSON.parse(
      localStorage.getItem('wci_certifications') || '[]'
    )
    const found = records.find((r) => r.email.toLowerCase() === email.toLowerCase())
    setResult(found ?? 'not-found')
  }

  return (
    <div className="verify-shell">
      <Link to="/" className="page-back-link">← Back to Home</Link>

      <div className="verify-hero">
        <h1>Verify Certificate</h1>
        <p>Enter an email address to confirm certification status.</p>
      </div>

      <form onSubmit={handleSubmit} className="verify-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="verify-input"
        />
        <button type="submit" className="verify-submit">
          Check Status
        </button>
      </form>

      {result === 'not-found' && (
        <div className="verify-result verify-result--invalid">
          <span className="verify-badge verify-badge--invalid">✗ Not Found</span>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: 'var(--color-error)',
            }}
          >
            No certification found for this email address.
          </p>
        </div>
      )}

      {result && result !== 'not-found' && (
        <div className="verify-result verify-result--valid">
          <span className="verify-badge verify-badge--valid">✓ Verified</span>
          <table className="verify-detail-table">
            <tbody>
              <tr>
                <td>Course</td>
                <td>{result.courseName}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>Certified</td>
              </tr>
              <tr>
                <td>Completion Date</td>
                <td>{result.completionDate}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Checkout Pages ───────────────────────────────────────────────────────────

function CheckoutSuccessPage() {
  const { refetchPaidStatus, paid, paidLoading } = useCompletion()
  const { isLoaded, isSignedIn } = useUser()

  // Once Clerk resolves, refetch paid status from the server so the gate
  // reflects the real post-payment state without writing anything locally.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refetchPaidStatus()
    }
    // refetchPaidStatus is intentionally excluded: we only want this to fire
    // when Clerk finishes loading, not on every context re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  if (paidLoading) {
    return (
      <div className="checkout-shell">
        <h1>Verifying payment…</h1>
        <p>Please wait while we confirm your purchase.</p>
      </div>
    )
  }

  if (!paid) {
    return (
      <div className="checkout-shell">
        <h1>Payment Not Verified</h1>
        <p>We couldn't confirm a completed payment for this account. If you believe this is an error, please contact support.</p>
        <Link to="/" className="btn-secondary">Return Home →</Link>
      </div>
    )
  }

  return (
    <div className="checkout-shell">
      <h1>Payment Successful</h1>
      <p>Your certification purchase was confirmed. You now have full access to the course.</p>
      <Link to="/dashboard" className="btn-primary">Continue to Dashboard →</Link>
    </div>
  )
}

function CheckoutCancelPage() {
  return (
    <div className="checkout-shell">
      <h1>Checkout Canceled</h1>
      <p>Your purchase was not completed. You can try again whenever you're ready.</p>
      <Link to="/" className="btn-secondary">Return Home →</Link>
    </div>
  )
}

// ─── Guards ───────────────────────────────────────────────────────────────────

const DEV_BYPASS_PAID_GUARD = false // TODO: remove before production

function PaidGuard({ children }: { children: React.ReactNode }) {
  const { paid, paidLoading } = useCompletion()
  const { isLoaded: clerkLoaded, isSignedIn } = useUser()
  if (DEV_BYPASS_PAID_GUARD) return <>{children}</>
  if (!clerkLoaded || !isSignedIn || paidLoading) return null
  if (!paid) return <Navigate to="/" replace />
  return <>{children}</>
}

function ProtectedDashboard() {
  return (
    <>
      <SignedIn><DashboardPage /></SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

function ProtectedCourse() {
  return (
    <>
      <SignedIn><PaidGuard><CoursePage /></PaidGuard></SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

function ProtectedLesson() {
  return (
    <>
      <SignedIn><PaidGuard><LessonPage /></PaidGuard></SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

function ProtectedQuiz() {
  return (
    <>
      <SignedIn><PaidGuard><QuizPage /></PaidGuard></SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

function ProtectedFinalExam() {
  return (
    <>
      <SignedIn><PaidGuard><FinalExamPage /></PaidGuard></SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

function ProtectedCertificate() {
  return (
    <>
      <SignedIn><PaidGuard><CertificatePage /></PaidGuard></SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { user } = useUser()
  const userId = user?.id ?? null

  // State starts empty; useEffect below loads the correct user's data once
  // Clerk resolves the session and whenever the active user changes.
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({})
  const [finalExamResult, setFinalExamResultState] = useState<QuizResult | null>(null)
  const [paid, setPaidState] = useState<boolean>(false)
  const [paidLoading, setPaidLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!userId) {
      // No authenticated user — reset everything to clean defaults.
      setCompleted(new Set())
      setQuizResults({})
      setFinalExamResultState(null)
      setPaidState(false)
      setPaidLoading(false)
      return
    }
    try {
      const s = localStorage.getItem(`wci_completed_lessons_${userId}`)
      setCompleted(s ? new Set(JSON.parse(s)) : new Set())
    } catch { setCompleted(new Set()) }

    try {
      const s = localStorage.getItem(`wci_quiz_results_${userId}`)
      setQuizResults(s ? JSON.parse(s) : {})
    } catch { setQuizResults({}) }

    const exam = localStorage.getItem(`wci_final_exam_result_${userId}`)
    setFinalExamResultState(exam === 'passed' || exam === 'failed' ? exam : null)

    // Fetch paid status from the server — this is the authoritative source.
    const controller = new AbortController()
    loadPaidStatus(userId, controller.signal)
    return () => { controller.abort() }
  }, [userId])

  const loadPaidStatus = (uid: string, signal?: AbortSignal) => {
    const base = import.meta.env.VITE_API_URL ?? ''
    setPaidLoading(true)
    fetch(`${base}/payment-status?clerkUserId=${uid}`, { signal })
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json() })
      .then((data) => { setPaidState(data.paid === true); setPaidLoading(false) })
      .catch((err) => {
        if (err.name === 'AbortError') return
        // Network error: fall back to localStorage so the app stays usable offline
        setPaidState(localStorage.getItem(`wci_paid_user_${uid}`) === 'true')
        setPaidLoading(false)
      })
  }

  const toggle = (id: string) => {
    if (!userId) return
    setCompleted((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(`wci_completed_lessons_${userId}`, JSON.stringify([...next]))
      return next
    })
  }

  const setQuizResult = (sectionId: string, result: QuizResult) => {
    if (!userId) return
    setQuizResults((prev) => {
      const next = { ...prev, [sectionId]: result }
      localStorage.setItem(`wci_quiz_results_${userId}`, JSON.stringify(next))
      return next
    })
  }

  const setFinalExamResult = (result: QuizResult) => {
    if (!userId) return
    localStorage.setItem(`wci_final_exam_result_${userId}`, result)
    setFinalExamResultState(result)
  }

  const refetchPaidStatus = () => {
    if (!userId) return
    loadPaidStatus(userId)
  }

  return (
    <CompletionContext.Provider
      value={{
        completed,
        toggle,
        quizResults,
        setQuizResult,
        finalExamResult,
        setFinalExamResult,
        paid,
        paidLoading,
        refetchPaidStatus,
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in/*" element={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'var(--sp-10)' }}><div style={{ width: 'fit-content' }}><Link to="/" className="page-back-link" style={{ display: 'inline-block', marginBottom: '12px', color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'underline' }}>← Back to Home</Link><SignIn routing="path" path="/sign-in" /></div></div>} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/course" element={<ProtectedCourse />} />
        <Route path="/lesson/:id" element={<ProtectedLesson />} />
        <Route path="/quiz/:sectionId" element={<ProtectedQuiz />} />
        <Route path="/final-exam" element={<ProtectedFinalExam />} />
        <Route path="/certificate" element={<ProtectedCertificate />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout-cancel" element={<CheckoutCancelPage />} />
        <Route path="/ceu" element={<ProtectedCeu />} />
        <Route path="/admin/sign-in/*" element={<SignIn routing="path" path="/admin/sign-in" fallbackRedirectUrl="/admin/ai-content" />} />
        <Route path="/admin/ai-content" element={<><SignedIn><AdminAiContentPage /></SignedIn><SignedOut><Navigate to="/admin/sign-in" replace /></SignedOut></>} />
      </Routes>
    </CompletionContext.Provider>
  )
}
