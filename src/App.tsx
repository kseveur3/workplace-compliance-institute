import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'

function HomePage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Workplace Compliance Institute</h1>
      <nav style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <Link to="/sign-in">Sign In</Link>
        <Link to="/sign-up">Sign Up</Link>
      </nav>
    </div>
  )
}

function DashboardPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>Welcome! You are signed in.</p>
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
