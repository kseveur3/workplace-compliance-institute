import { useState, createContext, useContext } from 'react'
import { Routes, Route, Link, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, SignOutButton, useUser } from '@clerk/clerk-react'

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
            'Amendments and related statutes — including the Pregnancy Discrimination Act and Title II of the Genetic Information Nondiscrimination Act — have expanded Title VII\'s protections over time.',
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
            'To establish a disparate treatment claim, a complainant must show that: they are a member of a protected class, they suffered an adverse employment action, and there is an inference that the action was motivated by discriminatory intent.',
            'Investigators look for comparative evidence — how were employees outside the complainant\'s protected class treated under similar circumstances? Inconsistencies in disciplinary records, promotions, or performance reviews are key indicators.',
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

const ALL_LESSONS = COURSE.sections.flatMap((s) => s.lessons)

type QuizResult = 'passed' | 'failed'

interface CompletionContextValue {
  completed: Set<string>
  toggle: (id: string) => void
  quizResults: Record<string, QuizResult>
  setQuizResult: (sectionId: string, result: QuizResult) => void
  finalExamResult: QuizResult | null
  setFinalExamResult: (result: QuizResult) => void
}

const CompletionContext = createContext<CompletionContextValue>({
  completed: new Set(),
  toggle: () => {},
  quizResults: {},
  setQuizResult: () => {},
  finalExamResult: null,
  setFinalExamResult: () => {},
})

function useCompletion() {
  return useContext(CompletionContext)
}

