import { Routes, Route, Link, Navigate, useParams } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, SignOutButton, useUser } from '@clerk/clerk-react'

interface Lesson {
  id: string
  title: string
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

const COURSE: Course = {
  id: 'eeo-investigator',
  title: 'EEO Investigator Certification',
  sections: [
    {
      id: 'section-1',
      title: 'Section 1: Foundations of EEO Law',
      lessons: [
        { id: 'lesson-1', title: 'Overview of EEO Framework' },
        { id: 'lesson-2', title: 'Title VII Basics' },
      ],
    },
    {
      id: 'section-2',
      title: 'Section 2: Types of Claims',
      lessons: [
        { id: 'lesson-3', title: 'Disparate Treatment' },
        { id: 'lesson-4', title: 'Hostile Work Environment' },
      ],
    },
  ],
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
  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h1 style={{ fontSize: '1.75rem', margin: '0.75rem 0 0.5rem' }}>{COURSE.title}</h1>
      <p style={{ marginBottom: '1.5rem' }}>Progress: 0 of {TOTAL_LESSONS} lessons completed</p>
      {COURSE.sections.map((section) => (
        <div key={section.id} style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{section.title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem' }}>
            {section.lessons.map((lesson) => (
              <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                {lesson.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function LessonPage() {
  const { id } = useParams<{ id: string }>()

  let foundLesson: { course: typeof COURSE; section: (typeof COURSE.sections)[0]; lesson: (typeof COURSE.sections)[0]['lessons'][0] } | null = null
  for (const section of COURSE.sections) {
    const lesson = section.lessons.find((l) => l.id === id)
    if (lesson) {
      foundLesson = { course: COURSE, section, lesson }
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

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <Link to="/course">← Back to Course</Link>
      <p style={{ margin: '1rem 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>{section.title}</p>
      <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0.75rem' }}>{lesson.title}</h1>
      <p>Lesson content coming soon.</p>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
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
  return (
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
    </Routes>
  )
}
