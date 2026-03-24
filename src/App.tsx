import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, SignOutButton, useUser } from '@clerk/clerk-react'

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
      <SignOutButton />
    </div>
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
    </Routes>
  )
}