function HomePage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
          Workplace Compliance Institute
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: '#555', fontSize: '0.95rem' }}>
          Professional Certification &amp; Training
        </p>
      </header>

      <main>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem' }}>
          EEO Investigator Certification
        </h2>
        <p style={{ color: '#444', lineHeight: '1.6', margin: '0 0 2rem' }}>
          Complete a 40-hour, self-paced training program and earn a verifiable certification.
        </p>

        <SignedOut>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/sign-up"
              style={{
                padding: '0.6rem 1.4rem',
                background: 'var(--text-h)',
                color: 'var(--bg)',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Start Certification
            </Link>
            <Link
              to="/sign-in"
              style={{
                padding: '0.6rem 1.4rem',
                border: '1px solid var(--text-h)',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 600,
                color: 'var(--text-h)',
              }}
            >
              Log In
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <Link
            to="/dashboard"
            style={{
              padding: '0.6rem 1.4rem',
              background: 'var(--text-h)',
              color: 'var(--bg)',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </Link>
        </SignedIn>
      </main>
    </div>
  )
}

function DashboardPage() {
  const { user } = useUser()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>{user?.primaryEmailAddress?.emailAddress}</p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <Link to="/course">Start Course</Link>
        <SignOutButton />
      </div>
    </div>
  )
}

const TOTAL_LESSONS = COURSE.sections.reduce((sum, s) => sum + s.lessons.length, 0)

function CoursePage() {
  const { completed, quizResults, finalExamResult } = useCompletion()
  const location = useLocation()
  const quizSummary = (location.state as { quizSummary?: { correct: number; total: number; passed: boolean; sectionTitle: string } } | null)?.quizSummary

  const allLessonsDone = ALL_LESSONS.every((l) => completed.has(l.id))
  const allQuizzesPassed = COURSE.sections.every((s) => quizResults[s.id] === 'passed')
  const eligible = allLessonsDone && allQuizzesPassed

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h1 style={{ fontSize: '1.75rem', margin: '0.75rem 0 0.5rem' }}>{COURSE.title}</h1>
      <p style={{ marginBottom: '0.75rem' }}>Progress: {completed.size} of {TOTAL_LESSONS} lessons completed</p>

      <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
        <p style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>Certification Requirements</p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li style={{ color: allLessonsDone ? 'green' : 'inherit' }}>
            All lessons completed: {allLessonsDone ? '✓ Yes' : 'No'}
          </li>
          <li style={{ color: allQuizzesPassed ? 'green' : 'inherit' }}>
            All section quizzes passed: {allQuizzesPassed ? '✓ Yes' : 'No'}
          </li>
          <li style={{ color: finalExamResult === 'passed' ? 'green' : finalExamResult === 'failed' ? 'red' : 'inherit' }}>
            Final exam:{' '}
            {finalExamResult === 'passed' ? '✓ Passed' : finalExamResult === 'failed' ? '✗ Failed' : 'Not started'}
          </li>
        </ul>
      </div>

      {quizSummary && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.9rem' }}>
          <strong>{quizSummary.sectionTitle}:</strong>{' '}
          You scored {quizSummary.correct} out of {quizSummary.total}.{' '}
          <span style={{ color: quizSummary.passed ? 'green' : 'red', fontWeight: 600 }}>
            {quizSummary.passed ? 'Section passed.' : 'You must review the section before retrying.'}
          </span>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: 600, color: eligible ? 'green' : '#666' }}>
          {eligible ? '✓ Certification Unlocked' : '⊘ Certification Locked'}
        </span>
        {eligible ? (
          <Link to="/final-exam">Take Final Exam</Link>
        ) : (
          <button disabled>Take Final Exam</button>
        )}
      </div>
      {finalExamResult === 'passed' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/certificate">View Certificate →</Link>
        </div>
      )}

      {COURSE.sections.map((section) => {
        const quizResult = quizResults[section.id]
        const quizLabel = quizResult === 'passed' ? '✓ Passed' : quizResult === 'failed' ? '✗ Failed' : 'Not started'
        return (
          <div key={section.id} style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{section.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem' }}>
              {section.lessons.map((lesson) => (
                <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                  {completed.has(lesson.id) ? '✓ ' : ''}{lesson.title}
                </Link>
              ))}
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to={`/quiz/${section.id}`}>Start Quiz</Link>
                <span style={{ fontSize: '0.85rem', color: quizResult === 'passed' ? 'green' : quizResult === 'failed' ? 'red' : '#666' }}>
                  Quiz: {quizLabel}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const { completed, toggle } = useCompletion()

  let foundLesson: { section: (typeof COURSE.sections)[0]; lesson: (typeof COURSE.sections)[0]['lessons'][0] } | null = null
  for (const section of COURSE.sections) {
    const lesson = section.lessons.find((l) => l.id === id)
    if (lesson) {
      foundLesson = { section, lesson }
      break
    }
  }

  if (!foundLesson) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Lesson not found.</p>
        <Link to="/course">← Back to Course</Link>
      </div>
    )
  }

  const { section, lesson } = foundLesson
  const lessonIndex = ALL_LESSONS.findIndex((l) => l.id === id)
  const prevLesson = lessonIndex > 0 ? ALL_LESSONS[lessonIndex - 1] : null
  const nextLesson = lessonIndex < ALL_LESSONS.length - 1 ? ALL_LESSONS[lessonIndex + 1] : null
  const isDone = completed.has(lesson.id)

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <Link to="/course">← Back to Course</Link>
      <p style={{ margin: '1rem 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>{section.title}</p>
      <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0.25rem' }}>{lesson.title}</h1>
      <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>{lesson.estimatedTime}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {lesson.content.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '1rem',
        marginBottom: '2rem',
        color: '#666',
      }}>
        {lesson.narrationPlaceholder}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => toggle(lesson.id)}>
          {isDone ? 'Mark as Incomplete' : 'Mark as Complete'}
        </button>
        <span style={{ color: isDone ? 'green' : '#666', fontSize: '0.9rem' }}>
          {isDone ? '✓ Completed' : 'Not completed'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {prevLesson && <Link to={`/lesson/${prevLesson.id}`}>← Previous Lesson</Link>}
        {nextLesson && <Link to={`/lesson/${nextLesson.id}`}>Next Lesson →</Link>}
      </div>
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem' }}>
        <Link to="/course">Back to Course</Link>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  )
}

function ProtectedLesson() {
  return (
    <>
      <SignedIn>
        <LessonPage />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}

function QuizPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const { setQuizResult } = useCompletion()
  const navigate = useNavigate()

  const quiz = QUIZZES.find((q) => q.sectionId === sectionId)
  const section = COURSE.sections.find((s) => s.id === sectionId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => quiz ? Array(quiz.questions.length).fill(null) : [])

  if (!quiz || !section) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Quiz not found.</p>
        <Link to="/course">← Back to Course</Link>
      </div>
    )
  }

  const question = quiz.questions[currentIndex]
  const selected = answers[currentIndex]
  const isLast = currentIndex === quiz.questions.length - 1

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <Link to="/course">← Back to Course</Link>
      <p style={{ margin: '1rem 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>{section.title}</p>
      <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0 1rem' }}>Section Quiz</h1>
      <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
        Question {currentIndex + 1} of {quiz.questions.length}
      </p>
      <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{question.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {question.options.map((option, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={selected === i}
              onChange={() => setAnswers((prev) => { const next = [...prev]; next[currentIndex] = i; return next })}
            />
            {option}
          </label>
        ))}
      </div>
      <button
        disabled={selected === null}
        onClick={() => {
          if (isLast) {
            const correct = answers.filter((a, i) => a === quiz.questions[i].correctIndex).length
            const total = quiz.questions.length
            const passed = correct / total >= 0.8
            setQuizResult(section.id, passed ? 'passed' : 'failed')
            navigate('/course', { state: { quizSummary: { correct, total, passed, sectionTitle: section.title } } })
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

function ProtectedQuiz() {
  return (
    <>
      <SignedIn>
        <QuizPage />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}

function FinalExamPage() {
  const { completed, quizResults, setFinalExamResult } = useCompletion()
  const allLessonsDone = ALL_LESSONS.every((l) => completed.has(l.id))
  const allQuizzesPassed = COURSE.sections.every((s) => quizResults[s.id] === 'passed')
  const eligible = allLessonsDone && allQuizzesPassed

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(FINAL_EXAM_QUESTIONS.length).fill(null))
  const [showResults, setShowResults] = useState(false)

  if (!eligible) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>You must complete all lessons and pass all section quizzes before taking the final exam.</p>
        <Link to="/course">← Back to Course</Link>
      </div>
    )
  }

  if (showResults) {
    const correct = answers.filter((a, i) => a === FINAL_EXAM_QUESTIONS[i].correctIndex).length
    const total = FINAL_EXAM_QUESTIONS.length
    const passed = correct / total >= 0.8
    return (
      <div style={{ padding: '2rem', maxWidth: '640px' }}>
        <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem' }}>Final Exam Results</h1>
        <p style={{ marginBottom: '0.5rem' }}>You scored {correct} out of {total}.</p>
        <p style={{ fontWeight: 600, color: passed ? 'green' : 'red' }}>
          {passed ? 'Final exam passed.' : 'Final exam failed.'}
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          {!passed && (
            <button onClick={() => {
              setAnswers(Array(FINAL_EXAM_QUESTIONS.length).fill(null))
              setCurrentIndex(0)
              setShowResults(false)
            }}>
              Retry Exam
            </button>
          )}
          <Link to="/course">Back to Course</Link>
        </div>
      </div>
    )
  }

  const question = FINAL_EXAM_QUESTIONS[currentIndex]
  const selected = answers[currentIndex]
  const isLast = currentIndex === FINAL_EXAM_QUESTIONS.length - 1

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <Link to="/course">← Back to Course</Link>
      <h1 style={{ fontSize: '1.75rem', margin: '0.75rem 0 1rem' }}>Final Exam</h1>
      <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
        Question {currentIndex + 1} of {FINAL_EXAM_QUESTIONS.length}
      </p>
      <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{question.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {question.options.map((option, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name={`fe-${question.id}`}
              checked={selected === i}
              onChange={() => setAnswers((prev) => { const next = [...prev]; next[currentIndex] = i; return next })}
            />
            {option}
          </label>
        ))}
      </div>
      <button
        disabled={selected === null}
        onClick={() => {
          if (isLast) {
            const correct = answers.filter((a, i) => a === FINAL_EXAM_QUESTIONS[i].correctIndex).length
            setFinalExamResult(correct / FINAL_EXAM_QUESTIONS.length >= 0.8 ? 'passed' : 'failed')
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

function CertificatePage() {
  const { finalExamResult } = useCompletion()
  const { user } = useUser()

  if (finalExamResult !== 'passed') {
    return <Navigate to="/course" replace />
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? 'the participant'
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem' }}>Certificate of Completion</h1>
      <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 2rem' }}>{date}</p>

      <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '2rem', marginBottom: '2rem' }}>
        <p style={{ margin: '0 0 1rem', lineHeight: '1.7' }}>
          This certifies that <strong>{email}</strong> has successfully completed the{' '}
          <strong>EEO Investigator Certification</strong>.
        </p>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
          Issued by Workplace Compliance Institute
        </p>
      </div>

      <Link to="/course">← Back to Course</Link>
    </div>
  )
}

function ProtectedCertificate() {
  return (
    <>
      <SignedIn>
        <CertificatePage />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}

function ProtectedFinalExam() {
  return (
    <>
      <SignedIn>
        <FinalExamPage />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}

function ProtectedCourse() {
  return (
    <>
      <SignedIn>
        <CoursePage />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}

function ProtectedDashboard() {
  return (
    <>
      <SignedIn>
        <DashboardPage />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}

export default function App() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setCompleted((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({})
  const setQuizResult = (sectionId: string, result: QuizResult) =>
    setQuizResults((prev) => ({ ...prev, [sectionId]: result }))

  const [finalExamResult, setFinalExamResult] = useState<QuizResult | null>(null)

  return (
    <CompletionContext.Provider value={{ completed, toggle, quizResults, setQuizResult, finalExamResult, setFinalExamResult }}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/sign-in/*"
        element={<SignIn routing="path" path="/sign-in" />}
      />
      <Route
        path="/sign-up/*"
        element={<SignUp routing="path" path="/sign-up" />}
      />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="/course" element={<ProtectedCourse />} />
      <Route path="/lesson/:id" element={<ProtectedLesson />} />
      <Route path="/quiz/:sectionId" element={<ProtectedQuiz />} />
      <Route path="/final-exam" element={<ProtectedFinalExam />} />
      <Route path="/certificate" element={<ProtectedCertificate />} />
    </Routes>
    </CompletionContext.Provider>
  )
}
