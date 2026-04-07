// Shared types for the generated certification payload.
// Matches the shape returned by POST /api/admin/generate-certification.

export interface CurriculumSection {
  section: string
  lessons: number
}

export interface GeneratedLesson {
  title: string
  estimatedTime: string
  content: string[]
}

export interface GeneratedLessonSection {
  section: string
  lessons: GeneratedLesson[]
}

export interface GeneratedExample {
  title: string
  scenario: string
}

export interface GeneratedQuestion {
  question: string
  options: string[]
  correctIndex: number
}

export interface GeneratedQuizSection {
  section: string
  questions: GeneratedQuestion[]
}

export interface GeneratedFinalExam {
  totalQuestions: number
  passingScore: string
  coverage: string[]
  questions: GeneratedQuestion[]
}

export interface CertResult {
  sourceSummary: string
  curriculumOutline: CurriculumSection[]
  lessons: GeneratedLessonSection[]
  examples: GeneratedExample[]
  sectionQuizzes: GeneratedQuizSection[]
  finalExam: GeneratedFinalExam
}
