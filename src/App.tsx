import { useState, useEffect, useRef, createContext, useContext } from "react";
import { AdminAiContentPage } from "./pages/admin-ai-content";
import { ReportBuilderPage } from "./pages/report-builder";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  SignOutButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import "./app.css";
import { displayTitle } from "./utils/lessonTitle";

interface Lesson {
  id: string;
  title: string;
  estimatedTime: string;
  content: string[];
  narrationPlaceholder: string;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  sections: Section[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface SectionQuiz {
  sectionId: string;
  questions: QuizQuestion[];
}

interface CeuModuleExample {
  scenario: string;
  explanation: string;
}

interface CeuCaseStudy {
  scenario: string;
  questions: QuizQuestion[];
  explanation: string;
}

interface PracticalExercise {
  title: string;
  prompt: string;
  instructions: string[];
  sampleResponse?: string;
  estimatedMinutes: number;
}

interface CeuModule {
  id: string;
  title: string;
  summary: string;
  content?: string;
  examples?: CeuModuleExample[];
  guidance?: string[];
  caseStudies?: CeuCaseStudy[];
  practicalExercises?: PracticalExercise[];
  questions: QuizQuestion[];
}

interface CeuContent {
  modules: CeuModule[];
  finalExam: QuizQuestion[];
}

const QUIZZES: SectionQuiz[] = [
  {
    sectionId: "section-1",
    questions: [
      {
        id: "q1-1",
        question:
          "Which federal agency is primarily responsible for enforcing EEO laws?",
        options: [
          "Department of Labor",
          "Equal Employment Opportunity Commission (EEOC)",
          "Department of Justice",
          "Office of Personnel Management",
        ],
        correctIndex: 1,
      },
      {
        id: "q1-2",
        question:
          "Which of the following is NOT a protected characteristic under Title VII?",
        options: [
          "Race",
          "Religion",
          "Political affiliation",
          "National origin",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    sectionId: "section-2",
    questions: [
      {
        id: "q2-1",
        question: "Disparate treatment occurs when an employer:",
        options: [
          "Applies a neutral policy that disproportionately impacts a protected group",
          "Treats an employee less favorably because of a protected characteristic",
          "Fails to provide a reasonable accommodation",
          "Retaliates against an employee for filing a complaint",
        ],
        correctIndex: 1,
      },
      {
        id: "q2-2",
        question: "For a hostile work environment claim, the conduct must be:",
        options: [
          "Intentional and physical in nature",
          "Reported to HR before it legally qualifies",
          "Both subjectively and objectively offensive",
          "Committed only by a direct supervisor",
        ],
        correctIndex: 2,
      },
    ],
  },
];

const FINAL_EXAM_QUESTIONS: QuizQuestion[] = [
  {
    id: "fe-1",
    question:
      "Which federal agency is the primary enforcement body for EEO laws in the United States?",
    options: [
      "Department of Labor",
      "Office of Personnel Management",
      "Equal Employment Opportunity Commission (EEOC)",
      "Department of Justice",
    ],
    correctIndex: 2,
  },
  {
    id: "fe-2",
    question:
      "Title VII of the Civil Rights Act of 1964 prohibits discrimination based on all of the following EXCEPT:",
    options: ["Race", "National origin", "Political affiliation", "Religion"],
    correctIndex: 2,
  },
  {
    id: "fe-3",
    question:
      "In a disparate treatment claim, the burden-shifting framework was established in:",
    options: [
      "Harris v. Forklift Systems",
      "McDonnell Douglas Corp. v. Green",
      "Meritor Savings Bank v. Vinson",
      "Burlington Industries v. Ellerth",
    ],
    correctIndex: 1,
  },
  {
    id: "fe-4",
    question: "A hostile work environment claim requires that the conduct be:",
    options: [
      "Physical and intentional",
      "Reported to a supervisor before filing",
      "Both subjectively and objectively offensive",
      "Committed only by a supervisor",
    ],
    correctIndex: 2,
  },
];


const COURSE: Course = {
  id: "eeo-investigator",
  title: "EEO Investigator Certification",
  sections: [
    {
      id: "section-1",
      title: "Section 1: Foundations of EEO Law",
      lessons: [
        {
          id: "lesson-1",
          title: "Overview of EEO Framework",
          estimatedTime: "Estimated time: 20 minutes",
          content: [
            "The Equal Employment Opportunity (EEO) framework is a set of federal laws designed to prevent workplace discrimination based on protected characteristics such as race, color, religion, sex, national origin, age, and disability.",
            "Federal agencies enforce these protections through the Equal Employment Opportunity Commission (EEOC), which receives, investigates, and resolves discrimination complaints filed by employees and applicants.",
            "As an EEO investigator, your role is to gather facts impartially, apply the relevant legal standards, and produce a report of investigation that serves as the evidentiary record for resolution.",
            "Understanding the full scope of the EEO framework — including which laws apply, which agencies have jurisdiction, and what remedies are available — is the foundation of effective investigation.",
          ],
          narrationPlaceholder:
            "Audio narration for Overview of EEO Framework coming soon.",
        },
        {
          id: "lesson-2",
          title: "Title VII Basics",
          estimatedTime: "Estimated time: 25 minutes",
          content: [
            "Title VII of the Civil Rights Act of 1964 prohibits employment discrimination based on race, color, religion, sex, and national origin. It applies to employers with 15 or more employees, including federal agencies.",
            "Title VII covers all aspects of employment: hiring, firing, pay, job assignments, promotions, layoffs, training, fringe benefits, and any other term or condition of employment.",
            "Amendments and related statutes — including the Pregnancy Discrimination Act and Title II of the Genetic Information Nondiscrimination Act — have expanded Title VII's protections over time.",
            "Investigators must be familiar with the basic elements of a Title VII claim, including the concept of adverse action and the requirement that the protected characteristic be a motivating factor in the employment decision.",
          ],
          narrationPlaceholder:
            "Audio narration for Title VII Basics coming soon.",
        },
      ],
    },
    {
      id: "section-2",
      title: "Section 2: Types of Claims",
      lessons: [
        {
          id: "lesson-3",
          title: "Disparate Treatment",
          estimatedTime: "Estimated time: 20 minutes",
          content: [
            "Disparate treatment is the most common theory of discrimination. It occurs when an employer treats an employee less favorably than similarly situated employees because of a protected characteristic.",
            "To establish a disparate treatment claim, a complainant must show that: they are a member of a protected class, they suffered an adverse employment action, and there is an inference that the action was motivated by discriminatory intent.",
            "Investigators look for comparative evidence — how were employees outside the complainant's protected class treated under similar circumstances? Inconsistencies in disciplinary records, promotions, or performance reviews are key indicators.",
            "Direct evidence of discriminatory intent, such as a discriminatory statement by a decision-maker, is rare. Most cases rely on circumstantial evidence and the burden-shifting framework established in McDonnell Douglas Corp. v. Green.",
          ],
          narrationPlaceholder:
            "Audio narration for Disparate Treatment coming soon.",
        },
        {
          id: "lesson-4",
          title: "Hostile Work Environment",
          estimatedTime: "Estimated time: 25 minutes",
          content: [
            "A hostile work environment claim arises when an employee is subjected to unwelcome conduct based on a protected characteristic that is severe or pervasive enough to create an abusive working environment.",
            "The conduct must be both subjectively and objectively offensive — meaning the complainant found it hostile and a reasonable person in the same situation would also find it hostile.",
            "Investigators must assess the totality of circumstances, including the frequency of the conduct, its severity, whether it was physically threatening or humiliating, and whether it unreasonably interfered with work performance.",
            "Employer liability depends in part on whether the harasser was a supervisor or co-worker, and whether the employer knew or should have known about the conduct and failed to take prompt corrective action.",
          ],
          narrationPlaceholder:
            "Audio narration for Hostile Work Environment coming soon.",
        },
      ],
    },
  ],
};

function loadActiveCourse(): Course {
  try {
    const raw = localStorage.getItem("generatedCertification");
    if (raw) {
      const gen = JSON.parse(raw);
      console.log("Using generated certification");
      const outlineTitles: string[] = Array.isArray(gen.curriculumOutline)
        ? (gen.curriculumOutline as { section: string }[]).map((o) => {
            const colon = o.section.indexOf(":");
            return colon >= 0 ? o.section.slice(colon + 2).trim() : o.section;
          })
        : [];

      const sections: Section[] = (
        gen.lessons as {
          section: string;
          lessons: {
            title: string;
            estimatedTime: string;
            content: string[];
          }[];
        }[]
      ).map((group, si) => ({
        id: `section-${si + 1}`,
        title: `Section ${si + 1} \u2014 ${outlineTitles[si] ?? group.section}`,
        lessons: group.lessons.map((lesson, li) => ({
          id: `lesson-${si + 1}-${li + 1}`,
          title: lesson.title,
          estimatedTime: lesson.estimatedTime,
          content: lesson.content,
          narrationPlaceholder: `Audio narration for ${lesson.title} coming soon.`,
        })),
      }));
      return { id: COURSE.id, title: COURSE.title, sections };
    }
  } catch {
    /* ignore parse errors */
  }
  console.log("Using default COURSE");
  return COURSE;
}

function loadActiveQuizzes(): SectionQuiz[] {
  try {
    const raw = localStorage.getItem("generatedCertification");
    if (raw) {
      const gen = JSON.parse(raw);
      if (
        Array.isArray(gen.sectionQuizzes) &&
        gen.sectionQuizzes[0]?.questions?.[0]?.question
      ) {
        return (
          gen.sectionQuizzes as {
            section: string;
            questions: {
              question: string;
              options: string[];
              correctIndex: number;
            }[];
          }[]
        ).map((sq, si) => ({
          sectionId: `section-${si + 1}`,
          questions: sq.questions.map((q, qi) => ({
            id: `gen-q${si + 1}-${qi + 1}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        }));
      }
    }
  } catch {
    /* ignore parse errors */
  }
  return QUIZZES;
}

function loadActiveFinalExam(): QuizQuestion[] {
  try {
    const raw = localStorage.getItem("generatedCertification");
    if (raw) {
      const gen = JSON.parse(raw);
      if (
        Array.isArray(gen.finalExam?.questions) &&
        gen.finalExam.questions[0]?.question
      ) {
        return gen.finalExam.questions.map(
          (
            q: { question: string; options: string[]; correctIndex: number },
            i: number,
          ) => ({
            id: `gen-fe-${i + 1}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
          }),
        );
      }
    }
  } catch {
    /* ignore parse errors */
  }
  return FINAL_EXAM_QUESTIONS;
}

// ── CEU content loader ────────────────────────────────────────────────────────

const DEFAULT_CEU_CONTENT: CeuContent = {
  modules: [
    // ── Module 1: Current Expectations & EEOC Trends ──────────────────────
    {
      id: "ceu-mod-1",
      title: "Current Expectations & EEOC Trends",
      summary:
        "Covers recent EEOC enforcement priorities, updated harassment and accommodation guidance, and how emerging workplace contexts — including remote work and AI-assisted hiring — affect your investigation obligations. This module sharpens your awareness of where enforcement focus is shifting and what current expectations look like in practice.",
      content: `## The Evolving Regulatory Landscape

The EEOC's enforcement priorities shift with each administration and enforcement cycle, but the investigator's core obligations remain grounded in federal statute — Title VII, the ADA, the ADEA, and their amendments. The practical implication is that the what is stable, but the how and where keep changing. Understanding what has shifted at the guidance level helps investigators apply current expectations rather than outdated norms. An investigator who has not reviewed recent EEOC guidance documents may be conducting technically compliant investigations that are nonetheless misaligned with how the agency currently interprets its authority.

The EEOC's recent strategic enforcement plans have prioritized systemic discrimination, pay equity, and protection of workers in contingent and low-wage employment relationships. Complaints that appear isolated may represent the visible portion of a broader pattern the EEOC expects employers to recognize and investigate accordingly. When a complaint comes in from a staffing agency worker, a gig worker, or a part-time employee in a low-wage role, the investigation obligation is identical to the one that applies to a salaried full-time employee. The covered population has effectively widened without corresponding changes to statutory text. The EEOC has also continued to treat sex stereotyping — decisions or comments based on assumptions about how someone of a particular sex should look, act, or prioritize responsibilities — as actionable sex discrimination under Title VII. Comments that reflect assumptions about an employee's commitment based on caregiver status, appearance, or gender role expectations fall within this enforcement priority and should be documented when encountered in an investigation.

Guidance documents — enforcement guidance, technical assistance documents, and strategic enforcement plan summaries — do not carry the force of law, but they reflect the agency's interpretive position and signal where enforcement resources will be directed. An investigation that is legally defensible but inconsistent with current enforcement guidance creates compliance risk that may not surface until a charge is filed. Reviewing guidance annually is not optional continuing education; it is a professional competency requirement for anyone whose role includes investigation responsibility.

Investigators should also track EEOC press releases on significant settlements and conciliation agreements. These documents reveal what factual patterns the agency considers worth pursuing, how it is characterizing emerging theories of liability, and what remedial measures it considers adequate for different types of violations. This information is publicly available and directly applicable to investigation practice.

## Digital Channels and the Hostile Environment Standard

Workplace harassment that occurs through Slack, Teams, email, text messages, or social media platforms is evaluated under the same hostile environment standard as in-person conduct. The medium does not determine the legal threshold; severity and pervasiveness do. An investigator who treats digital harassment as inherently less serious than face-to-face conduct, or who treats its written form as less reliable than verbal testimony, is making an evidentiary error with legal consequences.

Digital records are primary evidence, not supplementary context. An investigation that relies exclusively on witness interviews while relevant message histories, email threads, or call logs are available is incomplete by design. Request digital records early — before the first party interview where possible — document your request and its outcome, and preserve what you receive in a format that can be reviewed and reproduced. If records were deleted or were unavailable because a relevant account was suspended or archived, document that finding along with its timing. Unexplained destruction or unavailability of records after a complaint is filed is a material fact that belongs in the investigative record.

A recurring mistake is discounting digital evidence as ambiguous because tone is absent in writing. Courts have sustained hostile environment claims based entirely on written communications, and in many cases the written record is more reliable than testimony reconstructed from memory weeks or months after the fact. A message that uses a slur, documents a discriminatory rationale, or establishes the frequency of targeted conduct is often dispositive. Apply the same evidentiary weight to a Slack message thread that you would apply to a contemporaneous written complaint.

In practice, digital evidence gathering requires coordination with IT departments and, in some cases, legal counsel on preservation obligations. Many organizations have auto-delete policies that purge message histories within 30, 60, or 90 days. If a complaint is filed after the relevant communications have been auto-deleted, document when the communications were sent, when they would have been purged, and whether any preservation hold was in place at the relevant time. Evidence that no longer exists because of a normal deletion policy is different from evidence that no longer exists because of a targeted deletion after notice of the complaint.

## AI-Assisted Hiring and Promotion Tools

Employers who use artificial intelligence or algorithmic tools for hiring screens, resume scoring, structured interview scoring, or promotion decisions retain full EEO liability for discriminatory outcomes produced by those tools. The EEOC has made this explicit: use of a vendor-designed or third-party tool does not shift or dilute the employer's obligation. The tool is not the employer, and the tool's output is not insulated from civil rights review simply because a human did not make each individual decision.

If an AI screening tool produces a disparate impact on applicants with disabilities, on older workers, or on members of a racial or national origin group, the employer is responsible for that result. This applies whether the employer built the tool internally, purchased it from a vendor, or uses it as part of a broader talent acquisition platform. Employers who cannot explain how their tools work, what criteria they apply, or whether those criteria have been validated against protected class outcomes are in a significantly more exposed position than those who can.

For investigators, AI-related complaints require evidence-gathering strategies that differ meaningfully from standard employment discrimination investigations. There may be no specific human decision-maker to interview — just a tool that produced a selection outcome and a process that accepted it. The investigation must examine what the tool's stated selection criteria are, what data was used to train or calibrate it, what validation testing was done to assess disparate impact, and what selection rates the tool produced across protected class groups. These cases require early coordination with HR, legal, and potentially the vendor to determine what documentation exists and what can be preserved.

When no disparate impact data is available, that absence is itself a finding. An employer that deployed an AI hiring tool without conducting or commissioning any disparate impact analysis is operating without a basic compliance safeguard. Document what analysis was or was not conducted, when the tool was adopted, and who within the organization was responsible for its evaluation and oversight. The investigator's role is not to adjudicate the technical adequacy of the AI — it is to identify what records exist, frame the right questions about the selection process, and document the process rigorously enough for a legal determination to follow.

## Remote and Hybrid Work Contexts

Remote work has not reduced EEO obligations; in some respects it has made them harder to observe and document. An employee working remotely may be systematically excluded from informal decision-making networks, overlooked for development opportunities, or denied meaningful visibility with senior leadership — none of which generates a formal adverse action record. Investigators evaluating these complaints must look for what is not occurring: who appears in which meeting invitations, who receives which project assignments, who is asked to present to leadership, and whether patterns of exclusion correlate with protected characteristics.

This type of investigation requires a different evidentiary toolkit than investigations involving discrete adverse actions. The investigator must map informal organizational patterns rather than trace a single decision. This means requesting calendar data, email distribution lists, project assignment records, and promotion decision documentation — not just personnel files and HR records. It also means interviewing witnesses who may be geographically dispersed and who may have no direct awareness of the complainant's situation but are positioned to describe how assignment and opportunity decisions are typically made in the relevant team or department.

Logistically, remote investigations require deliberate planning at the outset. Witnesses may be in different time zones, working on flexible schedules, or located in jurisdictions with different norms around formal legal proceedings. Evidence may be stored in cloud platforms — SharePoint, Google Drive, project management tools — that require IT coordination and sometimes legal hold procedures to access. Virtual interviews are now standard practice but differ from in-person settings in ways that matter to the investigation: some witnesses communicate differently on video, background environments can create distraction, and the absence of in-person observation limits the investigator's ability to assess witness demeanor directly. Where demeanor is a factor, virtual interviews should be supplemented by written follow-up that confirms the key points of the account.

Remote work also creates new vectors for hostile environment conduct. Exclusion from chat channels, targeted behavior on video calls with group witnesses, disparate treatment in shared document access, and hostile messages delivered to a person's home workspace can all constitute actionable conduct. The fact that an employee was subjected to offensive conduct in their own home through a workplace video call may, if anything, heighten the impact of the conduct. The investigator should document not only what occurred but where the complainant was when it occurred and what the cumulative impact of the conduct has been on their ability to work effectively.

## LGBTQ+ Protections After Bostock

Bostock v. Clayton County (2020) definitively settled that Title VII's prohibition on sex discrimination covers sexual orientation and gender identity. The Supreme Court's reasoning was straightforward: an employer who discriminates against an employee for being gay or transgender necessarily discriminates against that employee because of sex. Apply this without qualification. A complaint alleging hostile environment or adverse action based on gender identity or sexual orientation is a standard Title VII investigation in every material respect — the same framework, the same analytical steps, the same documentation requirements.

Respondents in these cases frequently characterize their conduct as personal opinion, religious belief, generational difference, or casual workplace conversation. None of these framings change the legal analysis. The focus of the hostile environment inquiry is whether the conduct, taken as a whole, created an environment that a reasonable person in the complainant's position would find hostile or abusive. The respondent's characterization of their own intent, their personal beliefs, or the informality of the context is relevant to credibility but does not resolve the legal question. If the conduct targeted the complainant because of their gender identity or sexual orientation, the framework applies.

Investigators should also be attentive to conduct that is facially neutral but appears to target employees because of their LGBTQ+ status. Dress code enforcement applied selectively, exclusion from team social events, assignment to less favorable roles, and informal ostracism by colleagues can all be relevant to a hostile environment analysis when they correlate with the complainant's protected characteristic. Document the specific conduct, its frequency, who engaged in it, and whether the employer had notice and responded.

Religious freedom objections from respondents and witnesses are a distinct legal issue that the investigation is generally not the right vehicle to resolve. Document these assertions in the record and route them to legal counsel. An investigation that delays or avoids findings because of a respondent's asserted religious objection has allowed an irrelevant defense to compromise the process.

## Accommodation and the Interactive Process

ADA accommodation claims require assessment of both the employer's ultimate decision and the process that produced it. The interactive process — an ongoing, good-faith dialogue between employer and employee to identify and evaluate potential accommodations — is a legally independent obligation. An employer who summarily denies an accommodation request without engaging in this process has violated the ADA regardless of whether a reasonable accommodation would ultimately have been available. The adequacy of the process is often more consequential to a legal finding than the adequacy of the final decision.

The interactive process is not a one-time communication. It is a genuine exchange, conducted in real time, that continues until either a reasonable accommodation is identified and implemented or the employer and employee reach an impasse based on undue hardship analysis. If the employee's needs change, the process should restart or continue. If the initial accommodation proves insufficient, the process should resume. An employer who treats the accommodation decision as closed after issuing an initial response without follow-up has not completed the interactive process.

When investigating accommodation complaints, document the timeline with precision: when the accommodation was first requested, in what form the request was made, what information the employer provided in response, what alternatives were considered and by whom, what the final decision was, and how much elapsed time each stage consumed. The most common failures are delay (weeks or months without a substantive response), failure to respond (the request is acknowledged and then ignored), and unilateral denial (the employer decides what the employee needs without asking the employee). Each of these is independently actionable.

Investigators should also assess whether the employer sought sufficient medical documentation to evaluate the request, and whether that documentation request was proportionate. Employers are entitled to ask for information sufficient to understand the nature of the limitation and the type of accommodation needed. They are not entitled to seek complete medical records, ongoing medical updates, or diagnostic information unrelated to the workplace limitation. An overly broad documentation request can itself be evidence of bad faith in the interactive process. Document exactly what was requested, when, and what the employee provided in response.`,
      examples: [
        {
          scenario: "An employee working fully remotely reports that her manager never includes her in weekly planning calls where project assignments and visibility opportunities are discussed. Colleagues who work onsite receive higher-complexity assignments. She has received no formal performance criticism and has not been told her performance is insufficient.",
          explanation: "This complaint warrants investigation even without a formal adverse action. Systematic exclusion from meetings where assignments are distributed may constitute disparate treatment if it correlates with a protected characteristic. The investigator should document meeting invitation practices, compare assignment patterns across similarly situated employees, and assess whether the exclusion has affected the complainant's career trajectory or compensation.",
        },
        {
          scenario: "During an investigation, you discover a Slack channel where a group of employees, including the respondent, has been sending memes and commentary mocking a colleague's national origin over eight months. The complainant was unaware of the channel's existence until a witness mentioned it.",
          explanation: "Digital evidence in a private channel is still relevant and discoverable. The complainant's lack of direct awareness does not eliminate the hostile environment claim if the conduct was pervasive enough to affect a reasonable person in the complainant's position. Preserve the channel history, document all participants, and assess whether the conduct rose to the legal threshold independent of the complainant's knowledge of the specific channel.",
        },
        {
          scenario: "A job applicant with a disability was screened out by an automated resume-scoring tool before any human reviewer saw the application. The applicant alleges the tool's criteria — which heavily weighted uninterrupted employment history — had a disparate impact on people with serious health conditions requiring medical leave.",
          explanation: "This is an AI disparate impact complaint. The investigation must examine the tool's selection criteria, any validation data the employer has to support those criteria, and whether the employment-continuity factor disproportionately excluded applicants with disability-related gaps. Request documentation from the vendor, coordinate with HR and legal, and obtain any internal analysis of the tool's selection rates across applicant groups.",
        },
        {
          scenario: "An employee filed an internal harassment complaint in March. In April, her supervisor placed her on a performance improvement plan — the first formal performance action in her five-year tenure. The supervisor says the PIP reflects longstanding performance concerns that were never formally documented. The employee alleges retaliation.",
          explanation: "Close temporal proximity between protected activity (filing a complaint) and an adverse action (a first-ever PIP) is a recognized form of circumstantial retaliation evidence. The supervisor's explanation that concerns were longstanding but undocumented actually strengthens the retaliation inference — the absence of prior documentation makes the timing more, not less, suspicious. The investigation should examine: when the performance concerns were first discussed with the employee, whether other employees with similar performance received PIPs without documented complaints, and who decided to initiate the PIP and when. Retaliation claims are among the EEOC's highest-volume charge categories and require the same analytical rigor as the underlying substantive claim.",
        },
        {
          scenario: "An employee requests a schedule modification as an ADA accommodation for a chronic condition. HR acknowledges the request in writing and then takes no further action for six weeks. When the employee follows up, HR states the request is 'under review.' The employee ultimately resigns.",
          explanation: "This pattern describes a failure of the interactive process. Acknowledging a request and then failing to act is not engagement — it is delay that may independently constitute an ADA violation. Six weeks without a substantive response, absent a documented explanation, likely constitutes a failure to engage in the interactive process in good faith. The subsequent resignation may also support a constructive discharge claim. Document every communication, the elapsed time at each step, and what alternatives, if any, were considered during the review period.",
        },
        {
          scenario: "An employee files a complaint alleging that a coworker repeatedly made comments questioning whether she was 'really' a woman, laughed at her appearance, and copied other colleagues on emails addressing her by her previous name. The respondent's manager says the coworker is 'old-school' and the comments were not meant to cause harm. HR has not previously received any formal complaints about this coworker.",
          explanation: "Intent is not the standard for hostile environment analysis; impact is. The conduct described — questioning gender identity, mocking appearance, and deliberate name misuse in front of colleagues — targets the complainant because of her gender identity under Bostock. The respondent's age or cultural background is not a defense. The absence of prior formal complaints does not mean the employer lacked notice; the investigation should determine whether the manager who characterized the conduct as harmless had direct knowledge of it, which the facts suggest is the case. A supervisor who observes or is told about this conduct and dismisses it as acceptable has provided notice that the employer received and failed to act on.",
        },
      ],
      guidance: [
        "Review EEOC guidance documents and strategic enforcement plan summaries annually — not just the enabling statutes. Enforcement expectations evolve significantly between legislative cycles.",
        "Treat digital records as primary evidence. Request message histories, email threads, call logs, and collaboration platform data as a standard part of the investigative record, not an afterthought.",
        "Do not close a complaint because no formal adverse action has occurred. Systemic exclusion, denial of opportunities, and hostile environment claims are actionable without termination or demotion.",
        "An employer's use of an AI screening tool does not transfer EEO liability to the vendor. Disparate impact from algorithmic tools is the employer's responsibility regardless of who built the tool.",
        "Bostock is settled law. Investigate complaints based on sexual orientation or gender identity under the same Title VII framework you apply to any other protected class — no special procedures, no elevated burden.",
        "The ADA interactive process is a distinct legal obligation. Assess whether it occurred and whether it was conducted in good faith, independent of whether the accommodation request was ultimately granted.",
        "Pattern evidence observed during an individual investigation should be documented and noted in your report, even if not formally investigated as part of the current scope.",
        "In remote and hybrid environments, look for what is absent — exclusion from meetings, overlooked for assignments, missing from informal networks — not only for documented adverse actions.",
        "When an employer has no disparate impact data for an AI selection tool, that absence is itself a finding that belongs in the investigative record.",
      ],
      caseStudies: [
        {
          scenario: `TechForward Inc. uses an AI video interview analysis tool purchased from a vendor called InterviewIQ. The tool analyzes facial expressions, speech patterns, and "energy levels" during recorded interviews and produces a numeric score used to filter candidates before human review. Over eighteen months of deployment, internal HR data shows the tool has produced significantly lower selection scores for applicants over 45. A 52-year-old applicant who scored in the bottom quartile despite strong credentials files an ADEA complaint. HR's initial response is that no individual made a discriminatory decision — the selection was produced by an objective algorithm.`,
          questions: [
            {
              id: "ceu-m1-cs1-q1",
              question: "The employer's first investigative step should be to:",
              options: [
                "Request the vendor's validation data and the tool's selection rate analysis by protected class.",
                "Contact the vendor and ask them to respond to the EEOC inquiry directly, since they designed the tool.",
                "Decline to open a formal investigation — no human made a discriminatory decision.",
                "Treat this as a product liability matter and refer it to legal counsel without opening an investigation.",
              ],
              correctIndex: 0,
            },
            {
              id: "ceu-m1-cs1-q2",
              question: "An employer who uses an AI hiring tool that produces disparate impact on a protected class:",
              options: [
                "Is insulated from liability if the vendor's contract includes an indemnification clause.",
                "Retains full EEO liability regardless of whether the tool was designed or supplied by a third party.",
                "Is liable only if a human reviewer knew about and endorsed the disparate outcomes.",
                "Has a complete defense if the tool was based on industry-standard benchmarks.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m1-cs1-q3",
              question: "The vendor refuses to share its validation data, claiming it is proprietary. The investigator should:",
              options: [
                "Accept the position and note in the report that validation data was not obtainable.",
                "Close the investigation since evidence cannot be compelled from a third party.",
                "Document the refusal and assess what other evidence is available — including the employer's own internal selection rate data by age group.",
                "Request that the EEOC subpoena the vendor directly before the investigation can proceed.",
              ],
              correctIndex: 2,
            },
            {
              id: "ceu-m1-cs1-q4",
              question: "If the investigation confirms the tool produced statistically significant disparate impact on applicants over 45, the employer's next step should be to:",
              options: [
                "Suspend use of the tool and review affected applicant files to determine whether corrective action is warranted.",
                "Continue using the tool while commissioning a new validation study, since past users cannot be held responsible for prior selections.",
                "Issue a statement clarifying that selection criteria are neutral and apply uniformly to all applicants.",
                "Ask the complaining applicant to submit to a supplemental interview to cure the selection gap.",
              ],
              correctIndex: 0,
            },
          ],
          explanation: `AI hiring tools do not insulate employers from EEO liability — they are employer decisions. TechForward selected, deployed, and relied on this tool, and it is responsible for the tool's outputs regardless of who built it. The investigation must focus on: (1) obtaining validation data to understand what criteria the tool applies and whether those criteria were tested against protected class outcomes; (2) documenting any refusal to share that data, which itself becomes a relevant finding; (3) assessing the employer's own internal selection rate data to determine whether disparate impact is confirmed statistically. If confirmed, the employer must take corrective action — at minimum suspending use of the tool for new decisions and reviewing applicants who may have been adversely screened out. The vendor's indemnification clause is a contractual matter between the parties that does not affect the employer's civil rights obligations. The absence of a specific human decision-maker does not eliminate the discrimination claim; it changes the evidence-gathering strategy.`,
        },
        {
          scenario: `Maya is a data analyst with MS. In August, she requests a modified work schedule — a 10am start time and occasional work-from-home days during flare-ups — as an ADA accommodation. HR sends a written acknowledgment. In September, HR meets with Maya and says they will "look into it." In October, her manager emails her requesting a doctor's note. Maya submits the documentation in November. Through December and into January, HR takes no further action. In late January, Maya resigns, stating in her resignation letter that the unresolved accommodation process made her situation untenable. She files an ADA charge alleging failure to engage in the interactive process and constructive discharge.`,
          questions: [
            {
              id: "ceu-m1-cs2-q1",
              question: "At what point did the employer's interactive process obligation most clearly fail?",
              options: [
                "When HR requested a doctor's note — that request exceeded what the ADA permits.",
                "During the period after Maya submitted documentation in November, when no substantive response was provided for two months.",
                "When HR said they would 'look into it' in September — any delay after the initial request constitutes failure.",
                "When Maya resigned — the constructive discharge is itself the ADA violation.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m1-cs2-q2",
              question: "The investigator must assess whether Maya's resignation supports a constructive discharge claim. The correct analysis is:",
              options: [
                "Constructive discharge applies only if the employer explicitly told her to resign or be fired.",
                "If workplace conditions became so intolerable that a reasonable person would have felt compelled to resign — here, months of inaction after a documented ADA request — constructive discharge may apply.",
                "Constructive discharge claims require proof of intentional discrimination, which is not clearly present in a process failure case.",
                "Voluntary resignation always breaks the causal chain between the accommodation failure and any resulting damages.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m1-cs2-q3",
              question: "What documents should the investigator request?",
              options: [
                "Only Maya's personnel file and the final email exchange before her resignation.",
                "All HR and management communications about the accommodation request, the submitted documentation, any internal HR notes, and the employer's written accommodation policy.",
                "The doctor's note and a comparative analysis of accommodation approvals for other employees.",
                "The HR intake record and the employer's position statement submitted to the EEOC.",
              ],
              correctIndex: 1,
            },
          ],
          explanation: `The ADA interactive process is an ongoing, good-faith exchange — not a one-time acknowledgment. Once an employee submits the documentation the employer requested, the employer must respond substantively. Two months of silence after documentation is submitted — with no evaluation, no counter-proposal, and no explanation — is a failure to engage in the interactive process in good faith, and is independently actionable regardless of whether a reasonable accommodation was ultimately available. The document request in this investigation must be comprehensive: all internal communications about how to handle the request matter, because the process failure may be visible in internal discussions that never reached Maya. On constructive discharge: the standard is objective — would a reasonable person in Maya's position have felt compelled to resign? Months of ADA-mandated process inaction, with no end in sight, is exactly the factual pattern that supports this claim. Both the process failure and the discharge claim must be fully documented and analyzed.`,
        },
      ],
      practicalExercises: [
        {
          title: "Draft an Evidence Request Plan",
          prompt: "You have just opened an investigation based on the following complaint: Elena, a software engineer on a fully remote team, disclosed to HR in January that she has rheumatoid arthritis affecting her hands and requested voice recognition software and a modified keyboard as an ADA accommodation. HR acknowledged the request in writing. By April — three months later — no accommodation has been implemented and HR has provided no substantive update. Elena also alleges that since her disclosure, she has been excluded from two project leadership opportunities that went to less senior colleagues without explanation, and that her manager's written communications have become noticeably more critical in tone. She is considering resigning. Draft a prioritized evidence request plan for this investigation.",
          instructions: [
            "List every category of document you would request, in priority order.",
            "For each category, write one sentence explaining why it is relevant to this investigation.",
            "Identify any evidence that may be at risk of disappearing and explain the steps you would take to preserve it.",
            "Note which claim — ADA accommodation failure or retaliation — each document category primarily supports.",
            "Distinguish between records you would request from HR/employer systems and records you would request directly from the complainant.",
          ],
          sampleResponse: `Priority 1 — ADA accommodation communications (supports accommodation claim): All written communications between Elena and HR from January through April, including the initial request, the acknowledgment, any HR internal emails discussing the request, and any communications between HR and her manager about the accommodation. Relevant because this is the primary evidence of whether the interactive process occurred and what was exchanged at each step.\n\nPriority 2 — Leadership assignment records (supports retaliation claim): Documentation of the two project leadership opportunities — when they were posted or assigned, who was considered, who was selected, and the rationale for selection. Relevant because temporal proximity between accommodation disclosure and adverse opportunity decisions is circumstantial evidence of retaliation.\n\nPriority 3 — Manager written communications (supports both): All written communications from Elena's manager to Elena before and after January — email, Slack, performance reviews — to establish whether tone and substance changed following her disclosure. Relevant because retaliation often appears first as changes in management behavior rather than formal adverse actions.\n\nPriority 4 — Medical documentation submitted (supports accommodation claim): A copy of the documentation Elena submitted, if any, to confirm whether the employer's medical information request was proportionate and whether the documentation was sufficient to evaluate the request.\n\nPriority 5 — Accommodation policy and comparable decisions (supports accommodation claim): The employer's written ADA accommodation policy and any records of accommodation requests by other employees in the same period, to assess whether the delay in Elena's case was consistent with the employer's standard process or an outlier.\n\nPreservation risk: If Elena's manager uses ephemeral messaging or the organization has auto-delete policies on internal messaging platforms (Slack, Teams), those records may disappear. Request an immediate litigation hold on all communications involving Elena and her manager from January forward.`,
          estimatedMinutes: 25,
        },
        {
          title: "Design the Complainant's Initial Interview",
          prompt: "Using the same Elena scenario, prepare the opening section of Elena's formal complainant interview. You will be interviewing Elena about both the ADA accommodation failure and the potential retaliation claim. Your goal is to get a complete, detailed account in her own words before you interview the respondents.",
          instructions: [
            "Draft three open-ended questions specifically for the accommodation claim, focused on establishing the full timeline of what Elena communicated, to whom, and what responses she received at each step.",
            "Draft three open-ended questions specifically for the retaliation claim, focused on the before-and-after pattern — what changed after her January disclosure, when she first noticed it, and what specific examples she can provide.",
            "Write two follow-up probes you would use if Elena gives a vague answer about the leadership opportunities she was excluded from.",
            "Identify one question you would NOT ask during the initial complainant interview, and explain why.",
          ],
          sampleResponse: `Accommodation questions:\n1. "Walk me through everything that happened between the time you first requested the accommodation in January and today — who did you speak with, what was said or written, and what happened after each interaction?"\n2. "What documentation, if any, did HR ask you to provide, and what did you submit in response?"\n3. "Have you received any written or verbal explanation for why the accommodation has not been implemented?"\n\nRetaliation questions:\n1. "Describe the two leadership opportunities you mentioned. When did each one come up, how did you find out about them, and what were you told about why you were not selected?"\n2. "How would you describe your manager's communication style before January, and how has it changed since then? Can you give me specific examples of messages or interactions that felt different?"\n3. "Is there anything else that has changed in how you're treated at work since you disclosed your diagnosis — anything formal or informal?"\n\nFollow-up probes for vague leadership answers:\n- "Who specifically received those assignments, and what is their seniority relative to yours?"\n- "Was there any process for these assignments — a posting, a conversation, a manager decision — or did they simply happen without explanation?"\n\nQuestion NOT to ask: "Why do you think your manager is doing this?" — This invites speculation about intent, which is the investigator's role to assess through evidence. Asking a complainant to speculate about motive anchors the investigation to the complainant's theory rather than the facts.`,
          estimatedMinutes: 20,
        },
      ],
      questions: [
        {
          id: "ceu-m1-q1",
          question:
            "A remote employee reports that her manager consistently excludes her from video meetings where team assignments and visibility opportunities are discussed. She cannot point to a formal demotion or pay cut. As an investigator, your first step is to:",
          options: [
            "Close the complaint pending an adverse action — exclusion from meetings is not independently actionable.",
            "Notify legal counsel before taking any investigative steps, since the legal theory is unclear.",
            "Interview the complainant to understand the full scope of the exclusion, its frequency, and any impact on her work conditions or opportunities.",
            "Request a written statement from the manager explaining the meeting invitation decisions.",
          ],
          correctIndex: 2,
        },
        {
          id: "ceu-m1-q2",
          question:
            "The EEOC's guidance on workplace harassment clarifies that conduct occurring through messaging apps, emails, or social media platforms is:",
          options: [
            "Subject to a separate and lower legal threshold than in-person conduct.",
            "Evaluated under the same hostile work environment standards as in-person conduct.",
            "Only actionable if the employer's electronic communication policy explicitly prohibits it.",
            "Excluded from Title VII coverage unless it results in a tangible employment action.",
          ],
          correctIndex: 1,
        },
        {
          id: "ceu-m1-q3",
          question:
            "Before any formal action is taken on a promotion decision, a manager tells his HR partner: 'I'm just not sure she'd be committed enough — she has two small kids at home.' HR documents the comment. If a discrimination complaint is later filed, this statement:",
          options: [
            "Cannot be used as evidence because the manager did not make the promotion decision unilaterally.",
            "Is protected as a personal opinion expressed in a private conversation.",
            "May be treated as circumstantial evidence of discriminatory intent and should be included in any subsequent investigation.",
            "Is relevant only if the complainant can show the manager used the same reasoning for other candidates.",
          ],
          correctIndex: 2,
        },
      ],
    },

    // ── Module 2: Investigation Quality Risks ─────────────────────────────
    {
      id: "ceu-mod-2",
      title: "Investigation Quality Risks",
      summary:
        "Focuses on the investigator errors most likely to compromise a report's credibility or create legal exposure — from rushed credibility determinations and incomplete document review to failure to follow up on material inconsistencies. Recognizing these risks before they occur is a core annual competency.",
      content: `## The Most Consequential Errors Are Process Failures

The most damaging investigation errors are not legal misreadings — they are process failures that undermine an otherwise valid outcome. An investigation that reaches the right conclusion through a flawed process is vulnerable to challenge at every stage: internal appeal, EEOC charge response, mediation, and litigation. An investigation with a robust, documented process produces defensible findings even when the conclusion is uncertain or uncomfortable. The distinction matters because investigations are reviewed months or years after the fact, by people who were not present, based on what the record shows — not what the investigator remembers or what the organization believes to be true.

Understanding which errors create the most exposure requires honest assessment of how investigations typically go wrong. Most failures are not dramatic departures from protocol; they are incremental shortcuts, each of which appears reasonable in isolation, that collectively produce a record that cannot withstand scrutiny. Investigators who have completed training but lack ongoing quality feedback are particularly susceptible to these drift patterns. The goal of this module is to make those patterns explicit so they can be recognized and corrected before they compound.

## Premature Conclusions and Confirmation Bias

The most pervasive quality risk in workplace investigation is reaching a conclusion before the investigation is complete. An investigator who forms an early judgment — based on the initial complaint description, the first party interview, a personal read of the parties' credibility, or organizational context about the respondent — will unconsciously filter subsequent evidence through that judgment. Evidence that confirms the early conclusion is noted and documented. Evidence that complicates or contradicts it is minimized, attributed to bias in the witness, or simply not pursued.

The record produced under confirmation bias is structurally one-sided. It does not reflect the evidentiary record; it reflects the investigator's hypothesis about the evidentiary record. The problem surfaces clearly when the report is read by someone who did not conduct the investigation: they notice that contradictory evidence appears in the notes but not in the analysis, or that a witness whose account complicates the conclusion is described without engaging with what they actually said.

The discipline required is procedural and deliberate. Complete all planned interviews before assessing credibility. Request all relevant documents before drafting findings. Hold the conclusion explicitly open — write a placeholder in your notes, not a draft finding — until the evidentiary record is genuinely complete. When you feel certain of the outcome midway through the investigation, treat that certainty as a signal to increase rigor, not accelerate your timeline. Certainty formed before the record is complete is not confidence in the evidence; it is confidence in your hypothesis, which is a different and more dangerous thing.

## Documentary Completeness

An investigation record is only as reliable as the documentary evidence it contains. Witness testimony — even credible, internally consistent, corroborated testimony — is subject to challenge on grounds of memory decay, relationship dynamics, and motivation to shade the account. Documentary evidence anchors witness accounts to contemporaneous facts that existed before the investigation began. A record of what was actually written, sent, or logged at the time of the relevant events is immune to the memory and motivation problems that affect retrospective testimony.

An investigation that collects no documents, requests documents only after interviews are complete, or declines to review available records because the outcome seems clear is professionally indefensible. This is true even when the witness accounts are consistent and compelling. A complainant whose account is strongly corroborated by documentary evidence has a more defensible finding than one whose account is simply believed. A respondent who is found not credible without any documentary evidence to support that finding is in a more exposed position than one whose inconsistencies are demonstrated through the record.

Documentary evidence in an EEO investigation includes: performance reviews and improvement plans, email and messaging communications, calendar and scheduling records, HR intake notes and prior complaint files, pay and promotion records, policy and handbook versions in effect at the relevant time, and any other record that could corroborate or contradict witness accounts. The scope of documents requested should be driven by the allegations, not by convenience or relationship. When a relevant document was not obtained, the report should explain why. When a document was requested but not produced, that non-production is itself a finding — document it, document when the request was made, and note any explanation provided for the non-production.

## Witness Credibility Determinations

Credibility assessments must be documented with specificity and grounded in observable, articulable factors — not stated as conclusions. The phrases "the complainant appeared credible," "the witness seemed evasive," or "I found the respondent to be forthright" are not credibility determinations. They are opinions that no reviewer can evaluate, challenge, or build on. A defensible credibility determination explains what the investigator observed, what specific factors support the assessment, and how those factors relate to the evidentiary record as a whole.

The factors that support a sound credibility determination include: internal consistency of the account within and across interviews; corroboration with or contradiction by documentary evidence; the spontaneity and specificity of detail in the account (specific dates, locations, exact language recalled); the witness's relationship to the parties and any potential motivation to shade or withhold the account; and whether the account has changed in material respects since the complaint was filed. Each of these factors can be described, documented, and connected to the specific evidence in the file.

Credibility is not about who is more likable, more articulate, or more composed under pressure. These qualities correlate with presentation skill, not truthfulness. An investigator who credits a composed, articulate respondent over a distressed, fragmented complainant on the basis of composure alone is assessing presentation, not credibility. The same error runs in the other direction: distress and emotionality during a complaint interview do not establish the truth of the account. Assess each witness's account against the full evidentiary record, and document the basis for the assessment in terms that any reader can evaluate independently.

## Following Up on Material Inconsistencies

When evidence reveals a factual inconsistency — a witness account that directly contradicts a document, testimony from two witnesses that conflicts on a material point, or a party account that changed between the complaint filing and the formal interview — the correct response is to investigate the inconsistency, not to resolve it by selecting whichever account fits the working theory. Re-interview the relevant witness. Confront the inconsistency directly but without accusation. Give the witness a genuine opportunity to explain, clarify, or reconcile the conflict. Document the exchange in full.

Skipping this step because the outcome seems predictable is a quality error that becomes visible in retrospect. Unaddressed inconsistencies are the first thing identified in any external review of an investigation file — by legal counsel preparing a litigation response, by an outside investigator reviewing for compliance, or by an administrative law judge assessing credibility. The question will not be "why didn't the investigator resolve this inconsistency?" — it will be "why didn't the investigator even ask?" The failure to follow up signals either that the investigator did not notice the inconsistency (suggesting inadequate review of the record) or noticed it and avoided it (suggesting bias toward a predetermined conclusion).

Material inconsistencies also arise within a single witness's account. When a party or witness says something in the formal interview that contradicts what they told HR at intake, or what they said to a colleague documented in a witness statement, that internal inconsistency should be noted and addressed. The explanation may be innocent — memory improves with reflection, initial accounts are often incomplete — or it may be significant. Either way, the investigator should document what changed and why.

## Pattern Evidence and Scope Management

When a complainant or witness mentions that others have had similar experiences with the same respondent, that information must be documented and deliberately evaluated — not reflexively excluded as hearsay or beyond scope. Pattern evidence is substantively relevant to multiple dimensions of the investigation: it bears on whether the respondent's conduct was deliberate and sustained rather than isolated; whether the employer had prior constructive or actual notice of the conduct pattern; whether the conduct represents an individual deviation or a systemic failure; and whether the remedial measures required are individual or organizational.

The decision not to follow up on pattern evidence is a scope decision, and like all scope decisions it must be made deliberately and documented with a genuine rationale. "We were only asked to investigate this complaint" is not a rationale — it is a description of the assignment. The rationale must explain why the scope limitation is appropriate given the specific facts: the nature of the alleged conduct, the relationship between the current complaint and the reported pattern, and whether the pattern information, if accurate, would be material to the current finding or to recommended remediation.

In practice, pattern evidence can be explored without significantly expanding the investigation's formal scope. Requesting prior complaint files involving the same respondent, reviewing prior HR notes or corrective action documentation, and asking witnesses directly whether they have observed similar conduct from the respondent are all targeted steps that do not transform the investigation into a systemic review. Document what you found, what it suggests, and how it was weighted in the current analysis.

## The "Unable to Determine" Finding and What It Requires

An "unable to determine" finding is a legitimate and professionally defensible outcome. It is the correct conclusion when the investigator has genuinely exhausted available evidence and the conflict between accounts cannot be resolved at the preponderance level. The error is not using this finding when the evidence warrants it. The error is treating it as a shortcut — a way to exit a difficult investigation without doing the work that would either resolve the conflict or establish that it genuinely cannot be resolved.

A proper "unable to determine" finding requires documented completion of the same investigative steps that any other finding requires: all relevant witnesses interviewed, all obtainable documents reviewed, all material inconsistencies followed up, and all credibility factors assessed with specificity. The report must then explain what evidence was gathered, what each piece of evidence supports, why the conflict between accounts cannot be resolved, and what additional evidence, if any, would change the outcome. A two-sentence statement noting conflicting accounts does not reflect a thorough investigation. It reflects one that reached the hard part and stopped.

Investigators should also distinguish between two different types of "unable to determine" situations. The first is a record that has been fully developed but remains genuinely ambiguous — where credible witnesses give incompatible accounts, documents support neither party conclusively, and no additional evidence is reasonably obtainable. This produces a legitimate finding. The second is a record that is underdeveloped because the investigator did not pursue available evidence. This produces a premature conclusion that will be exposed in any subsequent review. Only the first is professionally defensible. The investigator's job is to ensure that the record reflects genuine exhaustion of available evidence before this finding is reached.`,
      examples: [
        {
          scenario: "An investigator interviews the complainant first and finds her account compelling. The investigator then interviews the respondent, who provides a plausible alternative account and documentary evidence the investigator had not anticipated. Rather than treating this as a reason to re-examine the complaint, the investigator notes the respondent's evidence as 'not conclusive' and proceeds to a finding of substantiation based on the complainant's account.",
          explanation: "This is confirmation bias in action. Once the complainant's account was favored, the respondent's evidence was minimized rather than examined on its merits. A defensible investigation would re-interview the complainant specifically about the respondent's documentary evidence, assess whether the documents change the credibility calculation, and document that analysis explicitly. The finding may ultimately remain the same — but it must reflect genuine engagement with the contradictory evidence.",
        },
        {
          scenario: "An investigator has completed all witness interviews and is confident the complaint is unsubstantiated. While reviewing notes before drafting the report, she realizes the complainant mentioned email exchanges that she never requested. The emails would take two business days to obtain. The investigator decides not to request them, noting in the report that all available evidence was reviewed.",
          explanation: "Available evidence is not the same as obtained evidence. Evidence that could have been obtained and was not is a gap in the investigation. Characterizing the investigation as complete when relevant records were never requested is a material misrepresentation. Request the emails. If they confirm the conclusion, the investigation is stronger. If they complicate it, they needed to be examined. Either way, the record must be complete.",
        },
        {
          scenario: "Two witnesses give directly conflicting accounts of the same incident. One witness is more composed and articulate in the interview; the other appears nervous and gives answers in fragments. The investigator credits the more composed witness and bases the finding on that account.",
          explanation: "Presentation quality is not a proxy for truthfulness. People respond differently to formal interview settings based on personality, cultural background, communication style, and anxiety about the process. A credibility determination should be based on corroboration with the documentary record, internal consistency of the account over multiple interviews, specificity of detail, and logical coherence — not on how polished the witness appeared under pressure.",
        },
        {
          scenario: "During an investigation into a supervisor's conduct, a witness mentions that the same supervisor had two complaints filed against him by other employees in the previous three years, neither of which resulted in any action. The investigator notes this briefly in her witness summary and does not follow up.",
          explanation: "Prior complaints against the same respondent are pattern evidence with direct bearing on the current investigation. They may establish that the employer had actual notice of a conduct pattern, which is relevant both to the current finding and to any remedial decision the employer makes after it. The investigator should document this information fully, request the prior complaint files to determine what they alleged and how they were resolved, and assess whether the pattern of inaction itself contributed to the conditions that produced the current complaint. Note this in the report, including whether the prior complaints and the current one share common conduct types.",
        },
        {
          scenario: "An investigator conducts a thorough investigation. After reviewing all interviews and documentary evidence, she concludes she cannot determine whether the alleged conduct occurred. The relevant portion of her report reads: 'This investigation was unable to determine the facts. The accounts of the parties conflicted and neither was more credible than the other.' No further explanation is provided.",
          explanation: "The finding may be correct, but the documentation does not support it. A defensible unable-to-determine conclusion must show that the investigation was exhaustive — that all available evidence was gathered, all material inconsistencies followed up, and all credibility factors assessed with specificity. The report must explain what each piece of evidence supports, what created the unresolvable conflict, and what additional evidence would have been needed to reach a more definitive conclusion. Without this, the finding reads as a premature exit from a difficult record, not as the product of a completed investigation.",
        },
      ],
      guidance: [
        "Hold your conclusion open until the investigation is complete — write a placeholder in your notes, not a draft finding, until all evidence is in.",
        "Document every credibility determination with specificity: what you observed, what corroborated or contradicted it, and why those factors support the assessment. 'Appeared credible' is not a credibility determination.",
        "Request documentary evidence at the start of the investigation, not after interviews are complete. Documents anchor testimony and frequently reveal material facts that witnesses do not volunteer.",
        "When a witness raises pattern evidence, document it and evaluate whether follow-up is warranted. Deciding not to follow up is a scope decision that requires a rationale, not a reflex.",
        "Material inconsistencies require direct follow-up: re-interview the relevant witness, confront the inconsistency explicitly, give the witness a genuine opportunity to address it, and document the exchange in full.",
        "An 'unable to determine' finding is valid only when supported by a documented record showing that all available evidence was gathered and the conflict genuinely could not be resolved at the preponderance level.",
        "Evidence that was available but not obtained is a gap in the investigation. If you chose not to obtain available evidence, document why that decision was appropriate.",
        "Review your report draft for evidence you obtained but did not address. Unacknowledged evidence in the file is a vulnerability in the written record that any reviewer will identify.",
      ],
      caseStudies: [
        {
          scenario: `A harassment complaint is filed by Priya against her manager, Devon. Priya describes a six-month pattern of demeaning comments about her Indian background, often made during team meetings. Devon denies the comments and characterizes Priya as "hypersensitive." The investigator interviews three team members: one corroborates two specific incidents, with dates and exact language; two say they did not notice anything unusual. The investigator is ready to draft a "not substantiated" finding. While reviewing her notes, she notices that Priya mentioned Devon uses a team Slack channel to share "jokes" with the group — but the investigator never requested the Slack history.`,
          questions: [
            {
              id: "ceu-m2-cs1-q1",
              question: "The investigator's correct next step before drafting findings is to:",
              options: [
                "Proceed with 'not substantiated' — three witness interviews were conducted and the majority did not corroborate.",
                "Request and review the Slack channel history — the complainant referenced it and it is potentially material evidence that has not been obtained.",
                "Ask Priya to provide screenshots herself, since she has firsthand access and it avoids the IT coordination burden.",
                "Note in the report that Slack records were identified but not obtained due to time constraints.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m2-cs1-q2",
              question: "Devon's characterization of Priya as 'hypersensitive' is:",
              options: [
                "A credibility-undermining statement that is itself evidence of discriminatory attitude.",
                "A legitimate defense that shifts the burden of proof to Priya to demonstrate objective harm.",
                "One factor in Devon's account that must be documented alongside substantive credibility factors — internal consistency, corroboration, level of detail — not substituted for them.",
                "Admissible as a defense only if Priya is given a formal opportunity to rebut it during a second interview.",
              ],
              correctIndex: 2,
            },
            {
              id: "ceu-m2-cs1-q3",
              question: "The one corroborating witness described two specific incidents with dates and exact language. Two witnesses said they 'did not notice anything.' In credibility analysis, these accounts:",
              options: [
                "Two accounts outweigh one; the corroborating witness's account should be discounted accordingly.",
                "'Did not notice' is not the same as 'it did not happen' — the corroborating witness's specific, detailed account may carry more evidentiary weight than negative reports from witnesses who may not have been attentive.",
                "Must be resolved by re-interviewing all three witnesses together in a joint session.",
                "Produce an automatic 'unable to determine' finding whenever witness accounts diverge on a material point.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m2-cs1-q4",
              question: "If the Slack history contains multiple messages with ethnic slurs and mocking content posted by Devon, the investigator must:",
              options: [
                "Weigh this documentary evidence alongside the witness accounts and reassess the credibility analysis and overall finding.",
                "Note it as supplementary context but maintain the original 'not substantiated' finding, since the formal witness interviews were already complete.",
                "Restart the investigation from the beginning, since new documentary evidence invalidates prior interview records.",
                "Immediately substantiate the complaint based on the documentary evidence alone, without further analysis.",
              ],
              correctIndex: 0,
            },
          ],
          explanation: `The central error in this case is the failure to gather available documentary evidence before drafting a finding. Priya referenced the Slack channel — it is an identified, obtainable source that has not been examined. An investigation that does not request evidence the complainant specifically mentioned is not complete, and a finding based on that incomplete record is not defensible. On credibility: two witnesses who 'did not notice' something do not neutralize one witness who can describe specific incidents with particularity. Inattention is not contradiction. On the Slack evidence: if obtained, it must be factored into the analysis. The preponderance standard applies to the full record as ultimately assembled — not to the record as it existed before a particular point in the investigation. The finding may change, or the existing credibility analysis may be confirmed with additional support. Either way, the record must be complete before the finding is written.`,
        },
        {
          scenario: `Jordan files a complaint alleging that his regional manager, Frank, has created a hostile work environment by assigning Jordan to lower-visibility client accounts and making repeated comments suggesting Jordan "doesn't seem like a leader." During witness interviews, two separate witnesses mention in passing that Frank "had similar issues" in his previous department several years ago. One witness says there were "complaints" at the time; the other says Frank's prior team "had a lot of turnover." The investigator notes these references briefly in her witness summaries and does not follow up.`,
          questions: [
            {
              id: "ceu-m2-cs2-q1",
              question: "When a witness mentions prior complaints or conduct patterns involving the same respondent, the investigator should:",
              options: [
                "Ignore it — prior unsubstantiated conduct is inadmissible and cannot be considered in the current investigation.",
                "Ask follow-up questions to understand what the witness knows, document the information, and assess whether requesting prior complaint records is warranted.",
                "Immediately expand the investigation into a formal systemic review of the respondent's conduct history.",
                "Advise the witness that prior conduct is outside scope and should not be raised again during the investigation.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m2-cs2-q2",
              question: "The decision NOT to follow up on the pattern evidence must be:",
              options: [
                "Made verbally with the HR director rather than documented, to avoid creating a discoverable record of the scope limitation.",
                "Documented with a rationale explaining why the pattern information is not material to the current investigation and remediation analysis.",
                "Approved by legal counsel before the investigation can proceed past the scope limitation.",
                "Automatic — information from prior departments involving different complainants is always outside scope.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m2-cs2-q3",
              question: "Prior complaint records involving the same respondent are relevant to the current investigation primarily because they:",
              options: [
                "Can be used to impeach the respondent's credibility if his conduct in the prior complaints was more serious than the current allegations.",
                "May establish that the employer had actual or constructive notice of a conduct pattern before this complaint, and whether prior remediation was adequate.",
                "Are required to be disclosed to the complainant as part of the investigation record under EEOC regulations.",
                "Can substitute for witness testimony if direct access to prior complainants is unavailable.",
              ],
              correctIndex: 1,
            },
          ],
          explanation: `Pattern evidence is not a distraction from the current investigation — it bears directly on whether the conduct was deliberate and sustained, whether the employer had prior notice, and what remediation the current complaint may require. Two witnesses independently referencing prior problems with the same respondent is significant enough to warrant follow-up: at minimum, requesting prior complaint files and HR records from the earlier department to determine what was alleged and how it was resolved. Choosing not to pursue this information is a scope decision that must be documented with a genuine rationale — not an implicit decision to stay narrow. If prior complaints were closed without action, that pattern of inaction may itself be relevant to what the employer knew and what remediation is now required. The phrase "outside scope" is not a rationale; it is a characterization of the assignment that needs justification.`,
        },
      ],
      practicalExercises: [
        {
          title: "Write a Defensible Credibility Determination",
          prompt: "You have completed interviews in a hostile environment investigation. The complainant, Rosa, alleges her supervisor made two specific comments referencing her religion over a two-week period. The supervisor, Daniel, denies both. Review the evidence summary below and write a credibility determination paragraph.\n\nRosa's account: Described both comments with specific dates, exact language, and the names of colleagues who were nearby. Has been consistent across both the intake interview and the formal interview. Produced an email she sent to a friend the day after the second comment, describing it in language consistent with her interview account. Has no prior complaints against any supervisor. Was visibly distressed during the formal interview.\n\nDaniel's account: Denies both comments categorically. Said Rosa 'misheard' a comment he made about an upcoming holiday schedule. Changed his account of where he was standing during the second alleged incident between the intake and formal interview. Has no prior complaints filed against him. Was calm and composed throughout both interviews.",
          instructions: [
            "Write a credibility determination paragraph of 5–8 sentences.",
            "Apply at least three specific credibility factors — name each factor explicitly.",
            "Explain what each factor shows in this specific case, using the evidence summary above.",
            "Reach a conclusion using correct preponderance language ('more likely than not').",
            "Do not use demeanor as a primary basis for the determination.",
            "Do not use phrases like 'I believe,' 'it is clear,' or 'appeared credible.'",
          ],
          sampleResponse: `Based on the preponderance of the evidence, Rosa's account is more credible than Daniel's. Three factors support this assessment. First, internal consistency: Rosa's account of both incidents — including the specific language used, the dates, and the identities of nearby witnesses — was consistent across both the intake interview and the formal interview without material variation. Daniel's account changed in a material respect between interviews: he described himself as standing in a different location during the second incident in the formal interview than he had in intake, a discrepancy he could not explain. Second, contemporaneous corroboration: Rosa produced an email sent to a personal contact the day after the second incident, describing the comment in language substantively consistent with what she reported to investigators. This document predates the investigation and is not susceptible to the suggestion that it was shaped by the complaint process. Third, specificity of detail: Rosa provided the exact language of both comments, the dates, and the names of colleagues present at each incident. Daniel offered only a categorical denial and an alternative interpretation of the first comment. The specificity and consistency of Rosa's account, combined with the contemporaneous documentary corroboration and the identified inconsistency in Daniel's account, support a finding that it is more likely than not that the comments occurred as Rosa described.`,
          estimatedMinutes: 25,
        },
        {
          title: "Audit an Investigation for Quality Risks",
          prompt: "Review the following investigation summary and identify every quality risk. For each risk, explain what the investigator should have done differently.\n\nInvestigation summary: A complaint was filed by James, a warehouse supervisor, alleging race-based hostile environment by his manager, Tom. The investigator interviewed James first and found his account compelling. The investigator then interviewed Tom, who denied the allegations and provided text messages suggesting James had used offensive language toward Tom in a prior exchange. The investigator noted the texts as 'not conclusive' and did not re-interview James about them. Two witnesses were interviewed: one said she had not observed anything; the other mentioned that Tom 'had a reputation' from a prior department but the investigator did not follow up. The investigator drafted a finding of 'not substantiated' without requesting any documentary evidence (emails, HR notes, prior complaint files). The finding section reads: 'After a thorough review, I find the complainant's account less credible than the respondent's. The evidence is insufficient to substantiate the complaint.'",
          instructions: [
            "Identify every quality risk or procedural failure in the investigation summary — aim for at least five.",
            "For each risk, write one sentence explaining what the investigator should have done instead.",
            "Identify which risks, if left uncorrected, would most likely draw challenge in subsequent legal or administrative review.",
          ],
          sampleResponse: `Quality risks identified:\n\n1. Failure to re-interview after new evidence: The respondent provided text messages the investigator had not anticipated. Best practice requires re-interviewing the complainant specifically about new material evidence — giving James an opportunity to address the texts and allowing the investigator to assess their credibility in context. The investigator should have scheduled a follow-up interview with James immediately.\n\n2. Dismissing documentary evidence without analysis: Characterizing the text messages as 'not conclusive' without any documented analysis is a credibility and quality failure. The investigator should have described what the texts showed, why they were or were not corroborative of the respondent's account, and how they affected the overall credibility assessment.\n\n3. Failure to follow up on pattern evidence: The second witness mentioned Tom had a 'reputation' from a prior department. This is a direct signal of potential pattern evidence — prior complaints or HR records involving the same respondent — that the investigator did not pursue. At minimum, the investigator should have asked follow-up questions and requested prior complaint files.\n\n4. No documentary evidence requested: The investigation collected no documents whatsoever — no emails, no HR notes, no prior complaint records, no performance documentation. In a hostile environment case with a six-month alleged pattern, relevant communications almost certainly exist. The finding cannot be described as thorough.\n\n5. Inadequate credibility determination: 'Less credible than the respondent's' is not a credibility determination. It states a conclusion without explaining which factors led to it, what was observed, or what specific evidence supported the finding. This will not survive review.\n\n6. 'Thorough review' language without basis: Describing the review as thorough when no documents were gathered and a material inconsistency was not followed up is a mischaracterization that creates its own legal exposure.\n\nHighest-risk failures for legal review: (1) and (4) — the failure to re-interview after new evidence and the complete absence of documentary evidence are the most visible and indefensible gaps.`,
          estimatedMinutes: 20,
        },
      ],
      questions: [
        {
          id: "ceu-m2-q1",
          question:
            "Midway through an investigation, a witness provides a detailed account that contradicts the complainant's version of events on a key factual point. You have already interviewed the complainant. Before making a credibility determination, you should:",
          options: [
            "Weigh the witness account more heavily because it corroborates the respondent's version.",
            "Re-interview the complainant specifically about the inconsistency the witness raised.",
            "Note the contradiction in the report and move forward with the complainant's original account.",
            "Suspend the investigation until the witness provides a written sworn statement.",
          ],
          correctIndex: 1,
        },
        {
          id: "ceu-m2-q2",
          question:
            "An investigator finishes all party interviews and is confident the complaint is unsubstantiated. While drafting the report, she recalls that the complainant mentioned specific email exchanges she never requested. She believes they are unlikely to change the outcome. The correct action is:",
          options: [
            "Finalize the report and add a footnote acknowledging the emails were available but not reviewed.",
            "Close the investigation since all witness interviews have been completed and the outcome is clear.",
            "Ask the complainant whether the emails are truly necessary before deciding whether to retrieve them.",
            "Request and review the emails before finalizing — even if they confirm the conclusion, the investigation record must be complete.",
          ],
          correctIndex: 3,
        },
        {
          id: "ceu-m2-q3",
          question:
            "During an investigation, the complainant mentions that a colleague had a similar experience with the same respondent about eighteen months ago and never reported it. This information:",
          options: [
            "Falls outside the scope of the current investigation and should not be included in the report.",
            "Is only relevant if the second employee is willing to participate as a witness.",
            "Constitutes hearsay and should be excluded from the investigative record.",
            "May represent pattern evidence and should be documented and explored through additional follow-up.",
          ],
          correctIndex: 3,
        },
      ],
    },

    // ── Module 3: Modern Workplace Scenarios ──────────────────────────────
    {
      id: "ceu-mod-3",
      title: "Modern Workplace Scenarios",
      summary:
        "Applies EEO investigation principles to current workplace contexts: third-party contractors, company-sponsored off-site events, social media evidence, gender identity, and intersectional complaints. These scenarios reflect the situations investigators are most likely to encounter but least likely to have encountered in initial training.",
      content: `## Third-Party and Contractor Conduct

Employer liability for EEO violations does not stop at the boundaries of the payroll. Courts and the EEOC have consistently held that employers can be liable for harassment or discriminatory conduct committed by non-employees — contractors, vendors, clients, and temporary staffing agency personnel — when the employer knew or should have known about the conduct and failed to take prompt, reasonable corrective action. The critical factor is not the harasser's employment status. It is whether the employer had notice and the authority to act.

In practice, this means that when an employee reports conduct by an on-site contractor, the investigation obligation is identical to what it would be if the respondent were a co-worker. The investigator gathers witness accounts, reviews relevant communications, assesses credibility, and documents findings. If the conduct is substantiated, the remedial action will look different — the employer may contact the contracting company, restrict site access, or terminate the contract — but the investigative process is the same. An investigator who declines to open a formal investigation because "that person doesn't work here" is misapplying the law and creating liability exposure for the organization.

Documentation in contractor cases should note which party employs the alleged harasser, the nature of the contractor relationship, whether the contractor's personnel had regular contact with the complainant, and what authority the organization had to direct or remove the contractor's staff. These details support the eventual remedial decision.

## Company-Sponsored Off-Site Events

The phrase "off company premises" does not define the boundaries of employer EEO obligations. What matters is whether the organization sponsored, funded, controlled, or organized the event. Company holiday parties, after-hours team dinners, off-site retreats, and training programs held at hotels or conference centers are all treated by courts and enforcement agencies as extensions of the workplace — regardless of whether the event occurred during business hours or whether attendance was described as optional.

"Optional" attendance is often not meaningfully voluntary. When a direct supervisor attends, when professional networking is an expected outcome, or when an employee would face social or professional consequences for absence, nominal optionality does not insulate the employer from liability for conduct that occurs at the event.

Investigators handling complaints about off-site events should not begin by questioning whether the event was "really" work-related. That analysis is a legal determination that follows investigation, not a precondition for opening one. Open the investigation, gather the facts about what occurred at the event, and allow the legal determination to flow from the record rather than from a threshold gatekeeping decision about venue.

## Social Media Evidence

Social media has become a routine source of evidence in workplace investigations, and it requires handling protocols that differ from other documentary evidence. The unique risks are: content may be deleted before it can be preserved, context on a personal platform may differ materially from workplace context, and authenticity questions arise more frequently than with internal systems.

When a complainant or witness references a social media post, message, or account as part of the complaint, document it immediately. Take dated screenshots with the full URL, account name, and timestamp visible. Do not rely on memory or informal notes — the content may disappear. If you lack technical access to preserve the content formally, request IT or legal support early.

Authenticity assessment is important. A screenshot provided by a complainant should be verified against the original platform where possible. Altered screenshots, out-of-context cropping, and edited captions occur in adversarial situations. Where a post cannot be independently verified, note this in the file and weight the evidence accordingly rather than discarding it entirely.

Context is the most nuanced challenge. A comment that appears discriminatory in isolation may, in its full thread, reflect a different intent — or it may appear innocuous in isolation but be part of a documented pattern of targeted conduct. Investigators should review enough surrounding context to assess the communication accurately, and should document what they reviewed and why they drew the conclusions they did.

## Gender Identity and Expression Complaints

Following the Supreme Court's decision in Bostock v. Clayton County (2020), discrimination based on gender identity or sexual orientation is covered sex discrimination under Title VII. Investigators should approach gender identity and expression complaints using exactly the same analytical framework they would apply to any other sex discrimination or hostile environment claim — no special procedural rules apply, and no heightened burden of proof is required of the complainant.

The factual questions in these cases follow the standard pattern: What conduct occurred? How often and over what period? Was the complainant targeted because of their protected characteristic? What was the impact on their work environment? Did the employer have notice, and if so, what was the response?

Pronoun misuse warrants specific attention. Deliberate, repeated misgendering of an employee — particularly by a supervisor — is conduct that must be investigated under the same harassment standards applicable to other protected characteristics. A single inadvertent misuse is different from a sustained pattern of refusal to use an employee's correct pronouns. Investigators should document the frequency, context, and whether the conduct continued after the complainant raised it internally. These distinctions matter for the severity and pervasiveness analysis.

Investigators should also be attentive to conduct that is framed in neutral terms but appears to target an employee because of their gender expression. Dress code enforcement applied selectively, assignment decisions, and informal exclusions from team activities can all be evidence in a gender identity discrimination case.

## Intersectional Complaints

An intersectional complaint alleges that discrimination occurred because of the combination of two or more protected characteristics — for example, a Black woman who claims she was passed over for promotion in circumstances where neither Black male employees nor white female employees experienced the same outcome. The Supreme Court has recognized intersectional claims in certain contexts, and the EEOC treats them as cognizable.

The investigative error to avoid is splitting an intersectional complaint into separate tracks (one for race, one for sex) and evaluating each in isolation. An intersectional claim may disappear under that analysis even if the discriminatory conduct is real, because the harm only becomes visible when the protected characteristics are considered together. A unified investigation that asks "how did the combination of these characteristics affect the treatment this employee received?" will produce more accurate findings.

This does not mean the investigation becomes more complex operationally. The same witness interviews, document requests, and comparator analysis apply. The difference is in the framing of the factual question and the scope of the comparator analysis — the investigator looks for employees who share neither characteristic, and assesses whether the complainant's treatment differs from that of employees in each comparator group.

## Remote and Hybrid Work Contexts

Remote and hybrid work environments present investigation logistics challenges that require adaptation of standard practices. Workplace communications now occur across email, instant messaging platforms, video calls, document collaboration tools, and personal devices. An investigation that only reviews official email accounts may miss significant evidence.

Investigators should be explicit in their evidence-gathering requests about the full range of communication channels relevant to the complaint. This means asking complainants and witnesses specifically whether relevant communications occurred on Slack, Teams, text, or other platforms — not waiting for them to volunteer this information. It also means coordinating with IT about preservation holds early in the process.

The remote context also affects witness dynamics. An employee working in a different time zone or on a different team than the alleged harasser may nonetheless have relevant knowledge — they may have been on shared calls, in shared project channels, or privy to communications that bear on the complaint. Investigators should map the communication networks relevant to the allegations, not limit witness identification to people who physically share a workspace.

Finally, the "severity and pervasiveness" analysis in remote environments may require recalibration. An employee who is subjected to hostile conduct in a video call with twenty colleagues, or who receives harassing messages that follow them into their home workspace, may experience a different level of impact than the same conduct in a traditional office. These contextual factors should be part of the factual record.`,
      examples: [
        {
          scenario:
            "A manufacturing facility uses a staffing agency to supply line workers. An agency worker repeatedly makes sexually offensive comments to a direct-hire employee. The employee reports the conduct to her supervisor. The supervisor tells her 'He's not one of ours — talk to the agency.' No investigation is opened.",
          explanation:
            "This is a liability-generating error. Employer liability for third-party harassment requires notice and a failure to respond — both of which are present here. The supervisor's statement that the harasser 'isn't ours' is not a defense; it is evidence of a failure to act. The correct response was to open an investigation and either address the conduct with the staffing agency or restrict the individual's access to the facility. The employer's failure to act is actionable regardless of the harasser's employment relationship.",
        },
        {
          scenario:
            "A company holds an annual off-site retreat billed as 'optional enrichment.' Attendance is not required, but the CEO presents the company's strategic direction and senior leaders attend. A junior employee is subjected to race-based harassment by a colleague during the evening social portion of the event. She files a complaint. HR questions whether the retreat is 'really' a work event.",
          explanation:
            "The company's characterization of the event as optional does not determine its EEO status. Courts assess whether the event was employer-sponsored, whether leadership participation made attendance professionally significant, and whether the circumstances created a work-like power dynamic. All three factors are present here. The investigation should proceed under standard procedures. HR's threshold question is the wrong analytical starting point.",
        },
        {
          scenario:
            "An investigator receives a screenshot from a complainant showing a respondent's social media post containing a racially offensive image. When the investigator later tries to access the post independently, it has been deleted. The complainant's screenshot is the only record of the content.",
          explanation:
            "The investigator should document the preservation failure, note the date the screenshot was provided and the date the post was no longer accessible, and assess the complainant's screenshot for authenticity — including metadata if available. The deletion itself, if the timing follows the investigation opening, is a relevant fact. The single-source screenshot, with appropriate authentication analysis, can still be weighed as evidence. Its weight will depend on corroborating context: were witnesses present when the content was posted, did others respond to it at the time?",
        },
        {
          scenario:
            "A transgender employee reports that her supervisor consistently refers to her by her former name and uses male pronouns after being corrected three times over two months. The supervisor says the misuse is habitual and not intentional. The employee also reports being assigned to a different client account after coming out at work — an account with fewer advancement opportunities.",
          explanation:
            "The persistent pronoun and name misuse, continuing after explicit correction, meets the threshold for a hostile environment investigation. The supervisor's characterization of the conduct as habitual rather than intentional does not resolve the investigation — both patterns and intent are relevant facts. The reassignment to a less favorable account should be investigated as a potential discrete act of adverse action based on gender identity, separate from but connected to the hostile environment claim. The combined record should be analyzed under Title VII following Bostock.",
        },
        {
          scenario:
            "A Latina employee alleges that she was passed over for a team lead role. The employer notes that her male Latino colleague was also not selected, and that a white female colleague was. HR concludes that the selection decision was not based on race because Latinos were not uniformly disadvantaged, and was not based on sex because women were not uniformly disadvantaged.",
          explanation:
            "This analysis reflects the analytical error in intersectional claims. The correct comparator is not 'Latinos generally' or 'women generally' but employees who share neither of the complainant's protected characteristics — specifically, white male employees. If white male employees were selected at higher rates than Latina employees under similar circumstances, the intersectional claim is not addressed by the employer's comparator analysis. The investigation should be reopened with an appropriate intersectional framework.",
        },
      ],
      guidance: [
        "Always open a formal investigation when an employee reports harassment by a contractor or vendor — 'they don't work here' is not an exception to the investigation obligation.",
        "For off-site event complaints, begin with the same investigation procedures you would use for on-premises conduct; the venue analysis is a legal determination that follows the factual record.",
        "When social media evidence is identified, preserve it immediately with dated screenshots capturing the full URL, account name, and surrounding context — do not wait for formal legal direction.",
        "In gender identity complaints, document the frequency, context, and whether misgendering continued after the complainant corrected it — these distinctions drive the severity and pervasiveness analysis.",
        "Intersectional complaints should be analyzed with a unified framework: ask how the combination of protected characteristics affected treatment, and build comparator groups that exclude both characteristics.",
        "In remote work investigations, explicitly ask about all communication platforms (Slack, Teams, text, personal email) — evidence often lives outside the official email system.",
        "Do not treat voluntariness of attendance as a threshold test for event-based complaints; focus on whether the organization sponsored, funded, or controlled the event.",
        "Verify social media screenshots where possible by accessing the original source independently; note in the file whether independent verification was possible and what you found.",
      ],
      caseStudies: [
        {
          scenario: `Westfield Consulting holds an annual client appreciation dinner at a hotel. The event is listed as "encouraged" in the invitation; all partners attend and clients are present. During the event, a bartender named Marcus — employed by the catering company Westfield contracts for the venue — makes several explicitly sexual comments to a Westfield associate named Ren. Ren reports the incident the following Monday. During the intake interview, Ren's colleague who witnessed the comments mentions that Marcus posted about the incident on his personal Instagram during the event, including a photograph of Ren taken without consent. The post is still live.`,
          questions: [
            {
              id: "ceu-m3-cs1-q1",
              question: "Regarding Westfield's investigation obligation, the threshold question is:",
              options: [
                "Whether Ren signed the event RSVP form, indicating voluntary attendance.",
                "Whether Marcus is employed by a party with a direct contractual relationship with Westfield.",
                "Whether the event was employer-sponsored and whether Westfield had authority over access to the venue — both of which are present here.",
                "Whether Marcus made the comments before or after the formal dinner portion of the event concluded.",
              ],
              correctIndex: 2,
            },
            {
              id: "ceu-m3-cs1-q2",
              question: "The investigator's first action regarding the Instagram post should be to:",
              options: [
                "Wait until a formal legal preservation hold is issued before accessing or documenting the post.",
                "Preserve it immediately — take dated screenshots showing the full URL, account name, post content, and the photograph.",
                "Request that Marcus voluntarily remove the post before preserving it, to maintain a cooperative approach.",
                "Refer the Instagram evidence to Westfield's legal team only, since social media content requires formal legal process before it can be used in an investigation.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m3-cs1-q3",
              question: "Because Marcus is employed by the catering company rather than Westfield, Westfield's obligation is to:",
              options: [
                "Open no investigation — the catering company is responsible for its employees' conduct.",
                "Obtain the catering company's consent before interviewing Marcus or proceeding.",
                "Investigate the conduct, assess its own notice and response obligations, and determine what remedial authority it has over the contractor relationship.",
                "Document the incident and formally refer it to the catering company for resolution, retaining no further involvement.",
              ],
              correctIndex: 2,
            },
            {
              id: "ceu-m3-cs1-q4",
              question: "Ren identifies as non-binary and discloses that Marcus also made comments mocking their gender presentation. The investigator should:",
              options: [
                "Open a separate complaint file for the gender presentation conduct, since it involves a different legal theory.",
                "Investigate all alleged conduct — the sexual comments and the gender expression conduct — as a unified complaint under Title VII, including post-Bostock protections for gender identity.",
                "Limit the investigation to the explicitly sexual comments, which clearly meet the hostile environment threshold without the more complex gender identity analysis.",
                "Apply a heightened evidentiary standard to the gender expression claim before including it in scope.",
              ],
              correctIndex: 1,
            },
          ],
          explanation: `All three substantive issues in this case arise from a common investigative error: applying threshold gatekeeping before it belongs. Whether the event was "really" a work event, whether the bartender is "really" covered by the employer's EEO obligations, and whether the gender expression conduct "really" belongs in this investigation are all legal determinations that follow the factual record — they are not conditions for opening the investigation. Open the investigation, gather the facts, and let the analysis follow. On the Instagram post: social media evidence that exists today may not exist tomorrow. Preserve it immediately regardless of whether a formal legal hold has been issued. On third-party liability: Westfield had notice (Ren reported), had authority over the catering relationship, and is responsible for the failure to act. On the unified complaint: Title VII post-Bostock covers gender identity and expression. No separate file, no elevated standard. The same analytical framework applies to all protected characteristics.`,
        },
      ],
      practicalExercises: [
        {
          title: "Build a Multi-Issue Investigation Plan",
          prompt: "You receive the following complaint: Mieko is a project manager working in a hybrid role (three days in-office, two remote). She reports three distinct issues. First, her team lead — who is based in another country and communicates primarily through WhatsApp — has sent Mieko messages mocking her Japanese heritage, referring to her working style as 'very Japanese' in a derogatory way. Second, a freelance consultant who participates regularly in team video calls has made repeated comments implying Mieko is less capable than her male colleagues. Third, the most recent incident occurred at a Saturday team-building event held at a rented venue, which was listed as 'mandatory' in the invitation. Build a complete investigation plan.",
          instructions: [
            "Identify which of the three issues are in scope for investigation and explain the legal basis for each.",
            "List the witnesses you would interview, in the order you would interview them, and explain your sequencing rationale.",
            "List every category of document and communication you would request — including platform-specific considerations for WhatsApp messages, video call recordings, and event records.",
            "Identify the applicable legal frameworks for each claim (Title VII, third-party liability, off-site event scope, etc.).",
            "Describe at least two logistical challenges unique to this investigation and how you would address each.",
          ],
          sampleResponse: `Scope analysis:\n- Issue 1 (team lead WhatsApp messages): In scope. National origin harassment via personal messaging platforms is subject to the same hostile environment standard as in-person or company-platform conduct. The medium does not change the legal threshold.\n- Issue 2 (freelance consultant video call comments): In scope. Employers can face liability for harassment by non-employees (contractors, freelancers) when they had notice and the authority to act. The employer controls who participates in team calls and is responsible for the conduct that occurs on them.\n- Issue 3 (Saturday team-building event): In scope. A mandatory event, even held off premises, is treated as an extension of the workplace. The word 'mandatory' in the invitation makes the analysis straightforward.\n\nWitness order:\n1. Mieko (complainant) — establish full account of all three issues before interviewing anyone else.\n2. Team members who attended the Saturday event and/or team video calls — before interviewing respondents, to get independent accounts without contamination.\n3. The freelance consultant — as a non-employee, may be interviewed but cannot be compelled; approach requires coordination with the firm or individual.\n4. The team lead — interview last among primary subjects, after all corroborating evidence is gathered.\n\nDocuments/evidence to request:\n- WhatsApp message history: Request preservation from Mieko immediately (screenshot with timestamps and phone number visible). Coordinate with IT/legal on whether a litigation hold can reach personal devices under the company's BYOD policy.\n- Video call recordings: Request from the platform (Zoom, Teams) for all team calls where the consultant participated in the past six months.\n- Saturday event records: Invitation (with 'mandatory' language), attendee list, any photos or communications from the event.\n- Consultant contract: To establish the employment relationship, who controls the consultant's access to calls, and what conduct standards apply.\n- Prior HR records: Any prior complaints or informal reports involving either the team lead or the consultant.\n\nApplicable frameworks:\n- Issue 1: Title VII (national origin harassment), hostile environment standard.\n- Issue 2: Title VII (sex discrimination), third-party/non-employee liability.\n- Issue 3: Off-site extension-of-workplace doctrine; applies to whichever protected characteristic(s) are implicated.\n\nLogistical challenges:\n1. WhatsApp evidence on personal devices: WhatsApp messages are on Mieko's personal phone. Request that she not delete any messages and provide screenshots immediately. Investigate whether the team lead used any company-provided device for WhatsApp communications, which would extend the preservation hold more clearly.\n2. Cross-border interview of the team lead: If the team lead is in another jurisdiction, interview logistics (time zones, consent requirements for recorded interviews, and in some jurisdictions, legal restrictions on internal investigations) must be assessed with legal counsel before proceeding.`,
          estimatedMinutes: 30,
        },
      ],
      questions: [
        {
          id: "ceu-m3-q1",
          question:
            "An employee complains about racially offensive comments made repeatedly by an on-site contractor who is not employed by your organization. Can your organization face liability, and should this be investigated?",
          options: [
            "Yes — employers can be liable for third-party harassment if they knew or should have known about it and failed to take reasonable corrective action.",
            "No — the contractor is a separate legal entity and your organization has no EEO obligations for their conduct.",
            "Only if the contractor's employer is also named in the complaint.",
            "Only if the employee has first filed a formal charge with the EEOC naming both parties.",
          ],
          correctIndex: 0,
        },
        {
          id: "ceu-m3-q2",
          question:
            "The conduct at issue in a complaint occurred during a company-sponsored after-hours event at an off-site venue. The respondent is the complainant's direct supervisor. The investigator should:",
          options: [
            "Treat the event as outside investigative scope since it occurred off company premises.",
            "Apply investigation standards only to conduct that also occurred during regular business hours.",
            "Apply standard investigation procedures — company-sponsored events are generally considered an extension of the workplace.",
            "Limit the investigation to documenting whether attendance at the event was voluntary or mandatory.",
          ],
          correctIndex: 2,
        },
        {
          id: "ceu-m3-q3",
          question:
            "A complainant describes harassment she believes stems from the combination of her race and her age — she says neither characteristic alone would have triggered the behavior. The correct approach to this complaint is:",
          options: [
            "Split it into two separate complaints: one under Title VII for race and one under the ADEA for age.",
            "Address only the stronger of the two claims to avoid issuing inconsistent findings.",
            "Investigate as a single complaint with analysis of how the combined protected characteristics may have informed the respondent's conduct.",
            "Return it to the complainant and ask her to identify a single primary protected characteristic before proceeding.",
          ],
          correctIndex: 2,
        },
      ],
    },

    // ── Module 4: Decision & Documentation ───────────────────────────────
    {
      id: "ceu-mod-4",
      title: "Decision & Documentation",
      summary:
        "Focuses on how to reach defensible findings, write conclusions that accurately reflect the evidence, and document your reasoning in a way that withstands legal review. Covers mixed-evidence situations, report language, credibility documentation, and how to handle post-conclusion requests.",
      content: `## The Standard of Proof and How It Applies

Workplace investigations operate under the preponderance of the evidence standard — the same standard used in civil litigation. A finding is substantiated when the evidence supports the conclusion that the alleged conduct more likely occurred than not: a greater than 50% probability, based on all available evidence. It is not proof beyond a reasonable doubt, which is the criminal standard. It is also not a "credible allegation" standard, which is lower and reserved for preliminary intake decisions.

Understanding where this standard sits operationally matters for two reasons. First, it prevents investigators from setting an artificially high bar that results in systematic under-finding. When a complaint is substantiated on 51% of the evidence, the correct output is "substantiated," not "inconclusive." Second, it prevents over-finding. Credible allegations that are not corroborated by any other evidence — no witnesses, no documents, no pattern — may not meet the preponderance threshold depending on the strength of the denial.

The preponderance standard requires the investigator to weigh all available evidence and reach a conclusion that reflects the net weight of the record. This is not a vote-counting exercise (three witnesses say yes, two say no). It is an analytical assessment of the credibility and reliability of each piece of evidence and the collective picture they form.

## Language That Builds or Undermines Defensibility

The words used to express findings shape how a report will be received in subsequent legal, regulatory, or litigation review. Certain language choices consistently undermine defensibility; others consistently support it.

Language that creates problems: "It is clear that...," "It is obvious that...," "There can be no doubt that...," "The evidence overwhelmingly shows...," and "I believe that..." Each of these expressions either asserts certainty the evidence rarely justifies or inserts the investigator's personal belief rather than an evidence-based finding. When these phrases appear in reports, they invite challenge on the grounds that the investigator prejudged the outcome or applied the wrong standard.

Language that supports defensibility: "Based on the preponderance of the evidence, it is more likely than not that...," "The weight of the evidence supports a finding that...," "Credibility considerations favor the complainant's account because...," and "The evidence does not support a finding that the alleged conduct occurred." These formulations ground the finding in the evidentiary record, apply the correct standard explicitly, and signal that the investigator weighed competing evidence before reaching a conclusion.

Neutrality in language also applies to descriptions of the parties. Refer to the complainant and respondent by their roles throughout the report, not by names alone. Describe conduct using factual terms, not characterizations: "the respondent made the following statements in the complainant's presence" rather than "the respondent harassed the complainant." Reserve conclusory language for the findings section, where the conclusion has been earned by the preceding analysis.

## Credibility Documentation

Credibility determinations are among the most legally scrutinized elements of an investigation report. An investigator who states "I found the complainant more credible than the respondent" without explanation has produced a finding that cannot be evaluated by anyone reviewing the report. An investigator who explains the basis for the credibility assessment has produced a finding that can withstand review even if reasonable people might have weighed the evidence differently.

The factors used to assess credibility should be documented for each key witness account: internal consistency within the account itself, consistency with prior statements the witness made (to HR, to coworkers, in texts or emails), corroboration by other witnesses or documents, the level of detail provided (specific dates, locations, exact language), the witness's demeanor during the interview to the extent relevant, and whether the account contains any elements that appear embellished or implausible on their face.

Importantly, demeanor is a weak credibility factor and should be used cautiously. Witnesses respond to investigation interviews with anxiety, stoicism, emotional display, or apparent composure for many reasons unrelated to the accuracy of their account. Overweighting demeanor — particularly emotional display by a complainant — is a documented source of investigator bias that creates liability exposure. Document demeanor if it is specifically relevant (e.g., a witness became distressed only when asked about a particular topic), but do not use it as a primary basis for the credibility call.

When you favor one account over another, explain the specific reason. "I found Witness A's account more credible than Witness B's because Witness A's description of the event matched the documentary record and was consistent with three prior statements she made to colleagues, while Witness B's account was inconsistent with the email exchange produced during discovery and changed in material respects between the first and second interview." That is a credibility determination that can survive review. "I found Witness A more credible" is not.

## Handling Conflicting Evidence

Genuinely conflicting evidence — where credible witnesses give incompatible accounts, where documents support neither party exclusively, where the physical record is ambiguous — produces an "unable to determine" finding. This is not a failure. It is the correct output when the evidence does not permit a reliable conclusion at the preponderance level.

An "unable to determine" finding requires the same quality of documentation as a substantiated or unsubstantiated finding. The investigator must explain: what evidence was gathered, what each piece supports, why the conflict could not be resolved, and why additional investigation would not change the outcome. A cursory "unable to determine due to conflicting accounts" is not a finding; it is a placeholder.

The investigator should also distinguish between conflicts that arise from genuinely competing accounts of the same event and conflicts that arise from gaps in the record. If two witnesses gave contradictory accounts and the investigator lacked access to documents that would resolve the conflict, that is different from a situation where all available evidence has been gathered and still does not permit a reliable conclusion. The former may warrant additional investigation; the latter produces a legitimate "unable to determine" finding.

Avoid the temptation to resolve ambiguity by defaulting to a "not substantiated" finding. An investigator who consistently defaults to unsubstantiated findings when evidence conflicts is not applying the preponderance standard; they are applying a higher standard by default. Conversely, avoid resolving ambiguity in favor of substantiation simply to provide the complainant with a more satisfying outcome. The finding must reflect the record.

## Post-Conclusion Communication

After a report is finalized, parties, supervisors, legal counsel, and senior management often seek information about the outcome and the process. How investigators and HR respond to these requests has legal and relational implications that are easy to underestimate.

The general rule is that the outcome communication protocol should be established before the report is finalized — not improvised in response to individual requests. The protocol should address: who will be notified of the outcome, what they will be told, what the organization is not obligated to share, and how these communications will be documented. Improvised responses to post-conclusion inquiries — especially informal disclosures to curious managers or sympathetic senior staff — create litigation risk and undermine the integrity of the process.

Complainants and respondents are generally entitled to know the outcome — substantiated, not substantiated, or unable to determine — and in most cases should be told what remedial steps, if any, were taken in response. They are generally not entitled to a copy of the full report, the identities of witnesses, the specific content of witness interviews, or the investigator's detailed credibility analysis. These limitations protect the investigation process and the privacy of participants.

When a party disagrees with the outcome and seeks reconsideration, the response should follow a documented appeal or reconsideration protocol if one exists, or should route through legal counsel if no such protocol is in place. An investigator who accepts informal pressure to revisit a finding without a structured process creates a precedent that undermines every future investigation. The finding stands unless the reconsideration process — if any — produces new evidence or identifies a procedural error that materially affected the outcome.

## Record Retention and Report Finalization

The investigation file is a legal document. Its contents — including notes, emails, interview records, exhibit lists, and draft reports — should be retained according to the organization's records retention schedule, which should be set in consultation with legal counsel. The minimum retention period for EEO investigation files is typically aligned with the statute of limitations for potential claims, which can extend several years from the date of the alleged conduct.

Drafts and working notes are discoverable in litigation. Investigators should not annotate drafts with speculation, personal impressions, or comments they would not want read into the record in a deposition. The final report should reflect the investigator's actual findings; notes that contradict the final report without explanation are a litigation vulnerability. If findings evolved during the investigation, document why — not by preserving contradictory drafts, but by explaining the evidentiary basis for the final conclusion.

The final report should include: a description of the complaint, the scope of the investigation, the evidence gathered and reviewed, a summary of key witness accounts, the credibility analysis, the findings (substantiated / not substantiated / unable to determine), and the basis for each finding. The structure should allow any reader unfamiliar with the complaint to follow the reasoning from the evidence to the conclusion without requiring additional explanation.`,
      examples: [
        {
          scenario:
            "An investigator completes a thorough investigation and finds one credible witness corroborating the complainant's account. The respondent denies the conduct. There is no documentary evidence. The investigator writes: 'Based on the totality of the evidence, I believe the complainant. It is clear the conduct occurred.' The report is challenged in subsequent litigation.",
          explanation:
            "Two language choices create the vulnerability. 'I believe the complainant' inserts personal belief rather than applying the preponderance standard to the evidence. 'It is clear' asserts certainty beyond what a preponderance finding requires and exposes the determination to challenge. The correct language: 'Based on the preponderance of the evidence — specifically, the complainant's detailed and internally consistent account, corroborated by Witness A's independent description of the same conduct — it is more likely than not that the alleged conduct occurred.' This language is accurate, defensible, and applies the correct standard.",
        },
        {
          scenario:
            "Two credible witnesses give directly contradictory accounts of the same event. The complainant's supervisor says the conduct never happened. A peer says they witnessed exactly what the complainant described. Emails are ambiguous. The investigator cannot determine which account is accurate. She writes: 'Unable to determine. Accounts were conflicting.' The complainant requests a copy of the full investigation file.",
          explanation:
            "The 'unable to determine' finding is correct on the facts, but the documentation is insufficient. A defensible unable-to-determine finding explains what each piece of evidence supports, why the conflict could not be resolved, what additional investigation would or would not contribute, and why the record does not permit a reliable preponderance conclusion. On the file disclosure request: the complainant is entitled to know the outcome; she is generally not entitled to the full file, witness interview contents, or the investigator's credibility analysis. The response should be limited to the outcome and, if policy permits, a general description of the process used.",
        },
        {
          scenario:
            "An investigator documents credibility as follows: 'The complainant appeared visibly upset and cried during parts of the interview. The respondent was calm and composed. I found the respondent more credible.' This finding is reviewed by outside counsel before a planned EEOC mediation.",
          explanation:
            "This credibility determination is based entirely on demeanor — a weak and bias-prone basis that will not survive scrutiny. Outside counsel will immediately identify this as a problem. Emotional distress during a complaint interview is consistent with both truthful reporting and fabrication; the same is true of composure. The credibility analysis must be rebuilt around substantive factors: consistency of accounts, corroboration by independent evidence, level of specific detail, and prior statements. If those factors favor the respondent, the finding may stand on a defensible basis. If they don't, the finding may need to be reconsidered.",
        },
        {
          scenario:
            "A report is finalized with a 'not substantiated' finding. Three weeks later, a senior manager — a personal friend of the respondent — approaches HR informally and asks 'What happened with that complaint against him? He's stressed about it.' An HR generalist, trying to be helpful, confirms that the complaint was not substantiated and mentions that the investigation found no supporting witnesses.",
          explanation:
            "This informal disclosure is a process failure. The disclosure exceeded what the manager was entitled to receive, was made outside any documented communication protocol, and shared information (absence of supporting witnesses) that could affect future witness behavior in related proceedings. All post-conclusion communications should follow a defined protocol that specifies who receives what information, in what format, and with what documentation. Informal disclosures to sympathetic senior staff are a common source of litigation complications and should be treated as policy violations.",
        },
      ],
      guidance: [
        "Apply the preponderance standard explicitly in every finding: 'more likely than not' reflects the correct threshold and signals to any reviewer that the standard was correctly understood and applied.",
        "Eliminate phrases like 'it is clear,' 'it is obvious,' and 'I believe' from your reports — replace them with evidence-grounded formulations that describe what the record shows.",
        "Document credibility determinations with specificity: name the factors (consistency, corroboration, level of detail, prior statements) and explain how each factor applied to each witness.",
        "Treat demeanor as a minor, supplemental credibility factor — never the primary basis for a finding, and always accompanied by substantive factors that would independently support the same conclusion.",
        "An 'unable to determine' finding is a correct outcome; document it with the same rigor as any other finding, explaining what was weighed and why the conflict could not be resolved.",
        "Establish the post-conclusion communication protocol before the report is finalized — not in response to individual requests from parties or managers.",
        "Keep drafts free of speculation and personal commentary; assume every note you write is discoverable, because in litigation, it is.",
        "The investigation file should be self-contained: any reader unfamiliar with the complaint should be able to follow the reasoning from the evidence to the conclusion using only the report.",
      ],
      caseStudies: [
        {
          scenario: `Aisha, a Black woman, alleges she was passed over for a director role in favor of Chris, a white male with a weaker performance record. The investigator has gathered the following evidence: Aisha's performance reviews (consistently excellent over five years); Chris's performance reviews (mixed, with one "needs improvement" in the prior cycle); the hiring manager's structured interview notes (Aisha rated "strong," Chris rated "adequate"); an email from the hiring manager to a peer two weeks before the selection decision, stating he needs someone who can "command the room"; a formal selection memo citing Chris's "executive presence" as the deciding factor; and statements from three members of the interview panel, each saying Chris did not outperform Aisha in the interview. The hiring manager says Chris had "better instincts for the role" and maintains there was no discrimination.`,
          questions: [
            {
              id: "ceu-m4-cs1-q1",
              question: "Which piece of evidence most directly supports an inference of discriminatory motive?",
              options: [
                "The 'needs improvement' rating in Chris's prior performance review.",
                "The hiring manager's pre-decision email about needing someone to 'command the room,' combined with the 'executive presence' rationale in the selection memo.",
                "The three panel member accounts stating Chris did not outperform Aisha in interviews.",
                "Aisha's five years of consistently excellent performance reviews.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m4-cs1-q2",
              question: "In writing the finding, 'executive presence' as a selection criterion should be analyzed as:",
              options: [
                "A legitimate business criterion that, once articulated in a formal decision memo, is insulated from further scrutiny.",
                "A potentially discriminatory criterion — the investigator should assess whether it is specific, documented, and applied using objective measures, or whether it is a vague subjective standard that may reflect racial or sex-based assumptions.",
                "Automatically discriminatory because courts have consistently held that 'presence'-based criteria are pretextual.",
                "Relevant only if Aisha can identify a specific comparator who was evaluated differently on the same criterion.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m4-cs1-q3",
              question: "When the hiring manager tells the investigator 'You're going to get us sued if you write this up that way,' the investigator should:",
              options: [
                "Revise the language of the findings to reduce the characterization of the selection decision as potentially discriminatory.",
                "Suspend the report pending a second review by HR leadership.",
                "Document the statement, maintain the factual findings as supported by the record, and escalate the attempt to influence the report through the appropriate channel.",
                "Offer to include the hiring manager's rebuttal as a formal addendum to the report.",
              ],
              correctIndex: 2,
            },
            {
              id: "ceu-m4-cs1-q4",
              question: "The final report's finding section should read:",
              options: [
                "'The hiring manager engaged in race and sex discrimination when he selected Chris over Aisha.'",
                "'The evidence suggests possible bias, though this cannot be proven definitively.'",
                "'Based on the preponderance of the evidence — including the pre-decision email, the subjective executive presence criterion, and the panel's assessment that both candidates performed comparably — it is more likely than not that Aisha's race and sex were factors in the selection decision.'",
                "'The hiring manager's conduct was improper and warrants immediate corrective action.'",
              ],
              correctIndex: 2,
            },
          ],
          explanation: `This case illustrates four documentation principles working together. First, discriminatory motive is frequently circumstantial: a combination of vague subjective criteria, pre-decisional statements, and outcomes inconsistent with objective qualifications can establish the necessary inference under the preponderance standard. The 'command the room' email plus the 'executive presence' selection rationale, in the context of a selection that contradicted the objective record, is exactly this kind of circumstantial pattern. Second, 'executive presence' is not automatically legitimate or automatically discriminatory — the analysis turns on whether it was specific, documented, and applied through objective measures or whether it was a vague subjective standard applied inconsistently. Third, post-conclusion pressure from the subject of the investigation to revise findings must be documented and escalated — not accommodated. Revising factual findings under informal pressure is a serious process integrity failure. Fourth, the report language must apply the preponderance standard explicitly: 'more likely than not' is the correct formulation. Conclusory language ('it is clear,' 'it is obvious') asserts certainty the evidence rarely justifies and invites challenge on that basis.`,
        },
        {
          scenario: `An investigator has completed a thorough investigation. Both the complainant and respondent gave credible, internally consistent accounts that directly contradict each other on the key factual question: whether the respondent made a comment referencing the complainant's religion during a performance discussion. One witness was present but says she "wasn't really paying attention." There is no documentary evidence bearing on the specific comment. The investigator has exhausted available evidence. She drafts the following findings section: "Unable to determine. The parties gave conflicting accounts. Neither was more credible than the other."`,
          questions: [
            {
              id: "ceu-m4-cs2-q1",
              question: "The primary problem with the drafted findings section is:",
              options: [
                "The 'unable to determine' finding is not a recognized outcome under EEO investigation standards.",
                "It states a conclusion without explaining the reasoning — it does not describe what evidence was gathered, what each piece supports, or why the conflict could not be resolved.",
                "It fails to identify which witness the investigator found more credible on balance.",
                "It should default to 'not substantiated' when evidence is equal, since the complainant bears the burden of proof.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m4-cs2-q2",
              question: "A defensible 'unable to determine' finding must include:",
              options: [
                "A statement that the complainant's account was credible but not corroborated.",
                "An explanation of what evidence was gathered, what each piece supports, why the accounts could not be reconciled, and what additional evidence would have been needed to reach a more definitive conclusion.",
                "A request for both parties to submit written statements supplementing their interview accounts.",
                "A legal analysis of whether the alleged comment, if it occurred, would meet the hostile environment threshold.",
              ],
              correctIndex: 1,
            },
            {
              id: "ceu-m4-cs2-q3",
              question: "The investigator's obligation regarding the witness who 'wasn't really paying attention' is to:",
              options: [
                "Exclude her account entirely since she acknowledged inattention, making her testimony unreliable.",
                "Document her account, including her acknowledged inattention, and assess what weight — if any — it carries alongside the party accounts.",
                "Re-interview her using more directive questioning to see if she can recall the specific comment.",
                "List her as a witness in the report but omit her account from the credibility analysis.",
              ],
              correctIndex: 1,
            },
          ],
          explanation: `An 'unable to determine' finding is legitimate and professionally defensible — but only when it reflects a genuinely exhausted record and is documented with the same rigor as any other finding. The two-sentence version in this case reads as a premature exit from a difficult record, not a conclusion. A defensible version would: describe what evidence was gathered (party interviews, the witness account, a document search that produced no relevant records); explain what each piece supports (the complainant's account is consistent and detailed; the respondent's denial is equally consistent; the witness was present but inattentive); explain why the conflict cannot be resolved (no corroborating documentation, no other witnesses with direct knowledge); and note what additional evidence would have been needed to reach a more definitive conclusion (a second witness with direct attention to the conversation, or a contemporaneous document). The witness who "wasn't really paying attention" is still part of the factual record — document what she said and what weight it carries. Omitting it creates the appearance that the investigator overlooked available evidence.`,
        },
      ],
      practicalExercises: [
        {
          title: "Rewrite a Flawed Finding Paragraph",
          prompt: "The following finding paragraph was written by an investigator after completing a race discrimination investigation. Read it carefully, identify every problem with it, and then rewrite it using correct, defensible language.\n\nOriginal paragraph: 'After conducting a comprehensive investigation, it is clear that the respondent, Marcus, engaged in race-based discrimination against the complainant. His behavior was obviously motivated by racial bias, as evidenced by the comments he made. The complainant's account was more believable than Marcus's because she seemed more genuine during the interview. Based on all the evidence, I believe Marcus discriminated against the complainant and recommend immediate disciplinary action.'",
          instructions: [
            "List every specific problem with the original paragraph — aim for at least five.",
            "Rewrite the paragraph (5–8 sentences) correcting all identified problems.",
            "Your rewrite must: apply the preponderance standard explicitly, ground the finding in specific named evidence, document credibility using articulable factors rather than demeanor, use neutral factual language in describing the conduct, and separate the finding from any remediation recommendation.",
          ],
          sampleResponse: `Problems identified:\n1. "It is clear" asserts certainty beyond what the preponderance standard requires and invites challenge that the investigator applied the wrong standard or prejudged the outcome.\n2. "Obviously motivated by racial bias" is a conclusory characterization with no evidentiary grounding — it tells the reader what to think without showing the evidence that supports the conclusion.\n3. "As evidenced by the comments he made" references evidence without describing it — a reader cannot evaluate this determination without knowing what the comments were.\n4. "More believable than Marcus's because she seemed more genuine during the interview" is a demeanor-based credibility finding, which is the weakest and most bias-prone basis for a credibility determination and will not survive review.\n5. "I believe Marcus discriminated" inserts the investigator's personal belief rather than applying the preponderance standard to the evidentiary record.\n6. The finding and remediation recommendation are combined in the same sentence — these are distinct outputs that should be clearly separated.\n\nRewritten paragraph: Based on the preponderance of the evidence, it is more likely than not that Marcus made the comments described in the complaint and that those comments were made because of the complainant's race. This finding rests on three factors. First, the complainant's account of the specific language used and the dates and context of each incident was internally consistent across her intake and formal interviews and was consistent with a contemporaneous text message she sent to a colleague on the date of the second incident. Second, two witnesses corroborated that Marcus made comments referencing the complainant's race on at least one occasion, using language consistent with what the complainant described. Third, Marcus's account changed in a material respect between his intake and formal interviews regarding who else was present during the second incident, and he was unable to explain the change. The credibility assessment favors the complainant's account based on the consistency of her account, the contemporaneous documentary corroboration, the independent witness corroboration, and the identified inconsistency in Marcus's account — not based on demeanor. This finding is limited to the factual determination; remediation recommendations are addressed separately.`,
          estimatedMinutes: 20,
        },
        {
          title: "Draft a Post-Conclusion Communication Protocol",
          prompt: "You have completed an investigation with the following outcome: the complaint was substantiated; the respondent (a mid-level manager, Kevin) is recommended for mandatory remediation training and a formal written warning; the complainant (Adaeze) is to receive an apology from HR and will be assigned a new reporting structure. Three parties have requested information: Adaeze, Kevin's direct supervisor (who manages the broader team and needs to understand what occurred), and a senior VP who says she is 'just wanting to make sure the team is okay.' Draft a post-conclusion communication protocol.",
          instructions: [
            "Specify what Adaeze will be told — include the outcome, the process used, and what information she is and is not entitled to receive.",
            "Specify what Kevin will be told — include the outcome, what disciplinary action is being taken, and what he is not entitled to receive from the investigation file.",
            "Specify what Kevin's supervisor will be told and explain the business rationale for the level of disclosure you choose.",
            "Specify what the senior VP will be told and explain your reasoning.",
            "Identify what no party outside these four will receive and explain why.",
            "Describe how you will document these communications.",
          ],
          sampleResponse: `Adaeze: Adaeze will be told that the investigation is complete, that her complaint was substantiated, that the organization is taking corrective action in response, and that she will be assigned to a new reporting structure. She will be told that she is not entitled to the specific details of what disciplinary action Kevin will receive, the identities or statements of other witnesses, or a copy of the investigation report. She will be given a direct point of contact in HR for any ongoing concerns. This communication will be made in person (or by video call if remote) and followed up in writing. The written follow-up will be retained in the investigation file.\n\nKevin: Kevin will be told that the investigation is complete, that the complaint was substantiated, that a formal written warning will be issued, and that he is required to complete a remediation training program. He will be told that the investigation file is confidential and that he is not entitled to the names of witnesses or the specific content of witness interviews. He will also be advised that retaliation against the complainant or any witness is a separate policy violation with independent consequences. This communication will occur before the formal written warning is issued and will be documented.\n\nKevin's supervisor: Kevin's supervisor will be told that the investigation involving Kevin is complete, that corrective action has been taken, and that Kevin's reporting structure may have implications for the team. The supervisor will not be given specifics of the finding, witness accounts, or the nature of the complaint beyond what is necessary to implement the reporting structure change. Rationale: the supervisor has a legitimate operational need to know that action has been taken and why the reporting structure is changing, but does not need investigation details to perform this function.\n\nSenior VP: The senior VP will be told that the matter has been resolved through the organization's established process and that corrective action has been taken. She will not be given the nature of the complaint, the identity of the parties, the finding, or any investigation details. Rationale: 'wanting to make sure the team is okay' is not a business need that justifies disclosure of confidential investigation information. This communication should be brief and documented.\n\nNo other party: No other person — including other team members, HR generalists not involved in the matter, or management above the senior VP — will receive any information about the investigation, the parties, or the outcome. Disclosure beyond the four parties above creates confidentiality risk, affects witness behavior in future matters, and may expose the organization to additional liability.\n\nDocumentation: Each communication will be documented with the date, the name of the person communicated with, the method (in person, video, email), and a summary of what was conveyed. This documentation will be retained in the investigation file under the same retention schedule as the report itself.`,
          estimatedMinutes: 25,
        },
      ],
      questions: [
        {
          id: "ceu-m4-q1",
          question:
            "You have completed a thorough investigation. One credible witness supports the complainant, another credible witness supports the respondent, and the documentary evidence is genuinely inconclusive. Your finding should:",
          options: [
            "Default to 'not substantiated' — the complainant bears the burden of proof and it was not met.",
            "State 'unable to determine' and document clearly what evidence supported each position and why the conflict could not be resolved.",
            "Substantiate the complaint — any credible corroboration is sufficient to meet the preponderance standard.",
            "Defer the finding and request that both parties submit additional evidence within 10 business days.",
          ],
          correctIndex: 1,
        },
        {
          id: "ceu-m4-q2",
          question:
            "In drafting the findings section of your report, which of the following statements is most likely to undermine its defensibility?",
          options: [
            "'Based on the preponderance of evidence, it is more likely than not that the alleged conduct occurred.'",
            "'The evidence does not support a finding that the conduct rose to the level of a hostile work environment.'",
            "'It is clear that the respondent deliberately targeted the complainant because of her religion.'",
            "'Witness credibility was assessed based on consistency, detail, and corroboration with other evidence.'",
          ],
          correctIndex: 2,
        },
        {
          id: "ceu-m4-q3",
          question:
            "An investigation concludes with a finding of 'unable to determine.' The complainant asks you directly: 'Does that mean you don't believe me?' The most appropriate response is:",
          options: [
            "Explain that 'unable to determine' reflects the state of the evidence and is not a judgment about any individual's honesty.",
            "Confirm that you found her account credible but could not secure enough corroboration to substantiate the complaint.",
            "Decline to explain the finding since all communications at this stage should go through HR or legal.",
            "Advise her to file an EEOC charge if she disagrees with the outcome.",
          ],
          correctIndex: 0,
        },
      ],
    },
  ],

  finalExam: [
    // ── Theme 1: Current Expectations & EEOC Trends ──────────────────────
    {
      id: "ceu-fe-q1",
      question:
        "An employee discloses a new medical condition to HR in January. In February, she is placed on a performance improvement plan — the first formal performance action in her four-year tenure. She files a complaint alleging disability-based retaliation. The close timing between the disclosure and the PIP:",
      options: [
        "Is insufficient evidence of retaliation because PIPs are routine HR performance tools.",
        "Is potentially significant circumstantial evidence that should be documented and evaluated alongside other facts.",
        "Establishes retaliation as a matter of law under the ADA's anti-retaliation provisions.",
        "Is only relevant if the PIP was issued by the same person who received the disability disclosure.",
      ],
      correctIndex: 1,
    },
    {
      id: "ceu-fe-q2",
      question:
        "Under the Pregnant Workers Fairness Act (PWFA), which of the following best describes the employer's accommodation obligation?",
      options: [
        "Provide reasonable accommodations for known limitations related to pregnancy, childbirth, or related medical conditions, even when the employee would not qualify as disabled under the ADA.",
        "Provide accommodations only to employees who have a documented disability under the ADA that is caused or worsened by pregnancy.",
        "Provide accommodations only during the first and third trimesters, when physical limitations are most acute.",
        "Provide accommodations only after the employee exhausts all available FMLA leave.",
      ],
      correctIndex: 0,
    },
    {
      id: "ceu-fe-q3",
      question:
        "An employer uses an algorithmic screening tool to filter job applications. The tool was developed by a third-party vendor. Data shows the tool screens out qualified female candidates at a significantly higher rate than male candidates. Under EEOC guidance on AI hiring tools, the employer:",
      options: [
        "Bears no liability because the tool was designed and supplied by a third party.",
        "Is liable only if it can be shown the tool was intentionally programmed to disadvantage women.",
        "May face disparate impact liability regardless of intent, and should audit the tool and take corrective action.",
        "Is protected from liability as long as it conducted reasonable due diligence before deploying the tool.",
      ],
      correctIndex: 2,
    },
    {
      id: "ceu-fe-q4",
      question:
        "A charge of discrimination is filed with the EEOC against your organization. In the initial response stage, the organization is typically required to:",
      options: [
        "Immediately halt all employment decisions related to the charging party.",
        "Provide the complainant with access to all HR records before the EEOC's review begins.",
        "Attend a mandatory face-to-face mediation session within 30 days of notification.",
        "Submit a Position Statement responding to the allegations and providing supporting documentation within the EEOC's specified timeframe.",
      ],
      correctIndex: 3,
    },
    {
      id: "ceu-fe-q5",
      question:
        "A supervisor makes comments in a team meeting that a female employee finds demeaning. The same supervisor later approves a standard merit raise for her. She files a harassment complaint. The existence of the merit raise:",
      options: [
        "Does not preclude a harassment investigation — hostile work environment claims are evaluated on the totality of conduct, not just tangible employment actions.",
        "Establishes that no harassment occurred because the supervisor's actions were objectively favorable.",
        "Shifts the burden of proof to the complainant to show the raise was below what male peers received.",
        "Is only relevant if the complainant argues the raise was offered as quid pro quo.",
      ],
      correctIndex: 0,
    },

    // ── Theme 2: Investigation Quality Risks ─────────────────────────────
    {
      id: "ceu-fe-q6",
      question:
        "During witness interviews, two employees give conflicting accounts of the same incident. Both appear credible and consistent in their own right. An investigator should:",
      options: [
        "Select the account corroborated by more witnesses, even if those witnesses only have secondhand knowledge.",
        "Delay finalizing the investigation indefinitely until one party's account is independently confirmed.",
        "Document both accounts, assess credibility using established factors such as specificity, corroboration, and consistency over time, and explain the reasoning in the report.",
        "Default to the respondent's account since the complainant bears the burden of proof.",
      ],
      correctIndex: 2,
    },
    {
      id: "ceu-fe-q7",
      question:
        "An investigator concludes an investigation and substantiates the complaint. Two days before issuing the final report, she learns the respondent has filed a counter-complaint alleging investigative bias. The investigator's immediate obligation is to:",
      options: [
        "Ensure the final report accurately reflects the evidence and methodology, and flag the counter-complaint to the appropriate decision-maker so it can be handled separately.",
        "Suspend the report until the counter-complaint is fully investigated and resolved.",
        "Revise the report to add language addressing the respondent's concerns before it is finalized.",
        "Withdraw from the investigation and assign it to a different investigator.",
      ],
      correctIndex: 0,
    },
    {
      id: "ceu-fe-q8",
      question:
        "An investigator interviews the complainant first, then the respondent, but does not conduct a follow-up interview with the complainant after the respondent raises a new factual claim. The investigator argues her notes adequately capture both sides. This approach:",
      options: [
        "Is acceptable if the investigator's notes clearly summarize the respondent's rebuttal.",
        "Creates a procedural gap — best practice is to give the complainant an opportunity to respond to new information raised by the respondent.",
        "Is required when the respondent raises new claims not previously shared with the complainant.",
        "Is only a concern if the investigation results in a substantiated finding against the respondent.",
      ],
      correctIndex: 1,
    },
    {
      id: "ceu-fe-q9",
      question:
        "After an investigation concludes, an investigator receives an email from the complainant with additional evidence she forgot to mention during her interview. The report has not yet been issued. The investigator should:",
      options: [
        "Decline to consider the evidence since the interview record is closed.",
        "Accept the evidence but note in the report that it was submitted after the interview without further review.",
        "Forward the evidence to legal counsel and take no further investigative action.",
        "Review the evidence, assess its relevance, and determine whether it warrants a follow-up interview or additional investigation steps before finalizing the report.",
      ],
      correctIndex: 3,
    },
    {
      id: "ceu-fe-q10",
      question:
        "An investigation is completed and the investigator recommends discipline. The HR director asks the investigator to soften the language in the findings section to reduce litigation exposure. The investigator should:",
      options: [
        "Revise the findings as requested — the HR director has authority over the final report.",
        "Issue a disclaimer in the report noting the findings were modified at HR's direction.",
        "Decline to alter factual findings and document the request, escalating to legal or leadership if necessary.",
        "Withdraw from the matter and allow HR to rewrite the findings independently.",
      ],
      correctIndex: 2,
    },

    // ── Theme 3: Modern Workplace Scenarios ──────────────────────────────
    {
      id: "ceu-fe-q11",
      question:
        "Two employees who work in different cities and have never met in person are connected through a team messaging channel. One sends the other direct messages with sexually offensive content. The recipient files a harassment complaint. The investigator should treat this as:",
      options: [
        "A workplace harassment complaint subject to standard investigation procedures — digital communication channels are part of the work environment.",
        "A personal matter between two employees that falls outside the scope of an EEO investigation.",
        "Actionable only if the offensive messages also affected the recipient's work performance metrics.",
        "A lower-priority complaint since no physical workplace contact occurred.",
      ],
      correctIndex: 0,
    },
    {
      id: "ceu-fe-q12",
      question:
        "A complainant submits screenshots from the respondent's personal social media account containing content she says reflects discriminatory attitudes toward her national origin. The posts were made outside work hours. The investigator's approach should be:",
      options: [
        "Exclude it automatically — personal social media activity is outside investigative scope.",
        "Accept it without further scrutiny since the complainant is the submitting party.",
        "Evaluate it for relevance and authenticity, and consider what weight it carries alongside other evidence.",
        "Request a court subpoena before including any social media content in the investigation record.",
      ],
      correctIndex: 2,
    },
    {
      id: "ceu-fe-q13",
      question:
        "A long-tenured employee who recently transitioned gender tells you a colleague has continued to use her former name and pronouns after being corrected multiple times, and that her manager has not intervened. This complaint:",
      options: [
        "Is outside Title VII's scope because name and pronoun use are matters of personal preference.",
        "Should be investigated — the EEOC and federal courts have recognized that intentional misgendering can constitute sex-based harassment under Title VII.",
        "Is actionable only under state law and should be referred to the appropriate state agency.",
        "Requires at least five documented incidents before a formal investigation is warranted.",
      ],
      correctIndex: 1,
    },
    {
      id: "ceu-fe-q14",
      question:
        "A complainant works on a team of five, including two colleagues who share her protected characteristic. She alleges the respondent singled her out. The respondent argues he treated all five team members identically. The investigator's response to this argument is:",
      options: [
        "Accept the comparator argument — identical treatment of all team members negates discriminatory intent.",
        "Dismiss the complaint since the conduct affected multiple members of the same protected group.",
        "Apply a group-average analysis to determine whether the protected group as a whole was adversely affected.",
        "Investigate the specific interactions between the respondent and the complainant to assess whether she was individually singled out, regardless of how others were treated.",
      ],
      correctIndex: 3,
    },
    {
      id: "ceu-fe-q15",
      question:
        "An employee files a complaint about her manager. During the investigation, you learn she previously filed a complaint about a different manager three years ago that was not substantiated. This prior complaint:",
      options: [
        "Should not be used to diminish her credibility — prior unsubstantiated complaints are not evidence of false reporting.",
        "Suggests a pattern of conduct that warrants skepticism about her current allegations.",
        "Must be disclosed to the respondent as part of the investigation record.",
        "Is relevant only if the prior complaint involved the same protected characteristic.",
      ],
      correctIndex: 0,
    },

    // ── Theme 4: Decision & Documentation ────────────────────────────────
    {
      id: "ceu-fe-q16",
      question:
        "An investigator substantiates a complaint and recommends corrective action. The respondent is a high-performing senior leader. The recommendation section of the report should:",
      options: [
        "Take the respondent's performance record and seniority into account when suggesting the level of discipline.",
        "State findings and recommendations based solely on the investigative record and applicable policy — performance history does not mitigate a substantiated finding.",
        "Defer to HR leadership to determine appropriate discipline, since remediation is outside the investigator's role.",
        "Limit the recommendation to retraining, since disciplining a senior leader may expose the organization to greater legal risk.",
      ],
      correctIndex: 1,
    },
    {
      id: "ceu-fe-q17",
      question:
        "A report contains the sentence: 'Witness A was more believable than Witness B.' The most significant problem with this language is:",
      options: [
        "It makes a credibility finding, which is outside the scope of the investigator's role.",
        "It uses comparative language, which is not permitted in EEOC-compliant reports.",
        "It fails to identify the protected characteristic at issue.",
        "It asserts a conclusion without explaining the reasoning — credibility determinations must be supported by specific factors such as consistency, corroboration, and detail.",
      ],
      correctIndex: 3,
    },
    {
      id: "ceu-fe-q18",
      question:
        "After issuing a final report with a 'not substantiated' finding, the complainant provides new evidence that was not available during the investigation. The appropriate response is:",
      options: [
        "Assess whether the new evidence is material, and if so, reopen or supplement the investigation rather than treating the report as final.",
        "Treat the report as final — once issued, investigation conclusions cannot be reopened.",
        "Direct the complainant to file a new formal complaint if she believes new evidence changes the outcome.",
        "Forward the new evidence to the respondent for rebuttal before deciding whether to act on it.",
      ],
      correctIndex: 0,
    },
    {
      id: "ceu-fe-q19",
      question:
        "A complainant requests access to the investigation report after it has been issued. Your organization has a policy limiting disclosure. The most defensible approach is to:",
      options: [
        "Provide the full unredacted report since the complainant is a named party and has a right to full access.",
        "Deny all access — investigation reports are internal privileged documents.",
        "Follow applicable law and organizational policy, which may permit sharing a summary or redacted version while protecting witness confidentiality.",
        "Provide access only if the complainant's attorney submits a formal written request.",
      ],
      correctIndex: 2,
    },
    {
      id: "ceu-fe-q20",
      question:
        "After an investigation concludes, the respondent is disciplined. The respondent's manager asks the investigator to explain what specific evidence led to the finding. The investigator should:",
      options: [
        "Share a full summary of witness statements since the manager needs this context to manage the situation.",
        "Decline to share evidence specifics — investigation details should only be disclosed on a need-to-know basis through appropriate channels.",
        "Provide a written summary of key evidence to the manager and document the disclosure in the investigation file.",
        "Refer the manager to legal counsel, since any discussion of investigation evidence creates attorney-client privilege issues.",
      ],
      correctIndex: 1,
    },
  ],
};

function isValidQuestion(q: unknown): boolean {
  if (!q || typeof q !== "object") return false;
  const o = q as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.question === "string" &&
    (o.question as string).trim().length > 0 &&
    Array.isArray(o.options) &&
    (o.options as unknown[]).length >= 2 &&
    typeof o.correctIndex === "number" &&
    o.correctIndex >= 0 &&
    o.correctIndex < (o.options as unknown[]).length
  );
}

function isValidCeuContent(parsed: unknown): parsed is CeuContent {
  if (!parsed || typeof parsed !== "object") return false;
  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.modules) || (p.modules as unknown[]).length === 0) return false;
  if (!Array.isArray(p.finalExam) || (p.finalExam as unknown[]).length === 0) return false;
  for (const mod of p.modules as unknown[]) {
    if (!mod || typeof mod !== "object") return false;
    const m = mod as Record<string, unknown>;
    if (typeof m.title !== "string" || !(m.title as string).trim()) return false;
    if (!Array.isArray(m.questions) || (m.questions as unknown[]).length === 0) return false;
    for (const q of m.questions as unknown[]) {
      if (!isValidQuestion(q)) return false;
    }
  }
  for (const q of p.finalExam as unknown[]) {
    if (!isValidQuestion(q)) return false;
  }
  return true;
}

function loadActiveCeuContent(): CeuContent {
  try {
    const raw = localStorage.getItem("generatedCeuContent");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidCeuContent(parsed)) {
        return parsed;
      }
      console.warn(
        "[WCI] generatedCeuContent failed shape validation — falling back to default CEU content.",
      );
    }
  } catch {
    console.warn(
      "[WCI] generatedCeuContent could not be parsed — falling back to default CEU content.",
    );
  }
  return DEFAULT_CEU_CONTENT;
}

const ACTIVE_COURSE = loadActiveCourse();
const ACTIVE_QUIZZES = loadActiveQuizzes();
const ACTIVE_FINAL_EXAM = loadActiveFinalExam();
const ACTIVE_CEU_CONTENT = loadActiveCeuContent();
const EEO_EXAM_PATH = `/${COURSE.id}`; // '/eeo-investigator'

const ALL_LESSONS = ACTIVE_COURSE.sections.flatMap((s) => s.lessons);

type QuizResult = "passed" | "failed";

interface CompletionContextValue {
  completed: Set<string>;
  toggle: (id: string) => void;
  quizResults: Record<string, QuizResult>;
  setQuizResult: (sectionId: string, result: QuizResult) => void;
  finalExamResult: QuizResult | null;
  setFinalExamResult: (result: QuizResult) => void;
  paid: boolean;
  // courseAccessActive: server-authoritative 60-day course access signal
  courseAccessActive: boolean;
  paidLoading: boolean;
  refetchPaidStatus: () => void;
}

const CompletionContext = createContext<CompletionContextValue>({
  completed: new Set(),
  toggle: () => {},
  quizResults: {},
  setQuizResult: () => {},
  finalExamResult: null,
  setFinalExamResult: () => {},
  paid: false,
  courseAccessActive: false,
  paidLoading: true,
  refetchPaidStatus: () => {},
});

function useCompletion() {
  return useContext(CompletionContext);
}

// ─── Catalog Page ─────────────────────────────────────────────────────────────

function useHasOwnedExams(): boolean {
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [hasExams, setHasExams] = useState(false);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    const base = import.meta.env.VITE_API_URL ?? "";
    getToken().then((token) => {
      fetch(`${base}/my-exams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((exams: ExamEntry[]) => setHasExams(exams.some((e) => e.ceuAccessUntil === null)))
        .catch(() => {});
    });
  }, [clerkLoaded, isSignedIn, getToken]);

  return hasExams;
}

// ─── REDESIGNED: CatalogPage ──────────────────────────────────────────────────
// Changes: institutional header with logo, trust strip, premium EEO card with
// price signal and format line, muted coming-soon cards, elevated verify CTA.
// All routing targets, SignedIn/hasOwnedExams logic, and admin footer unchanged.

function CatalogPage() {
  const hasOwnedExams = useHasOwnedExams();

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .catalog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="home-shell catalog-shell">
        {/* ── Institutional header ── */}
        <header className="catalog-header">
          <img
            src="/shield-icon-only-main.png"
            alt="Workplace Compliance Institute"
            className="catalog-header__logo"
          />
          <div>
            <h1 className="catalog-header__name">
              Workplace Compliance Institute
            </h1>
            <p className="catalog-header__sub">
              Professional Certification &amp; Training
            </p>
          </div>
          <SignedIn>
            <nav className="catalog-header__nav">
              <Link to="/dashboard">My Dashboard</Link>
            </nav>
          </SignedIn>
        </header>

        {/* ── Trust strip ── */}
        <div className="catalog-trust-strip">
          <span className="catalog-trust-item">
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 1.5L2 3.5v3.5c0 2.8 2.2 5.4 5 6 2.8-.6 5-3.2 5-6V3.5L7 1.5z"
                stroke="#0d6e59"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 7.2l1.8 1.8 3.2-3.2"
                stroke="#0d6e59"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verifiable certificate ID
          </span>
          <span className="catalog-trust-item">
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="#1a2a4a"
                strokeWidth="1.2"
              />
              <path
                d="M7 4v3.5l2 1.2"
                stroke="#1a2a4a"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            40-hour self-paced program
          </span>
          <span className="catalog-trust-item">
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="1.5"
                y="1.5"
                width="11"
                height="11"
                rx="2"
                stroke="#1a2a4a"
                strokeWidth="1.2"
              />
              <path
                d="M4 7h6M4 4.5h6M4 9.5h3.5"
                stroke="#1a2a4a"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Built on EEOC guidance
          </span>
        </div>

        <main>
          {/* ── Dashboard shortcut — logic unchanged ── */}
          <SignedIn>
            {hasOwnedExams && (
              <p className="catalog-dashboard-link">
                <Link to="/dashboard">Go to your Dashboard →</Link>
              </p>
            )}
          </SignedIn>

          {/* ── Section label ── */}
          <p className="catalog-section-label">Certification Tracks</p>

          {/* ── Card grid ── */}
          <div
            className="catalog-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "20px",
              marginBottom: "var(--sp-6)",
            }}
          >
            {/* Active card — EEO */}
            <div className="catalog-card catalog-card--active">
              <div className="catalog-card__header-row">
                <span className="catalog-card__badge catalog-card__badge--available">
                  Available Now
                </span>
                <span className="catalog-card__price">$349</span>
              </div>
              <h2 className="catalog-card__title">
                EEO Investigator Certification
              </h2>
              <p className="catalog-card__desc">
                Hands-on certification for HR managers. Work through a realistic
                case, build an investigation report, and leave prepared to
                handle complaints the right way. Structured as a 40-hour
                self-paced program.
              </p>
              <Link
                to={EEO_EXAM_PATH}
                className="btn-primary catalog-card__cta"
              >
                View Certification →
              </Link>
            </div>

            {/* Coming soon — ADA */}
            <div className="catalog-card catalog-card--soon">
              <span className="catalog-card__badge catalog-card__badge--soon">
                Coming Soon
              </span>
              <h2 className="catalog-card__title">
                ADA &amp; Reasonable Accommodation
              </h2>
              <p className="catalog-card__desc">
                Compliance requirements under the Americans with Disabilities
                Act, including the interactive process and documentation
                standards.
              </p>
              <span className="catalog-card__soon-label">Coming Soon</span>
            </div>

            {/* Coming soon — Harassment */}
            <div className="catalog-card catalog-card--soon">
              <span className="catalog-card__badge catalog-card__badge--soon">
                Coming Soon
              </span>
              <h2 className="catalog-card__title">
                Workplace Harassment Investigation
              </h2>
              <p className="catalog-card__desc">
                Structured investigation frameworks for harassment and hostile
                work environment claims under Title VII and related statutes.
              </p>
              <span className="catalog-card__soon-label">Coming Soon</span>
            </div>
          </div>

          {/* ── Verify CTA — routing target unchanged ── */}
          <div className="catalog-verify-row">
            <Link
              to="/verify"
              className="catalog-verify-link"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "#f0f6ff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
              }}
            >
              Verify a Certificate
            </Link>
          </div>
        </main>
      </div>

      {/* ── Admin footer — unchanged ── */}
      <footer
        style={{
          position: "fixed",
          bottom: "12px",
          right: "16px",
          pointerEvents: "none",
        }}
      >
        <Link
          to="/admin/sign-in"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.7rem",
            color: "rgba(0,0,0,0.18)",
            textDecoration: "none",
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
            e.currentTarget.style.color = "rgba(0,0,0,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
            e.currentTarget.style.color = "rgba(0,0,0,0.18)";
          }}
        >
          Admin
        </Link>
      </footer>
    </>
  );
}

// ─── REDESIGNED: EeoDetailPage ────────────────────────────────────────────────
// Changes: new visual sections wrap the existing logic. All conditional
// rendering (SignedOut, SignedIn, hasOwnedExams, handlePurchase, CEU guard)
// is preserved in its original order, inline, without abstraction.

function EeoDetailPage() {
  const hasOwnedExams = useHasOwnedExams();
  const { user } = useUser();
  const [purchasing, setPurchasing] = useState(false);

  // ── Purchase handler — UNCHANGED ──
  async function handlePurchase() {
    setPurchasing(true);
    try {
      const base = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${base}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: user?.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setPurchasing(false);
    } catch {
      setPurchasing(false);
    }
  }

  return (
    <>
      <div className="eeo-shell">
        {/* ── Back nav ── */}
        <div className="eeo-back-nav">
          <Link
            to="/"
            className="page-back-link"
            style={{
              color: "var(--text-secondary)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            ← Back to Home
          </Link>
        </div>

        {/* ══════════════════════════════════════════════
            SECTION 1 — HERO
            Visual redesign only. Auth/purchase logic below
            is the original inline block, order preserved.
        ══════════════════════════════════════════════ */}
        <section className="eeo-hero">
          <div className="eeo-hero__inner">
            <p className="eeo-hero__eyebrow">EEO Investigator Certification</p>
            <h1 className="eeo-hero__headline">
              Learn how to run workplace investigations by actually doing one
            </h1>
            <p className="eeo-hero__sub">
              Practical, hands-on certification for HR managers. Work through a
              realistic case, build an investigation report, and leave ready to
              handle complaints the right way.
            </p>
            <p className="eeo-hero__format">
              Structured as a 40-hour self-paced program &nbsp;·&nbsp; Built on
              EEOC guidance
            </p>

            {/* ── Auth / purchase block — original logic, original order, restyled container ── */}
            <div className="eeo-hero__cta-block">
              <SignedOut>
                <div className="home-btn-row">
                  <Link to="/sign-up" className="btn-primary eeo-cta-primary">
                    Start Certification — $349
                  </Link>
                  <Link to="/sign-in" className="btn-secondary">
                    Log In
                  </Link>
                </div>
              </SignedOut>

              <SignedIn>
                {hasOwnedExams ? (
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.875rem",
                        color: "rgba(255,255,255,0.7)",
                        marginBottom: "var(--sp-3)",
                      }}
                    >
                      Manage your certification progress, renewal, and access
                      from your dashboard.
                    </p>
                    <Link to="/dashboard" className="btn-primary">
                      Go to Dashboard
                    </Link>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="btn-teal eeo-cta-primary"
                      style={{ opacity: purchasing ? 0.7 : 1 }}
                    >
                      {purchasing
                        ? "Redirecting…"
                        : "Purchase Certification — $349"}
                    </button>
                    <p style={{ marginTop: "var(--sp-3)" }}>
                      <SignOutButton>
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            fontFamily: "var(--font-ui)",
                            fontSize: "0.8rem",
                            color: "rgba(255,255,255,0.45)",
                            textDecoration: "underline",
                          }}
                        >
                          Log out
                        </button>
                      </SignOutButton>
                    </p>
                  </div>
                )}
              </SignedIn>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 2 — WHY THIS MATTERS
            Static content only. No logic.
        ══════════════════════════════════════════════ */}
        <section className="eeo-section eeo-section--alt">
          <div className="eeo-section__inner">
            <h2 className="eeo-section__heading">Why this matters</h2>
            <div className="eeo-why-grid">
              <div className="eeo-why-item">
                <div className="eeo-why-item__rule" />
                <h3 className="eeo-why-item__heading">
                  You are expected to investigate complaints
                </h3>
                <p className="eeo-why-item__body">
                  HR managers at small and mid-sized companies are often the
                  first — and only — person handling employee discrimination and
                  harassment complaints.
                </p>
              </div>
              <div className="eeo-why-item">
                <div className="eeo-why-item__rule" />
                <h3 className="eeo-why-item__heading">
                  You may not have been formally trained
                </h3>
                <p className="eeo-why-item__body">
                  Most HR managers learn on the job. Formal investigation
                  training is rarely included in standard HR programs, even
                  though it is one of the highest-stakes tasks in the role.
                </p>
              </div>
              <div className="eeo-why-item">
                <div className="eeo-why-item__rule" />
                <h3 className="eeo-why-item__heading">
                  Mistakes carry real risk
                </h3>
                <p className="eeo-why-item__body">
                  A flawed investigation can expose your organization to
                  litigation, regulatory action, and reputational harm. Doing
                  this right — procedurally and documentarily — matters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 3 — INVESTIGATION REPORT BUILDER
            Static content only. No interactive elements.
        ══════════════════════════════════════════════ */}
        <section className="eeo-section">
          <div className="eeo-section__inner">
            <p className="eeo-irb__eyebrow">Investigation Report Builder</p>
            <h2 className="eeo-section__heading eeo-section__heading--narrow">
              Most training tells you what to do. This makes you do the work.
            </h2>
            <p className="eeo-section__sub">
              The Investigation Report Builder is the core of this program. You
              do not read about investigations — you run one.
            </p>
            <div className="eeo-irb-list">
              <div className="eeo-irb-item">
                <span className="eeo-irb-item__num">01</span>
                <div>
                  <p className="eeo-irb-item__title">
                    Work through a realistic scenario
                  </p>
                  <p className="eeo-irb-item__body">
                    A fully developed workplace complaint with employees,
                    timelines, and conflicting accounts — structured like a real
                    case.
                  </p>
                </div>
              </div>
              <div className="eeo-irb-item">
                <span className="eeo-irb-item__num">02</span>
                <div>
                  <p className="eeo-irb-item__title">
                    Build your investigation report step by step
                  </p>
                  <p className="eeo-irb-item__body">
                    Guided prompts take you through each section: allegations,
                    interviews, findings, and conclusions.
                  </p>
                </div>
              </div>
              <div className="eeo-irb-item">
                <span className="eeo-irb-item__num">03</span>
                <div>
                  <p className="eeo-irb-item__title">Receive guided feedback</p>
                  <p className="eeo-irb-item__body">
                    Each section includes feedback tied to EEOC standards so you
                    understand not just what to write but why.
                  </p>
                </div>
              </div>
              <div className="eeo-irb-item">
                <span className="eeo-irb-item__num">04</span>
                <div>
                  <p className="eeo-irb-item__title">
                    Download and reuse your final report
                  </p>
                  <p className="eeo-irb-item__body">
                    Your completed report is a working template. Download it and
                    adapt it for real investigations in your organization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — WHAT'S INCLUDED
            Static content only. No logic.
        ══════════════════════════════════════════════ */}
        <section className="eeo-section eeo-section--alt">
          <div className="eeo-section__inner">
            <h2 className="eeo-section__heading">What's included</h2>
            <div className="eeo-includes-grid">
              {[
                {
                  title: "Full 40-hour structured program",
                  body: "Comprehensive curriculum covering EEO law foundations, discrimination theory, interview technique, report writing, and resolution.",
                },
                {
                  title: "Section quizzes",
                  body: "Checkpoint assessments after each module to reinforce key concepts before moving forward.",
                },
                {
                  title: "Final certification exam",
                  body: "Covers the full program. 80% passing threshold. You may retry if needed.",
                },
                {
                  title: "Investigation Report Builder",
                  body: "The hands-on component that sets this program apart. Build and download a real investigation report.",
                },
                {
                  title: "Downloadable certificate",
                  body: "Issued with a unique ID, formatted for printing and digital sharing.",
                },
                {
                  title: "Public certificate verification",
                  body: "Employers can verify your certificate instantly at workplacecomplianceinstitute.com/verify.",
                },
              ].map(({ title, body }) => (
                <div key={title} className="eeo-include-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  >
                    <circle cx="8" cy="8" r="7.5" fill="#e2f4ee" />
                    <path
                      d="M5 8.5l2 2 4-4"
                      stroke="#0d6e59"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <p className="eeo-include-item__title">{title}</p>
                    <p className="eeo-include-item__body">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 5 — PRICING, RENEWAL, REFUND
            Auth/purchase logic below is original inline
            block in original order. CEU section guarded
            by !hasOwnedExams as in the original.
        ══════════════════════════════════════════════ */}
        <section className="eeo-section">
          <div className="eeo-section__inner">
            <h2 className="eeo-section__heading">Pricing</h2>

            <div className="eeo-pricing-grid">
              {/* New certification */}
              <div className="eeo-price-card eeo-price-card--primary">
                <p className="eeo-price-card__label">New Certification</p>
                <p className="eeo-price-card__amount">$349</p>
                <p className="eeo-price-card__detail">
                  One-time &nbsp;·&nbsp; 60-day course access &nbsp;·&nbsp;
                  1-year certification
                </p>

                {/* ── Original auth/purchase logic — order and branching unchanged ── */}
                <div style={{ marginTop: "20px" }}>
                  <SignedOut>
                    <div className="home-btn-row">
                      <Link to="/sign-up" className="btn-primary">
                        Start Certification
                      </Link>
                      <Link to="/sign-in" className="btn-secondary">
                        Log In
                      </Link>
                    </div>
                  </SignedOut>

                  <SignedIn>
                    {hasOwnedExams ? (
                      <div>
                        <p
                          style={{
                            fontFamily: "var(--font-ui)",
                            fontSize: "0.875rem",
                            color: "var(--text-secondary)",
                            marginBottom: "var(--sp-3)",
                          }}
                        >
                          Manage your certification progress, renewal, and
                          access from your dashboard.
                        </p>
                        <Link to="/dashboard" className="btn-primary">
                          Go to Dashboard
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={handlePurchase}
                          disabled={purchasing}
                          className="btn-teal"
                          style={{ opacity: purchasing ? 0.7 : 1 }}
                        >
                          {purchasing
                            ? "Redirecting…"
                            : "Purchase Certification"}
                        </button>
                        <p style={{ marginTop: "var(--sp-3)" }}>
                          <SignOutButton>
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                fontFamily: "var(--font-ui)",
                                fontSize: "0.8rem",
                                color: "var(--text-muted)",
                                textDecoration: "underline",
                              }}
                            >
                              Log out
                            </button>
                          </SignOutButton>
                        </p>
                      </div>
                    )}
                  </SignedIn>
                </div>
              </div>

              {/* CEU Renewal — guarded by !hasOwnedExams, original logic unchanged */}
              {!hasOwnedExams && (
                <div className="eeo-price-card">
                  <p className="eeo-price-card__label">Annual CEU Renewal</p>
                  <p className="eeo-price-card__amount">$129</p>
                  <p className="eeo-price-card__detail">
                    Extends your certification for another year
                  </p>
                  <div style={{ marginTop: "20px" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        marginBottom: "var(--sp-1)",
                      }}
                    >
                      Complete the renewal course and exam to extend your
                      certification.
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        marginBottom: "var(--sp-3)",
                      }}
                    >
                      Already certified elsewhere? You can still renew here.
                    </p>
                    <Link
                      to="/ceu"
                      className="btn-secondary"
                      style={{ display: "inline-block" }}
                    >
                      Go to CEU Renewal
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Refund policy */}
            <p className="eeo-refund-note">
              3-day refund if less than 25% of the course is completed. No
              refunds after that threshold.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 6 — TRUST / VERIFICATION
            Verify link routing target unchanged.
        ══════════════════════════════════════════════ */}
        <section className="eeo-section eeo-section--alt">
          <div className="eeo-section__inner eeo-trust-row">
            <div>
              <h2 className="eeo-section__heading">
                A credential employers can verify
              </h2>
              <p className="eeo-section__sub">
                Built using guidance from the U.S. Equal Employment Opportunity
                Commission (EEOC). Every certificate carries a unique ID that
                employers can confirm instantly — no paperwork, no waiting.
              </p>
              <p
                className="home-verify-link"
                style={{ marginTop: "var(--sp-4)" }}
              >
                <Link to="/verify">Verify a Certificate</Link>
              </p>
            </div>
            <div className="eeo-trust-badge">
              <img
                src="/shield-icon-only-main.png"
                alt=""
                style={{ height: "44px", width: "auto", marginBottom: "10px" }}
              />
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#1a2a4a",
                  margin: 0,
                }}
              >
                Workplace Compliance Institute
              </p>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  margin: "4px 0 0",
                }}
              >
                Certificate of Completion
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Admin footer — unchanged ── */}
      <footer
        style={{
          position: "fixed",
          bottom: "12px",
          right: "16px",
          pointerEvents: "none",
        }}
      >
        <Link
          to="/admin/sign-in"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.7rem",
            color: "rgba(0,0,0,0.18)",
            textDecoration: "none",
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
            e.currentTarget.style.color = "rgba(0,0,0,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
            e.currentTarget.style.color = "rgba(0,0,0,0.18)";
          }}
        >
          Admin
        </Link>
      </footer>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type ExamEntry = {
  examId: string;
  examTitle: string;
  examSlug: string;
  purchasedAt: string;
  ceuAccessUntil: string | null;
  certification: {
    issuedAt: string;
    expiresAt: string;
    renewedAt: string | null;
  } | null;
};

type CertEntry = {
  certificateId: string | null;
  fullName: string | null;
  issuedAt: string;
  expiresAt: string;
  renewedAt: string | null;
  examTitle: string;
};

function ceuStatusText(ceuAccessUntil: string | null): string {
  if (!ceuAccessUntil) return "";
  const until = new Date(ceuAccessUntil);
  const now = new Date();
  if (until <= now) return "CEU access expired — renew to continue";
  const days = Math.ceil(
    (until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `CEU access: ${days} day${days === 1 ? "" : "s"} remaining`;
}

function certStatusText(certification: ExamEntry["certification"]): string {
  if (!certification?.expiresAt) return "";
  const expires = new Date(certification.expiresAt);
  const renewed = certification.renewedAt ? " (renewed)" : "";
  return `Certification active until ${expires.toLocaleDateString()}${renewed}`;
}

function courseAccessText(purchasedAt: string): string {
  const expiry = new Date(purchasedAt);
  expiry.setDate(expiry.getDate() + 60);
  const now = new Date();
  if (expiry <= now) return "Course access expired";
  const days = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `Course access: ${days} day${days === 1 ? "" : "s"} remaining`;
}

function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { completed, quizResults, courseAccessActive } = useCompletion();
  const totalLessons = ACTIVE_COURSE.sections.reduce(
    (sum, s) => sum + s.lessons.length,
    0,
  );
  const quizzesPassed = ACTIVE_COURSE.sections.filter(
    (s) => quizResults[s.id] === "passed",
  ).length;

  const [myExams, setMyExams] = useState<ExamEntry[]>([]);
  const [myCerts, setMyCerts] = useState<CertEntry[]>([]);
  const [extendingAccess, setExtendingAccess] = useState(false);

  async function handleExtendAccess() {
    setExtendingAccess(true);
    try {
      const base = import.meta.env.VITE_API_URL ?? "";
      const token = await getToken();
      const res = await fetch(`${base}/create-extend-access-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setExtendingAccess(false);
    } catch {
      setExtendingAccess(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    const base = import.meta.env.VITE_API_URL ?? "";
    getToken().then((token) => {
      fetch(`${base}/my-exams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((exams: ExamEntry[]) => setMyExams(exams))
        .catch(() => {});

      fetch(`${base}/my-certifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((certs: CertEntry[]) => setMyCerts(certs))
        .catch(() => {});
    });
  }, [user?.id, getToken]);

  return (
    <div className="page-shell">
      <Link
        to="/"
        className="page-back-link"
        style={{
          color: "var(--text-secondary)",
          fontWeight: 600,
          textDecoration: "underline",
          marginBottom: "12px",
        }}
      >
        ← Back to Home
      </Link>
      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-meta">{user?.primaryEmailAddress?.emailAddress}</p>
      </div>

      <hr className="dash-divider" />

      {myExams.map((exam) => {
        const isEeo = exam.examSlug === COURSE.id;
        const isCeuOnly =
          exam.ceuAccessUntil !== null && exam.certification === null;
        const ceuText = ceuStatusText(exam.ceuAccessUntil);
        const certText = certStatusText(exam.certification);
        const accessText =
          !isCeuOnly && isEeo ? courseAccessText(exam.purchasedAt) : "";

        // CEU-only users: show a lightweight access panel, not the full
        // certification card. Their completion certificate already appears in
        // the "Your Certifications" section below via /my-certifications.
        if (isCeuOnly) {
          return (
            <div key={exam.examId}>
              <div className="info-panel">
                <p className="info-panel__title">CEU Renewal Access</p>
                {ceuText && (
                  <p className="dash-course-progress">{ceuText}</p>
                )}
                <div className="action-row">
                  <Link to="/ceu" className="link-btn">
                    Go to CEU Renewal
                  </Link>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={exam.examId}>
            <div
              className="info-panel info-panel--warm info-panel--featured"
              style={{ marginBottom: "var(--sp-6)" }}
            >
              <p className="info-panel__title">{exam.examTitle}</p>
              {isEeo && !isCeuOnly && (
                <p className="dash-course-desc">
                  A structured program covering federal equal employment
                  opportunity law, complaint investigation procedures, and
                  agency compliance standards.
                </p>
              )}
              {certText && <p className="dash-course-progress">{certText}</p>}
              {isCeuOnly && (
                <p
                  className="dash-course-progress"
                  style={{ color: "var(--text-muted)" }}
                >
                  CEU renewal access only — full course lessons are not
                  included.
                </p>
              )}
              {!isCeuOnly &&
                isEeo &&
                !exam.certification &&
                (() => {
                  const pct = Math.round((completed.size / totalLessons) * 100);
                  return (
                    <div className="dash-progress-unit">
                      <p className="dash-course-progress dash-progress-headline">
                        {pct === 0 ? (
                          <>
                            <span className="dash-progress-label">
                              Not started yet
                            </span>{" "}
                            &middot; <strong>0%</strong> complete
                          </>
                        ) : (
                          <>
                            <strong>{pct}%</strong> complete
                          </>
                        )}
                      </p>
                      <div className="course-progress-bar">
                        <div
                          className="course-progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="dash-course-progress">
                        {completed.size} of {totalLessons} lessons
                        {quizzesPassed > 0 &&
                          ` · ${quizzesPassed} of ${ACTIVE_COURSE.sections.length} quizzes passed`}
                      </p>
                    </div>
                  );
                })()}
              {accessText && !exam.certification && courseAccessActive && (
                <p className="dash-course-progress">{accessText}</p>
              )}
              {!isCeuOnly &&
                isEeo &&
                !exam.certification &&
                !courseAccessActive && (
                  <p className="dash-course-progress">
                    Your 60-day course access has expired. Extend access for
                    another 60 days for $99 to continue and complete your
                    certification.
                  </p>
                )}
              {ceuText && <p className="dash-course-progress">{ceuText}</p>}
            </div>
            {isEeo && (
              <div
                className="action-row"
                style={{ marginBottom: "var(--sp-6)" }}
              >
                {isCeuOnly && (
                  <Link to="/ceu" className="btn-primary">
                    Renew Certification
                  </Link>
                )}
                {!isCeuOnly &&
                  !exam.certification &&
                  courseAccessActive &&
                  (() => {
                    const raw = localStorage.getItem("courseProgress");
                    const prog = raw ? JSON.parse(raw) : null;
                    const hasProgress = prog !== null && completed.size > 0;
                    const to = prog
                      ? `/course?section=${prog.sectionIndex}&lesson=${prog.lessonIndex}`
                      : "/course";
                    const nextLesson = prog
                      ? ACTIVE_COURSE.sections[prog.sectionIndex]?.lessons[
                          prog.lessonIndex
                        ]
                      : null;
                    const nextTitle = nextLesson
                      ? displayTitle(nextLesson.title)
                      : null;
                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "var(--sp-1)",
                        }}
                      >
                        <Link to={to} className="btn-primary">
                          {hasProgress
                            ? "Resume Course"
                            : completed.size === 0
                              ? "Start Course"
                              : "Continue Course"}
                        </Link>
                        {hasProgress && nextTitle && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              fontFamily: "var(--font-ui)",
                            }}
                          >
                            Next: {nextTitle}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                {!isCeuOnly && !exam.certification && !courseAccessActive && (
                  <button
                    className="btn-teal"
                    onClick={handleExtendAccess}
                    disabled={extendingAccess}
                    style={{ opacity: extendingAccess ? 0.7 : 1 }}
                  >
                    {extendingAccess ? "Redirecting…" : "Extend Course Access — $99"}
                  </button>
                )}
                {!isCeuOnly && exam.certification && courseAccessActive && (
                  <Link to="/course" className="link-btn">
                    View Course
                  </Link>
                )}
                {!isCeuOnly && exam.certification && (
                  <Link to="/ceu" className="btn-primary">
                    Renew Certification
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}

      {myCerts.length > 0 && (
        <>
          <hr className="dash-divider" />
          <h2
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              letterSpacing: "var(--tracking-widest)",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-4)",
            }}
          >
            Your Certifications
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            {myCerts.map((cert, i) => {
              const isExpired = new Date(cert.expiresAt) <= new Date();
              const isCeu = cert.certificateId?.startsWith("WCI-CEU-");
              const certType = isCeu ? "CEU Completion" : "Certification";
              const status = isExpired ? "Expired" : "Valid";
              const statusColor = isExpired ? "var(--color-error)" : "var(--color-success)";
              return (
                <div
                  key={cert.certificateId ?? i}
                  className="info-panel"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: 0 }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--text-xs)",
                        fontWeight: 700,
                        letterSpacing: "var(--tracking-wide)",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      {certType}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-primary)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      Issued {new Date(cert.issuedAt).toLocaleDateString()} · Expires {new Date(cert.expiresAt).toLocaleDateString()}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        color: statusColor,
                      }}
                    >
                      {status}
                      {cert.certificateId && ` · ${cert.certificateId}`}
                    </p>
                  </div>
                  {cert.certificateId && (
                    <Link
                      to={`/certificate?certificateId=${encodeURIComponent(cert.certificateId)}`}
                      className="btn-secondary"
                      style={{ flexShrink: 0 }}
                    >
                      View / Download
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="action-row">
        <SignOutButton />
      </div>
    </div>
  );
}

// ─── Course Page ──────────────────────────────────────────────────────────────

const TOTAL_LESSONS = ACTIVE_COURSE.sections.reduce(
  (sum, s) => sum + s.lessons.length,
  0,
);

// ── Report Builder entry panel ────────────────────────────────────────────────

function ReportBuilderEntry({ userId }: { userId: string | undefined }) {
  const skipKey = userId ? `wci_rb_skipped_${userId}` : null;
  const hasData = userId
    ? (() => {
        try {
          const raw = localStorage.getItem(`wci_report_builder_${userId}`);
          if (!raw) return false;
          const d = JSON.parse(raw);
          return Object.values(d).some((v) => (v as string).trim().length > 0);
        } catch {
          return false;
        }
      })()
    : false;

  const [skipped, setSkipped] = useState(
    () => (skipKey ? localStorage.getItem(skipKey) === "1" : false)
  );

  function handleSkip() {
    if (skipKey) localStorage.setItem(skipKey, "1");
    setSkipped(true);
  }

  return (
    <div className="rb-entry-panel">
      <p className="rb-entry-eyebrow">Practical Exercise</p>
      <h2 className="rb-entry-title">Investigation Report Builder</h2>
      {skipped ? (
        <>
          <p className="rb-skip-msg">
            This exercise is where most learners gain confidence. You can skip
            it, but we recommend completing it before the final exam.
          </p>
          <Link to="/report-builder" className="btn-secondary" style={{ fontSize: "0.8rem" }}>
            Start Anyway →
          </Link>
        </>
      ) : (
        <>
          <p className="rb-entry-desc">
            Put your training into practice by building a real investigation
            report. Walk through a realistic scenario step by step — not graded,
            but strongly recommended before the final exam.
          </p>
          <div className="rb-entry-actions">
            <Link to="/report-builder" className="btn-primary">
              {hasData ? "Continue Report Builder →" : "Start Report Builder →"}
            </Link>
            <button
              className="rb-skip-link"
              onClick={handleSkip}
            >
              Skip for now
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CoursePage() {
  const { completed, quizResults, finalExamResult } = useCompletion();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const si = params.get("section");
    const li = params.get("lesson");
    if (si !== null && li !== null) {
      const section = ACTIVE_COURSE.sections[Number(si)];
      const lesson = section?.lessons[Number(li)];
      if (lesson) {
        navigate(`/lesson/${lesson.id}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quizSummary = (
    location.state as {
      quizSummary?: {
        correct: number;
        total: number;
        passed: boolean;
        sectionTitle: string;
      };
    } | null
  )?.quizSummary;

  const allLessonsDone = ALL_LESSONS.every((l) => completed.has(l.id));
  const allQuizzesPassed = ACTIVE_COURSE.sections.every(
    (s) => quizResults[s.id] === "passed",
  );
  const eligible = allLessonsDone && allQuizzesPassed;

  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  function handleFinalExamClick() {
    const uid = user?.id;
    const stored = uid ? localStorage.getItem(`wci_cert_name_${uid}`) : null;
    if (stored) {
      navigate("/final-exam");
    } else {
      setShowNameModal(true);
    }
  }

  async function handleNameSave() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNameSaving(true);
    const uid = user?.id;
    if (uid) {
      localStorage.setItem(`wci_cert_name_${uid}`, trimmed);
    }
    try {
      const token = await getToken();
      const base = import.meta.env.VITE_API_URL ?? "";
      await fetch(`${base}/set-full-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName: trimmed }),
      });
    } catch {
      // localStorage copy is the fallback; network failure is non-blocking
    }
    setNameSaving(false);
    setShowNameModal(false);
    navigate("/final-exam");
  }

  return (
    <>
      <div className="page-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>

        <div className="page-header">
          <h1 className="page-title">{ACTIVE_COURSE.title}</h1>
          <p className="page-subtitle">
            {Math.round((completed.size / TOTAL_LESSONS) * 100)}% complete
            &middot; {completed.size} of {TOTAL_LESSONS} lessons
          </p>
          <div
            className="course-progress-bar"
            style={{ marginTop: "var(--sp-3)" }}
          >
            <div
              className="course-progress-fill"
              style={{
                width: `${Math.round((completed.size / TOTAL_LESSONS) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="info-panel" style={{ marginBottom: "var(--sp-5)" }}>
          <p className="info-panel__title">Certification Requirements</p>
          <ul className="req-list">
            <li
              style={{
                color: allLessonsDone ? "var(--color-success)" : "inherit",
              }}
            >
              All lessons completed: {allLessonsDone ? "✓ Yes" : "No"}
            </li>
            <li
              style={{
                color: allQuizzesPassed ? "var(--color-success)" : "inherit",
              }}
            >
              All section quizzes passed: {allQuizzesPassed ? "✓ Yes" : "No"}
            </li>
            <li
              style={{
                color:
                  finalExamResult === "passed"
                    ? "var(--color-success)"
                    : finalExamResult === "failed"
                      ? "var(--color-error)"
                      : "inherit",
              }}
            >
              Final exam:{" "}
              {finalExamResult === "passed"
                ? "✓ Passed"
                : finalExamResult === "failed"
                  ? "✗ Failed"
                  : "Not started"}
            </li>
          </ul>
        </div>

        {quizSummary && (
          <div
            className="info-panel info-panel--notice"
            style={{ marginBottom: "var(--sp-5)" }}
          >
            <strong>{quizSummary.sectionTitle}:</strong> You scored{" "}
            {quizSummary.correct} out of {quizSummary.total}.{" "}
            <span
              style={{
                color: quizSummary.passed
                  ? "var(--color-success)"
                  : "var(--color-error)",
                fontWeight: 600,
              }}
            >
              {quizSummary.passed
                ? "Section passed."
                : "You did not pass. Review the section and try again."}
            </span>
          </div>
        )}

        {/* ── Report Builder entry ── */}
        <ReportBuilderEntry userId={user?.id} />

        {finalExamResult === "passed" ? (
          <div className="status-bar status-bar--certified">
            <span
              className="status-label"
              style={{ color: "var(--color-gold)" }}
            >
              ✓ Certified
            </span>
            <Link to="/certificate">View Certificate →</Link>
          </div>
        ) : (
          <div className="status-bar">
            <span
              className="status-label"
              style={{
                color: eligible ? "var(--color-success)" : "var(--text-muted)",
              }}
            >
              {eligible ? "✓ Certification Unlocked" : "⊘ Certification Locked"}
            </span>
            {eligible ? (
              <button
                className="btn-primary"
                style={{ fontSize: "0.75rem" }}
                onClick={handleFinalExamClick}
              >
                Take Final Exam
              </button>
            ) : (
              <button
                disabled
                className="btn-primary"
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.35,
                  cursor: "not-allowed",
                }}
              >
                Take Final Exam
              </button>
            )}
          </div>
        )}

        {ACTIVE_COURSE.sections.map((section) => {
          const quizResult = quizResults[section.id];
          const quizLabel =
            quizResult === "passed"
              ? "✓ Passed"
              : quizResult === "failed"
                ? "✗ Failed"
                : "Not started";

          return (
            <div key={section.id} className="section-block">
              <h2>{section.title}</h2>
              <div className="lesson-list">
                {section.lessons.map((lesson) => (
                  <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                    {completed.has(lesson.id) ? "✓ " : ""}
                    {displayTitle(lesson.title)}
                  </Link>
                ))}
              </div>
              <div className="quiz-row">
                <Link to={`/quiz/${section.id}`}>Start Quiz</Link>
                <span
                  className="quiz-status"
                  style={{
                    color:
                      quizResult === "passed"
                        ? "var(--color-success)"
                        : quizResult === "failed"
                          ? "var(--color-error)"
                          : "var(--text-muted)",
                  }}
                >
                  Quiz: {quizLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showNameModal && (
        <div className="name-modal-overlay">
          <div className="name-modal">
            <p className="name-modal__title">
              Enter your name for the certificate
            </p>
            <p className="name-modal__desc">
              This name will appear on your certificate exactly as entered.
            </p>
            <input
              className="name-modal__input"
              type="text"
              placeholder="Full name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave();
              }}
              autoFocus
            />
            <div className="name-modal__actions">
              <button
                className="btn-secondary"
                style={{ fontSize: "0.8rem" }}
                onClick={() => setShowNameModal(false)}
                disabled={nameSaving}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: "0.8rem" }}
                onClick={handleNameSave}
                disabled={!nameInput.trim() || nameSaving}
              >
                {nameSaving ? "Saving…" : "Continue to Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Lesson Page ──────────────────────────────────────────────────────────────

function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { completed, toggle, quizResults } = useCompletion();

  let foundLesson: {
    section: (typeof ACTIVE_COURSE.sections)[0];
    lesson: (typeof ACTIVE_COURSE.sections)[0]["lessons"][0];
  } | null = null;

  for (const section of ACTIVE_COURSE.sections) {
    const lesson = section.lessons.find((l) => l.id === id);
    if (lesson) {
      foundLesson = { section, lesson };
      break;
    }
  }

  if (!foundLesson) {
    return (
      <div className="page-shell">
        <p>Lesson not found.</p>
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
      </div>
    );
  }

  const { section, lesson } = foundLesson;
  const lessonIndex = ALL_LESSONS.findIndex((l) => l.id === id);
  const prevLesson = lessonIndex > 0 ? ALL_LESSONS[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < ALL_LESSONS.length - 1 ? ALL_LESSONS[lessonIndex + 1] : null;
  const isDone = completed.has(lesson.id);
  const lessonDisplayTitle = displayTitle(lesson.title);

  const sectionIndex = ACTIVE_COURSE.sections.findIndex(
    (s) => s.id === section.id,
  );

  const lessonIndexInSection = section.lessons.findIndex(
    (l) => l.id === lesson.id,
  );
  const isLastInSection = lessonIndexInSection === section.lessons.length - 1;
  const sectionQuizPassed = quizResults[section.id] === "passed";
  const nextSection =
    sectionIndex < ACTIVE_COURSE.sections.length - 1
      ? ACTIVE_COURSE.sections[sectionIndex + 1]
      : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [lesson.id]);

  useEffect(() => {
    localStorage.setItem(
      "courseProgress",
      JSON.stringify({ sectionIndex, lessonIndex }),
    );
  }, [sectionIndex, lessonIndex]);

  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  useEffect(() => {
    setAutoCompleted(false);
    setHasUserScrolled(false);
  }, [lesson.id]);

  useEffect(() => {
    const onScroll = () => setHasUserScrolled(true);
    window.addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lesson.id]);

  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasUserScrolled && !isDone) {
          toggle(lesson.id);
          setAutoCompleted(true);
          observer.disconnect();
        }
      },
      { threshold: 1.0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, hasUserScrolled]);

  const overallProgressPct = Math.round(
    ((lessonIndex + 1) / ALL_LESSONS.length) * 100,
  );

  return (
    <div className="page-shell">
      <div className="lesson-progress-bar">
        <div
          className="lesson-progress-fill"
          style={{ width: `${overallProgressPct}%` }}
        />
      </div>

      <Link to="/course" className="page-back-link">
        ← Back to Course
      </Link>

      <div className="lesson-header">
        <p className="lesson-position">
          Section {sectionIndex + 1} of {ACTIVE_COURSE.sections.length}
          &nbsp;·&nbsp; Lesson {lessonIndex + 1} of {ALL_LESSONS.length}
        </p>
        <p className="lesson-section-label">{section.title}</p>
        <h1 className="lesson-title">{lessonDisplayTitle}</h1>
        <p className="lesson-meta">{lesson.estimatedTime}</p>
      </div>

      <div className="lesson-body">
        {lesson.content.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div ref={bottomSentinelRef} />
      </div>

      <div className="lesson-audio">{`Audio narration for ${lessonDisplayTitle} coming soon.`}</div>

      <div className="lesson-complete-row">
        <button onClick={() => toggle(lesson.id)}>
          {isDone ? "Mark as Incomplete" : "Mark as Complete"}
        </button>
        <span
          className="lesson-complete-status"
          style={{
            color: isDone ? "var(--color-success)" : "var(--text-muted)",
          }}
        >
          {autoCompleted
            ? "✓ Lesson completed"
            : isDone
              ? "✓ Completed"
              : "Not completed"}
        </span>
      </div>

      <div className="lesson-nav">
        {prevLesson ? (
          <Link to={`/lesson/${prevLesson.id}`}>← Previous Lesson</Link>
        ) : (
          <span />
        )}
        {isLastInSection ? (
          sectionQuizPassed && nextSection ? (
            <Link to={`/lesson/${nextSection.lessons[0].id}`}>
              Next Section →
            </Link>
          ) : (
            <Link to={`/quiz/${section.id}`}>Take Section Quiz →</Link>
          )
        ) : (
          nextLesson && (
            <Link to={`/lesson/${nextLesson.id}`}>Next Lesson →</Link>
          )
        )}
      </div>

      <div className="lesson-nav-back">
        <Link to="/course">Back to Course</Link>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  );
}

// ─── Quiz Page ────────────────────────────────────────────────────────────────

function QuizPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { setQuizResult } = useCompletion();

  const quiz = ACTIVE_QUIZZES.find((q) => q.sectionId === sectionId);
  const section = ACTIVE_COURSE.sections.find((s) => s.id === sectionId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    quiz ? Array(quiz.questions.length).fill(null) : [],
  );
  const [confirmed, setConfirmed] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState<{
    correct: number;
    total: number;
    passed: boolean;
  } | null>(null);

  if (!quiz || !section) {
    return (
      <div className="quiz-shell">
        <p>Quiz not found.</p>
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const selected = answers[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  const progressPct = Math.round(
    ((confirmed && isLast ? quiz.questions.length : currentIndex) /
      quiz.questions.length) *
      100,
  );
  const isCorrect = confirmed && selected === question.correctIndex;

  const sectionIdx = ACTIVE_COURSE.sections.findIndex(
    (s) => s.id === sectionId,
  );
  const nextSection =
    sectionIdx >= 0 && sectionIdx < ACTIVE_COURSE.sections.length - 1
      ? ACTIVE_COURSE.sections[sectionIdx + 1]
      : null;
  const nextSectionFirstLesson = nextSection?.lessons[0] ?? null;

  if (showResults && finalScore) {
    return (
      <div className="quiz-shell">
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
        <p className="quiz-context">{section.title}</p>
        <h1 className="quiz-heading">Quiz Results</h1>

        <div
          className="info-panel"
          style={{
            borderColor: finalScore.passed
              ? "var(--teal)"
              : "var(--color-error)",
            marginBottom: "var(--sp-6)",
          }}
        >
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "var(--sp-1)",
            }}
          >
            {finalScore.correct} / {finalScore.total} correct
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
            }}
          >
            {finalScore.passed
              ? "You passed! Score meets the 80% passing threshold."
              : `Score: ${Math.round((finalScore.correct / finalScore.total) * 100)}% — 80% required to pass.`}
          </p>
        </div>

        {finalScore.passed ? (
          nextSectionFirstLesson ? (
            <Link
              to={`/lesson/${nextSectionFirstLesson.id}`}
              className="btn-primary"
            >
              Start Next Section →
            </Link>
          ) : (
            <Link to="/course" className="btn-primary">
              Back to Course
            </Link>
          )
        ) : (
          <button
            className="btn-primary"
            onClick={() => {
              setCurrentIndex(0);
              setAnswers(Array(quiz.questions.length).fill(null));
              setConfirmed(false);
              setShowResults(false);
              setFinalScore(null);
            }}
          >
            Retry Quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="quiz-shell">
      <Link to="/course" className="page-back-link">
        ← Back to Course
      </Link>

      <p className="quiz-context">{section.title}</p>
      <h1 className="quiz-heading">Section Quiz</h1>

      <div className="quiz-progress">
        <div
          className="quiz-progress__fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <p className="quiz-counter">
        Question {currentIndex + 1} of {quiz.questions.length}
      </p>

      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options">
        {question.options.map((option, i) => {
          let cls = "quiz-option";
          if (confirmed) {
            if (i === question.correctIndex) cls += " quiz-option--correct";
            else if (i === selected) cls += " quiz-option--incorrect";
          } else if (selected === i) {
            cls += " quiz-option--selected";
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={confirmed}
              onClick={() =>
                setAnswers((prev) => {
                  const next = [...prev];
                  next[currentIndex] = i;
                  return next;
                })
              }
            >
              <span className="quiz-option__dot" />
              <span className="quiz-option__label">{option}</span>
            </button>
          );
        })}
      </div>

      {confirmed && (
        <div
          className="quiz-feedback"
          style={{
            marginTop: "var(--sp-4)",
            padding: "var(--sp-4)",
            borderRadius: "var(--r-md)",
            background: isCorrect ? "var(--teal-50)" : "var(--color-error-bg)",
            borderLeft: `3px solid ${isCorrect ? "var(--teal)" : "var(--color-error)"}`,
          }}
        >
          <p
            style={{
              fontWeight: 600,
              marginBottom: "var(--sp-1)",
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
            }}
          >
            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
          </p>
          {!isCorrect && (
            <p
              style={{
                fontSize: "0.875rem",
                marginBottom: "var(--sp-1)",
                color: "var(--text-secondary)",
              }}
            >
              Correct answer: {question.options[question.correctIndex]}
            </p>
          )}
          {(question as { explanation?: string }).explanation && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              {(question as { explanation?: string }).explanation}
            </p>
          )}
        </div>
      )}

      <button
        className="quiz-submit"
        disabled={selected === null}
        style={{ marginTop: "var(--sp-5)" }}
        onClick={() => {
          if (!confirmed) {
            setConfirmed(true);
            return;
          }
          if (isLast) {
            const correct = answers.filter(
              (a, i) => a === quiz.questions[i].correctIndex,
            ).length;
            const total = quiz.questions.length;
            const passed = correct / total >= 0.8;
            setQuizResult(section.id, passed ? "passed" : "failed");
            setFinalScore({ correct, total, passed });
            setShowResults(true);
          } else {
            setCurrentIndex((i) => i + 1);
            setConfirmed(false);
          }
        }}
      >
        {!confirmed
          ? "Confirm Answer"
          : isLast
            ? "See Results"
            : "Next Question"}
      </button>
    </div>
  );
}

// ─── Final Exam Page ──────────────────────────────────────────────────────────

const DEV_BYPASS_FINAL_EXAM = false; // TODO: remove before production
const EXAM_PASSING_THRESHOLD = 0.8;
const EXAM_PASSING_PCT = "80%";

function FinalExamPage() {
  const { completed, quizResults, finalExamResult, setFinalExamResult } =
    useCompletion();
  const { user } = useUser();
  const { getToken } = useAuth();
  const allLessonsDone = ALL_LESSONS.every((l) => completed.has(l.id));
  const allQuizzesPassed = ACTIVE_COURSE.sections.every(
    (s) => quizResults[s.id] === "passed",
  );
  const isAdminExamPreview =
    localStorage.getItem("wci_admin_exam_preview") === "1" &&
    localStorage.getItem("generatedCertification") !== null;
  const eligible =
    DEV_BYPASS_FINAL_EXAM ||
    isAdminExamPreview ||
    (allLessonsDone && allQuizzesPassed);

  const examProgressKey = user?.id
    ? `wci_final_exam_progress_${user.id}`
    : null;

  function loadExamProgress() {
    if (!examProgressKey) return null;
    try {
      const raw = localStorage.getItem(examProgressKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearExamProgress() {
    if (examProgressKey) localStorage.removeItem(examProgressKey);
  }

  const savedProgress = loadExamProgress();
  const hasResume =
    savedProgress?.inProgress === true &&
    Array.isArray(savedProgress.answers) &&
    savedProgress.answers.length === ACTIVE_FINAL_EXAM.length;

  const [showIntro, setShowIntro] = useState(!hasResume);
  const [currentIndex, setCurrentIndex] = useState<number>(
    hasResume ? (savedProgress.currentIndex ?? 0) : 0,
  );
  const [answers, setAnswers] = useState<(number | null)[]>(
    hasResume
      ? savedProgress.answers
      : Array(ACTIVE_FINAL_EXAM.length).fill(null),
  );
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuanceError, setIssuanceError] = useState(false);

  useEffect(() => {
    if (!examProgressKey || showResults || showIntro) return;
    localStorage.setItem(
      examProgressKey,
      JSON.stringify({
        inProgress: true,
        currentIndex,
        answers,
      }),
    );
  }, [currentIndex, answers, showIntro, showResults, examProgressKey]);

  if (!eligible) {
    return (
      <div className="exam-shell">
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
        <div
          className="info-panel info-panel--notice"
          style={{ marginTop: "var(--sp-6)" }}
        >
          You must complete all lessons and pass all section quizzes before
          taking the final exam.
        </div>
      </div>
    );
  }

  if (finalExamResult === "passed" && !showResults) {
    return (
      <div className="exam-shell">
        <div
          className="exam-results-panel"
          style={{ borderColor: "var(--color-gold)", textAlign: "center" }}
        >
          <p style={{ fontSize: "2.5rem", marginBottom: "var(--sp-2)" }}>🏆</p>
          <p
            className="results-label"
            style={{ color: "var(--color-gold)", marginBottom: "var(--sp-2)" }}
          >
            Certification Earned
          </p>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "var(--sp-3)",
              color: "var(--navy)",
            }}
          >
            You have passed the Final Certification Exam
          </h1>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              marginBottom: "var(--sp-6)",
            }}
          >
            Your EEO Investigator certification has been issued.
          </p>
          <Link to="/certificate" className="btn-primary">
            View Your Certificate →
          </Link>
        </div>
      </div>
    );
  }

  if (showResults) {
    const correct = answers.filter(
      (a, i) => a === ACTIVE_FINAL_EXAM[i].correctIndex,
    ).length;
    const total = ACTIVE_FINAL_EXAM.length;
    const pct = Math.round((correct / total) * 100);
    const passed = correct / total >= EXAM_PASSING_THRESHOLD;

    if (passed) {
      return (
        <div className="exam-shell">
          <div
            className="exam-results-panel"
            style={{ borderColor: "var(--color-gold)", textAlign: "center" }}
          >
            <p style={{ fontSize: "2.5rem", marginBottom: "var(--sp-2)" }}>
              🏆
            </p>
            <p
              className="results-label"
              style={{
                color: "var(--color-gold)",
                marginBottom: "var(--sp-2)",
              }}
            >
              Certification Earned
            </p>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "var(--sp-3)",
                color: "var(--navy)",
              }}
            >
              You have passed the Final Certification Exam
            </h1>
            <p
              className="results-score"
              style={{ marginBottom: "var(--sp-1)" }}
            >
              {pct}%
            </p>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                marginBottom: "var(--sp-6)",
              }}
            >
              {correct} of {total} questions correct
            </p>
            <Link to="/certificate" className="btn-primary">
              View Your Certificate →
            </Link>
          </div>
        </div>
      );
    }

    const failedSections = ACTIVE_COURSE.sections.filter(
      (s) => quizResults[s.id] !== "passed",
    );

    return (
      <div className="exam-shell">
        <div
          className="exam-results-panel"
          style={{ borderColor: "var(--color-error)" }}
        >
          <p
            className="results-label"
            style={{ color: "var(--color-error)", marginBottom: "var(--sp-2)" }}
          >
            Not Passed
          </p>
          <p
            className="results-score"
            style={{ color: "var(--color-error)", marginBottom: "var(--sp-1)" }}
          >
            {pct}%
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              marginBottom: "var(--sp-3)",
            }}
          >
            {correct} of {total} correct &mdash; {EXAM_PASSING_PCT} required to
            pass
          </p>
          {failedSections.length > 0 && (
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              Consider reviewing:{" "}
              {failedSections.map((s) => s.title).join(", ")}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "var(--sp-4)" }}>
          <button
            className="btn-primary"
            onClick={() => {
              clearExamProgress();
              setAnswers(Array(ACTIVE_FINAL_EXAM.length).fill(null));
              setCurrentIndex(0);
              setShowResults(false);
              setShowIntro(true);
            }}
          >
            Retry Exam
          </button>
          <Link to="/course" className="btn-secondary">
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="exam-shell">
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
        <div className="exam-results-panel">
          <p className="results-label" style={{ marginBottom: "var(--sp-3)" }}>
            EEO Investigator Certification
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--navy)",
              marginBottom: "var(--sp-2)",
            }}
          >
            Final Certification Exam
          </h1>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginBottom: "var(--sp-5)",
            }}
          >
            You've completed the training. This exam validates your readiness.
          </p>
          <div
            style={{
              maxWidth: "420px",
              margin: "0 auto",
              marginBottom: "var(--sp-4)",
            }}
          >
            <ul
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.8,
                paddingLeft: "1.2em",
                textAlign: "left",
                margin: 0,
              }}
            >
              <li>
                {ACTIVE_FINAL_EXAM.length} questions covering all sections
              </li>
              <li>{EXAM_PASSING_PCT} required to pass</li>
              <li>Immediate results</li>
              <li>You may retry if needed</li>
            </ul>
          </div>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginBottom: "var(--sp-2)",
            }}
          >
            Estimated time: 15–20 minutes
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "var(--sp-5)",
            }}
          >
            You are about to be evaluated on your ability to apply EEO law — not
            just recall it.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowIntro(false)}
            style={{
              width: "100%",
              padding: "var(--sp-4) var(--sp-6)",
              fontSize: "0.9rem",
              marginBottom: "var(--sp-2)",
            }}
          >
            Begin Exam
          </button>
        </div>
      </div>
    );
  }

  const question = ACTIVE_FINAL_EXAM[currentIndex];
  const selected = answers[currentIndex];
  const isLast = currentIndex === ACTIVE_FINAL_EXAM.length - 1;
  const progressPct = Math.round(
    (currentIndex / ACTIVE_FINAL_EXAM.length) * 100,
  );

  return (
    <div className="exam-shell">
      <p className="quiz-context">Final Certification Exam</p>

      <div className="quiz-progress">
        <div
          className="quiz-progress__fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <p className="quiz-counter">
        Question {currentIndex + 1} of {ACTIVE_FINAL_EXAM.length}
      </p>

      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options">
        {question.options.map((option, i) => (
          <button
            key={i}
            className={`quiz-option${selected === i ? " quiz-option--selected" : ""}`}
            onClick={() =>
              setAnswers((prev) => {
                const next = [...prev];
                next[currentIndex] = i;
                return next;
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
        disabled={selected === null || isSubmitting}
        onClick={async () => {
          if (isLast) {
            const correct = answers.filter(
              (a, i) => a === ACTIVE_FINAL_EXAM[i].correctIndex,
            ).length;
            const passed =
              correct / ACTIVE_FINAL_EXAM.length >= EXAM_PASSING_THRESHOLD;

            if (!passed) {
              clearExamProgress();
              setFinalExamResult("failed");
              setShowResults(true);
              return;
            }

            setIsSubmitting(true);
            setIssuanceError(false);
            try {
              const uid = user?.id;
              const fullName =
                (uid ? localStorage.getItem(`wci_cert_name_${uid}`) : null) ??
                "";
              const token = await getToken();
              const base = import.meta.env.VITE_API_URL ?? "";
              const res = await fetch(`${base}/complete-exam`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ fullName }),
              });
              if (!res.ok) throw new Error(`${res.status}`);
              clearExamProgress();
              setFinalExamResult("passed");
              setShowResults(true);
            } catch {
              setIssuanceError(true);
            } finally {
              setIsSubmitting(false);
            }
          } else {
            setCurrentIndex((i) => i + 1);
          }
        }}
      >
        {isSubmitting ? "Saving…" : isLast ? "Submit Exam" : "Next Question"}
      </button>

      {issuanceError && (
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.875rem",
            color: "var(--color-error)",
            marginTop: "var(--sp-4)",
          }}
        >
          Something went wrong saving your result. Please try submitting again.
        </p>
      )}
    </div>
  );
}

// ─── CEU Renewal Exam Page ────────────────────────────────────────────────────

function CeuPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnType = searchParams.get("type");
  const justPaid = returnType === "paid";

  const { setFinalExamResult } = useCompletion();
  const [accessChecked, setAccessChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [renewedUntil, setRenewedUntil] = useState<string | null>(null);
  const [ceuCertificateId, setCeuCertificateId] = useState<string | null>(null);
  const [ceuIsNew, setCeuIsNew] = useState(false);
  const [ceuIssuanceFailed, setCeuIssuanceFailed] = useState(false);

  const [showCeuNameModal, setShowCeuNameModal] = useState(false);
  const [ceuNameInput, setCeuNameInput] = useState("");
  const [ceuNameSaving, setCeuNameSaving] = useState(false);

  function handleCeuFinalExamStart() {
    const uid = user?.id;
    const stored = uid ? localStorage.getItem(`wci_cert_name_${uid}`) : null;
    if (stored) {
      setCurrentQuestionIndex(0);
      setCeuStep("final-exam");
    } else {
      setShowCeuNameModal(true);
    }
  }

  async function handleCeuNameSave() {
    const trimmed = ceuNameInput.trim();
    if (!trimmed) return;
    setCeuNameSaving(true);
    const uid = user?.id;
    if (uid) {
      localStorage.setItem(`wci_cert_name_${uid}`, trimmed);
    }
    try {
      const token = await getToken();
      const base = import.meta.env.VITE_API_URL ?? "";
      await fetch(`${base}/set-full-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: trimmed }),
      });
    } catch {
      // localStorage copy is the fallback; network failure is non-blocking
    }
    setCeuNameSaving(false);
    setShowCeuNameModal(false);
    setCurrentQuestionIndex(0);
    setCeuStep("final-exam");
  }

  useEffect(() => {
    getToken().then((token) => {
      const base = import.meta.env.VITE_API_URL ?? "";
      fetch(`${base}/my-certification`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.expiresAt)
            setExpiresAt(new Date(data.expiresAt).toLocaleDateString());
        })
        .catch(() => {});
    });
  }, [getToken]);

  useEffect(() => {
    const uid = user?.id;

    if (justPaid) {
      if (uid) {
        // Persist a user-scoped session flag so access survives navigate-away-and-back
        // while the Stripe webhook is still propagating to the DB.
        sessionStorage.setItem(`ceuSession_${uid}`, String(Date.now()));
      }
      setAllowed(true);
      setAccessChecked(true);
      return;
    }

    // Fallback: honour a fresh session flag written on the ?type=paid redirect.
    // Key is namespaced by user ID to prevent cross-user access leaks.
    if (uid) {
      try {
        const raw = sessionStorage.getItem(`ceuSession_${uid}`);
        if (raw !== null) {
          const ts = parseInt(raw, 10);
          if (!isNaN(ts) && Date.now() - ts < 60 * 60 * 1000) {
            setAllowed(true);
            setAccessChecked(true);
            return;
          }
          // Expired or malformed — remove to keep storage clean.
          sessionStorage.removeItem(`ceuSession_${uid}`);
        }
      } catch {
        // sessionStorage unavailable (e.g. private-browse storage restrictions) — fall through.
      }
    }

    getToken().then((token) => {
      const base = import.meta.env.VITE_API_URL ?? "";
      fetch(`${base}/ceu-access`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          setAllowed(!!data.allowed);
          setAccessChecked(true);
        })
        .catch(() => setAccessChecked(true));
    });
  }, [justPaid, getToken, user?.id]);

  const modules = ACTIVE_CEU_CONTENT.modules;
  const finalExamQuestions = ACTIVE_CEU_CONTENT.finalExam;

  // ── Progress persistence ────────────────────────────────────────────────────
  // Follows the same pattern as FinalExamPage (wci_final_exam_progress_${user.id}).

  type CeuStep =
    | "intro"
    | "module-reading"
    | "case-study"
    | "practical-exercise"
    | "module"
    | "final-exam-intro"
    | "final-exam"
    | "results";

  const validCeuSteps = [
    "intro", "module-reading", "case-study", "practical-exercise", "module",
    "final-exam-intro", "final-exam", "results",
  ];

  const ceuProgressKey = user?.id ? `wci_ceu_progress_${user.id}` : null;

  function loadCeuProgress(): {
    ceuStep: CeuStep;
    currentModuleIndex: number;
    currentQuestionIndex: number;
    currentCaseStudyIndex: number;
    currentCaseStudyQuestionIndex: number;
    currentExerciseIndex: number;
    moduleAnswers: (number | null)[][];
    finalExamAnswers: (number | null)[];
    caseStudyAnswers: (number | null)[][][];
    exerciseCompleted: boolean[][];
  } | null {
    if (!ceuProgressKey) return null;
    try {
      const raw = localStorage.getItem(ceuProgressKey);
      if (!raw) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p: any = JSON.parse(raw);
      if (!validCeuSteps.includes(p?.ceuStep as string)) return null;
      if (
        typeof p.currentModuleIndex !== "number" ||
        p.currentModuleIndex < 0 ||
        p.currentModuleIndex >= modules.length
      ) return null;
      if (typeof p.currentQuestionIndex !== "number") return null;
      if (typeof p.currentCaseStudyIndex !== "number") return null;
      if (typeof p.currentCaseStudyQuestionIndex !== "number") return null;
      if (
        !Array.isArray(p.moduleAnswers) ||
        p.moduleAnswers.length !== modules.length
      ) return null;
      for (let i = 0; i < modules.length; i++) {
        if (
          !Array.isArray(p.moduleAnswers[i]) ||
          p.moduleAnswers[i].length !== modules[i].questions.length
        ) return null;
      }
      if (
        !Array.isArray(p.finalExamAnswers) ||
        p.finalExamAnswers.length !== finalExamQuestions.length
      ) return null;
      // caseStudyAnswers: loose validation — must be a 3D array
      if (p.caseStudyAnswers !== undefined && !Array.isArray(p.caseStudyAnswers)) return null;
      // exerciseCompleted: loose validation — must be a 2D boolean array
      if (p.exerciseCompleted !== undefined && !Array.isArray(p.exerciseCompleted)) return null;
      if (typeof p.currentExerciseIndex !== "number") p.currentExerciseIndex = 0;
      return p;
    } catch {
      return null;
    }
  }

  function clearCeuProgress() {
    if (ceuProgressKey) localStorage.removeItem(ceuProgressKey);
  }

  const savedCeuProgress = loadCeuProgress();

  const [ceuStep, setCeuStep] = useState<CeuStep>(
    savedCeuProgress?.ceuStep ?? "intro",
  );
  const [currentModuleIndex, setCurrentModuleIndex] = useState(
    savedCeuProgress?.currentModuleIndex ?? 0,
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    savedCeuProgress?.currentQuestionIndex ?? 0,
  );
  const [moduleAnswers, setModuleAnswers] = useState<(number | null)[][]>(
    savedCeuProgress?.moduleAnswers ??
      modules.map((m) => Array(m.questions.length).fill(null)),
  );
  const [finalExamAnswers, setFinalExamAnswers] = useState<(number | null)[]>(
    savedCeuProgress?.finalExamAnswers ??
      Array(finalExamQuestions.length).fill(null),
  );
  const [finalExamPassed, setFinalExamPassed] = useState<boolean | null>(null);
  const [moduleReviewed, setModuleReviewed] = useState(false);
  const [currentCaseStudyIndex, setCurrentCaseStudyIndex] = useState(
    savedCeuProgress?.currentCaseStudyIndex ?? 0,
  );
  const [currentCaseStudyQuestionIndex, setCurrentCaseStudyQuestionIndex] = useState(
    savedCeuProgress?.currentCaseStudyQuestionIndex ?? 0,
  );
  const [caseStudyAnswers, setCaseStudyAnswers] = useState<(number | null)[][][]>(
    savedCeuProgress?.caseStudyAnswers ??
      modules.map((mod) =>
        (mod.caseStudies ?? []).map((cs) => Array(cs.questions.length).fill(null)),
      ),
  );

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
    savedCeuProgress?.currentExerciseIndex ?? 0,
  );
  const [exerciseCompleted, setExerciseCompleted] = useState<boolean[][]>(
    savedCeuProgress?.exerciseCompleted ??
      modules.map((mod) => (mod.practicalExercises ?? []).map(() => false)),
  );

  // Reset "Mark as Reviewed" gate whenever the user enters a new module reading screen.
  useEffect(() => {
    if (ceuStep === "module-reading") setModuleReviewed(false);
  }, [currentModuleIndex, ceuStep]);

  // Reset case study and exercise position when moving to a new module.
  useEffect(() => {
    setCurrentCaseStudyIndex(0);
    setCurrentCaseStudyQuestionIndex(0);
    setCurrentExerciseIndex(0);
  }, [currentModuleIndex]);

  // Persist progress whenever navigable state changes.
  // Does NOT write when ceuStep === "results" — completion clears progress explicitly.
  useEffect(() => {
    if (!ceuProgressKey || ceuStep === "results") return;
    try {
      localStorage.setItem(
        ceuProgressKey,
        JSON.stringify({
          ceuStep,
          currentModuleIndex,
          currentQuestionIndex,
          currentCaseStudyIndex,
          currentCaseStudyQuestionIndex,
          currentExerciseIndex,
          moduleAnswers,
          finalExamAnswers,
          caseStudyAnswers,
          exerciseCompleted,
        }),
      );
    } catch {
      /* quota exceeded or private-browse — fail silently */
    }
  }, [ceuStep, currentModuleIndex, currentQuestionIndex, currentCaseStudyIndex, currentCaseStudyQuestionIndex, currentExerciseIndex, moduleAnswers, finalExamAnswers, caseStudyAnswers, exerciseCompleted, ceuProgressKey]);

  if (!accessChecked) {
    return (
      <div className="exam-shell">
        <p>Loading...</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="exam-shell">
        <Link
          to="/"
          className="page-back-link"
          style={{
            display: "inline-block",
            marginBottom: "var(--sp-4)",
            color: "var(--text-secondary)",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          ← Back to Home
        </Link>
        <h1 className="page-title" style={{ marginBottom: "var(--sp-6)" }}>
          Certification Renewal (CEU)
        </h1>
        {expiresAt && (
          <p
            style={{
              fontFamily: "var(--font-ui)",
              color: "var(--color-muted)",
              marginBottom: "var(--sp-4)",
            }}
          >
            Current Expiration: {expiresAt}
          </p>
        )}
        <div
          className="info-panel info-panel--notice"
          style={{ marginTop: "var(--sp-6)" }}
        >
          Payment required to access the CEU renewal exam.
        </div>
        <div style={{ marginTop: "var(--sp-6)" }}>
          <button
            className="btn-primary"
            onClick={async () => {
              const token = await getToken();
              const base = import.meta.env.VITE_API_URL ?? "";
              const res = await fetch(`${base}/create-ceu-checkout-session`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
              });
              const text = await res.text();
              let data: any = {};
              try {
                data = JSON.parse(text);
              } catch {
                /* non-JSON error response */
              }
              if (data.url) window.location.href = data.url;
            }}
          >
            Purchase CEU Renewal
          </button>
        </div>
      </div>
    );
  }

  // ── Intro ─────────────────────────────────────────────────────────────────

  if (ceuStep === "intro") {
    return (
      <div className="ceu-intro-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>
        <h1 className="page-title" style={{ marginBottom: "var(--space-3)" }}>
          Certification Renewal
        </h1>
        {expiresAt && (
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-6)",
            }}
          >
            Current Expiration: {expiresAt}
          </p>
        )}
        <div className="info-panel" style={{ marginBottom: "var(--space-5)" }}>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--leading-normal)",
              marginBottom: "var(--space-3)",
            }}
          >
            This renewal assessment covers {modules.length} modules followed by
            a cumulative final exam. Work through each module at your own pace,
            then complete the final exam to renew your certification.
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              lineHeight: "var(--leading-normal)",
              marginBottom: "var(--space-2)",
            }}
          >
            Estimated time: 6–7 hours &nbsp;·&nbsp; Pass threshold: 80%
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              lineHeight: "var(--leading-normal)",
            }}
          >
            Includes module reading, case studies, practical written exercises, module questions, and a 20-question final exam. Your progress is saved automatically.
          </p>
        </div>
        <div className="ceu-intro-modules">
          {modules.map((mod, i) => (
            <div key={mod.id} className="ceu-intro-module-row">
              <span className="ceu-intro-module-num">{i + 1}.</span>
              <span>{mod.title}</span>
            </div>
          ))}
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setCurrentModuleIndex(0);
            setCurrentQuestionIndex(0);
            setCeuStep(modules[0]?.content ? "module-reading" : "module");
          }}
        >
          Begin Renewal →
        </button>
      </div>
    );
  }

  // ── Module reading ────────────────────────────────────────────────────────

  if (ceuStep === "module-reading") {
    const mod = modules[currentModuleIndex];

    // Parse markdown content: split on ## headings, render each section as h3 + paragraphs
    function renderModuleContent(raw: string | undefined) {
      if (!raw) return null;
      const sections = raw.split(/(?=^## )/m);
      return sections.map((section, si) => {
        const lines = section.split("\n");
        const firstLine = lines[0];
        const isHeading = firstLine.startsWith("## ");
        const heading = isHeading ? firstLine.slice(3).trim() : null;
        const body = (isHeading ? lines.slice(1) : lines).join("\n").trim();
        const paragraphs = body.split(/\n{2,}/).filter(Boolean);
        return (
          <div key={si} className="ceu-reading-section">
            {heading && <h3 className="ceu-reading-h3">{heading}</h3>}
            {paragraphs.map((para, pi) => (
              <p key={pi} className="ceu-reading-para">{para.trim()}</p>
            ))}
          </div>
        );
      });
    }

    return (
      <div className="exam-shell ceu-reading-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>
        <p className="quiz-context">
          Module {currentModuleIndex + 1} of {modules.length}
        </p>
        <h1 className="quiz-heading">{mod.title}</h1>

        {/* Long-form reading content */}
        <div className="ceu-reading-content">
          {renderModuleContent(mod.content)}
        </div>

        {/* Realistic scenario examples */}
        {mod.examples && mod.examples.length > 0 && (
          <div className="ceu-reading-examples">
            <h2 className="ceu-reading-section-title">Scenarios in Practice</h2>
            {mod.examples.map((ex, ei) => (
              <div key={ei} className="ceu-example-card">
                <p className="ceu-example-scenario">{ex.scenario}</p>
                <p className="ceu-example-explanation">{ex.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actionable guidance bullets */}
        {mod.guidance && mod.guidance.length > 0 && (
          <div className="ceu-reading-guidance">
            <h2 className="ceu-reading-section-title">Key Takeaways</h2>
            <ul className="ceu-guidance-list">
              {mod.guidance.map((item, gi) => (
                <li key={gi} className="ceu-guidance-item">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Engagement gate */}
        <div className="ceu-reading-gate">
          {!moduleReviewed ? (
            <button
              className="btn-secondary"
              onClick={() => setModuleReviewed(true)}
            >
              Mark as Reviewed
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => {
                const mod = modules[currentModuleIndex];
                if (mod.caseStudies && mod.caseStudies.length > 0) {
                  setCeuStep("case-study");
                } else if (mod.practicalExercises && mod.practicalExercises.length > 0) {
                  setCeuStep("practical-exercise");
                } else {
                  setCeuStep("module");
                }
              }}
            >
              Continue to Case Studies →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Case study screens ────────────────────────────────────────────────────

  if (ceuStep === "case-study") {
    const mod = modules[currentModuleIndex];
    const caseStudies = mod.caseStudies ?? [];
    const caseStudy = caseStudies[currentCaseStudyIndex];
    const csQs = caseStudy?.questions ?? [];
    const csAnswers = caseStudyAnswers[currentModuleIndex]?.[currentCaseStudyIndex] ?? [];

    // sentinel: when currentCaseStudyQuestionIndex === csQs.length, show explanation
    const isExplanationPhase = currentCaseStudyQuestionIndex >= csQs.length;
    const question = isExplanationPhase ? null : csQs[currentCaseStudyQuestionIndex];
    const selected = isExplanationPhase ? null : (csAnswers[currentCaseStudyQuestionIndex] ?? null);
    const isLastCsQuestion = currentCaseStudyQuestionIndex === csQs.length - 1;
    const isLastCaseStudy = currentCaseStudyIndex === caseStudies.length - 1;
    const progressPct = isExplanationPhase
      ? 100
      : Math.round((currentCaseStudyQuestionIndex / csQs.length) * 100);

    return (
      <div className="exam-shell ceu-reading-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>
        <p className="quiz-context">
          Module {currentModuleIndex + 1} of {modules.length} —{" "}
          Case Study {currentCaseStudyIndex + 1} of {caseStudies.length}
        </p>

        {/* Scenario */}
        <div className="ceu-case-scenario">
          <h2 className="ceu-case-title">Case Study</h2>
          <p className="ceu-case-text">{caseStudy?.scenario}</p>
        </div>

        {!isExplanationPhase ? (
          <>
            <div className="quiz-progress">
              <div className="quiz-progress__fill" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="quiz-counter">
              Question {currentCaseStudyQuestionIndex + 1} of {csQs.length}
            </p>

            <p className="quiz-question">{question?.question}</p>

            <div className="quiz-options">
              {question?.options.map((option, i) => (
                <button
                  key={i}
                  className={`quiz-option${selected === i ? " quiz-option--selected" : ""}`}
                  onClick={() =>
                    setCaseStudyAnswers((prev) => {
                      const next = prev.map((mArr) => mArr.map((csArr) => [...csArr]));
                      if (!next[currentModuleIndex]) return prev;
                      if (!next[currentModuleIndex][currentCaseStudyIndex]) return prev;
                      next[currentModuleIndex][currentCaseStudyIndex][currentCaseStudyQuestionIndex] = i;
                      return next;
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
                if (!isLastCsQuestion) {
                  setCurrentCaseStudyQuestionIndex((q) => q + 1);
                } else {
                  // advance to explanation phase (sentinel)
                  setCurrentCaseStudyQuestionIndex(csQs.length);
                }
              }}
            >
              {isLastCsQuestion ? "View Analysis →" : "Next Question"}
            </button>
          </>
        ) : (
          <>
            <div className="ceu-case-explanation">
              <h3 className="ceu-case-explanation-title">Analysis</h3>
              <p className="ceu-case-explanation-text">{caseStudy?.explanation}</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                if (!isLastCaseStudy) {
                  setCurrentCaseStudyIndex((i) => i + 1);
                  setCurrentCaseStudyQuestionIndex(0);
                } else {
                  setCurrentCaseStudyQuestionIndex(0);
                  const mod = modules[currentModuleIndex];
                  if (mod.practicalExercises && mod.practicalExercises.length > 0) {
                    setCeuStep("practical-exercise");
                  } else {
                    setCeuStep("module");
                  }
                }
              }}
            >
              {isLastCaseStudy ? (modules[currentModuleIndex]?.practicalExercises?.length ? "Continue to Practical Exercises →" : "Continue to Module Questions →") : "Next Case Study →"}
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Practical exercise screens ────────────────────────────────────────────

  if (ceuStep === "practical-exercise") {
    const mod = modules[currentModuleIndex];
    const exercises = mod.practicalExercises ?? [];
    const exercise = exercises[currentExerciseIndex];
    const isComplete = exerciseCompleted[currentModuleIndex]?.[currentExerciseIndex] ?? false;
    const isLastExercise = currentExerciseIndex === exercises.length - 1;

    return (
      <div className="exam-shell ceu-reading-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>
        <p className="quiz-context">
          Module {currentModuleIndex + 1} of {modules.length} —{" "}
          Practical Exercise {currentExerciseIndex + 1} of {exercises.length}
          {exercise?.estimatedMinutes ? ` · ~${exercise.estimatedMinutes} min` : ""}
        </p>
        <h1 className="quiz-heading">{exercise?.title}</h1>

        {/* Prompt */}
        <div className="ceu-exercise-prompt">
          <p className="ceu-reading-para">{exercise?.prompt}</p>
        </div>

        {/* Instructions */}
        <div className="ceu-exercise-instructions">
          <h3 className="ceu-reading-h3">Instructions</h3>
          <ol className="ceu-exercise-steps">
            {exercise?.instructions.map((step, i) => (
              <li key={i} className="ceu-exercise-step">{step}</li>
            ))}
          </ol>
        </div>

        {/* Work area note */}
        {!isComplete && (
          <div className="ceu-exercise-workspace">
            <p className="ceu-exercise-workspace-text">
              Complete this exercise using a document, notes application, or pen and paper. When you have finished your work, mark it complete to review the sample response.
            </p>
            <button
              className="btn-primary"
              onClick={() =>
                setExerciseCompleted((prev) => {
                  const next = prev.map((row) => [...row]);
                  if (next[currentModuleIndex]) {
                    next[currentModuleIndex][currentExerciseIndex] = true;
                  }
                  return next;
                })
              }
            >
              Mark as Complete
            </button>
          </div>
        )}

        {/* Sample response — shown after completion */}
        {isComplete && exercise?.sampleResponse && (
          <div className="ceu-exercise-sample">
            <h3 className="ceu-exercise-sample-title">Sample Response</h3>
            {exercise.sampleResponse.split("\n\n").map((para, i) => (
              <p key={i} className="ceu-reading-para">{para}</p>
            ))}
          </div>
        )}

        {/* Continue button — only after completion */}
        {isComplete && (
          <div className="ceu-reading-gate">
            <button
              className="btn-primary"
              onClick={() => {
                if (!isLastExercise) {
                  setCurrentExerciseIndex((i) => i + 1);
                } else {
                  setCeuStep("module");
                }
              }}
            >
              {isLastExercise ? "Continue to Module Questions →" : "Next Exercise →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Module screens ────────────────────────────────────────────────────────

  if (ceuStep === "module") {
    const mod = modules[currentModuleIndex];
    const modQuestions = mod.questions;
    const question = modQuestions[currentQuestionIndex];
    const selected = moduleAnswers[currentModuleIndex][currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === modQuestions.length - 1;
    const isLastModule = currentModuleIndex === modules.length - 1;
    const progressPct = Math.round(
      (currentQuestionIndex / modQuestions.length) * 100,
    );

    return (
      <div className="exam-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>
        <p className="quiz-context">
          Module {currentModuleIndex + 1} of {modules.length} — {mod.title}
        </p>

        <div className="quiz-progress">
          <div
            className="quiz-progress__fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="quiz-counter">
          Question {currentQuestionIndex + 1} of {modQuestions.length}
        </p>

        <p className="quiz-question">{question.question}</p>

        <div className="quiz-options">
          {question.options.map((option, i) => (
            <button
              key={i}
              className={`quiz-option${selected === i ? " quiz-option--selected" : ""}`}
              onClick={() =>
                setModuleAnswers((prev) => {
                  const next = prev.map((arr) => [...arr]);
                  next[currentModuleIndex][currentQuestionIndex] = i;
                  return next;
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
            if (!isLastQuestion) {
              setCurrentQuestionIndex((q) => q + 1);
            } else if (!isLastModule) {
              const nextIdx = currentModuleIndex + 1;
              setCurrentModuleIndex(nextIdx);
              setCurrentQuestionIndex(0);
              setCeuStep(modules[nextIdx]?.content ? "module-reading" : "module");
            } else {
              setCurrentQuestionIndex(0);
              setCeuStep("final-exam-intro");
            }
          }}
        >
          {isLastQuestion && isLastModule
            ? "Go to Final Exam →"
            : isLastQuestion
              ? "Next Module →"
              : "Next Question"}
        </button>
      </div>
    );
  }

  // ── Final exam intro ──────────────────────────────────────────────────────

  if (ceuStep === "final-exam-intro") {
    return (
      <>
      <div className="exam-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>
        <p className="quiz-context">Final Exam</p>
        <h1 className="quiz-heading">Certification Renewal (CEU)</h1>
        <div className="info-panel" style={{ marginBottom: "var(--space-6)" }}>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--leading-normal)",
              marginBottom: "var(--space-3)",
            }}
          >
            You have completed all {modules.length} modules. The final exam covers all module themes and consists of {finalExamQuestions.length} questions.
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            Pass threshold: 80% &nbsp;·&nbsp; Questions must be answered in order
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleCeuFinalExamStart}
        >
          Begin Final Exam →
        </button>
      </div>
      {showCeuNameModal && (
        <div className="name-modal-overlay">
          <div className="name-modal">
            <p className="name-modal__title">
              Enter your name for the certificate
            </p>
            <p className="name-modal__desc">
              This name will appear on your certificate exactly as entered.
            </p>
            <input
              className="name-modal__input"
              type="text"
              placeholder="Full name"
              value={ceuNameInput}
              onChange={(e) => setCeuNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCeuNameSave();
              }}
              autoFocus
            />
            <div className="name-modal__actions">
              <button
                className="btn-secondary"
                style={{ fontSize: "0.8rem" }}
                onClick={() => setShowCeuNameModal(false)}
                disabled={ceuNameSaving}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: "0.8rem" }}
                onClick={handleCeuNameSave}
                disabled={!ceuNameInput.trim() || ceuNameSaving}
              >
                {ceuNameSaving ? "Saving…" : "Continue to Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // ── Final exam ────────────────────────────────────────────────────────────

  if (ceuStep === "final-exam") {
    const question = finalExamQuestions[currentQuestionIndex];
    const selected = finalExamAnswers[currentQuestionIndex];
    const isLast = currentQuestionIndex === finalExamQuestions.length - 1;
    const progressPct = Math.round(
      (currentQuestionIndex / finalExamQuestions.length) * 100,
    );

    return (
      <div className="exam-shell">
        <Link to="/dashboard" className="page-back-link">
          ← Back to Dashboard
        </Link>
        <p className="quiz-context">CEU Final Exam</p>

        <div className="quiz-progress">
          <div
            className="quiz-progress__fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="quiz-counter">
          Question {currentQuestionIndex + 1} of {finalExamQuestions.length}
        </p>

        <p className="quiz-question">{question.question}</p>

        <div className="quiz-options">
          {question.options.map((option, i) => (
            <button
              key={i}
              className={`quiz-option${selected === i ? " quiz-option--selected" : ""}`}
              onClick={() =>
                setFinalExamAnswers((prev) => {
                  const next = [...prev];
                  next[currentQuestionIndex] = i;
                  return next;
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
            if (!isLast) {
              setCurrentQuestionIndex((q) => q + 1);
              return;
            }
            const correct = finalExamAnswers.filter(
              (a, i) => a === finalExamQuestions[i].correctIndex,
            ).length;
            const scorePassed = correct / finalExamQuestions.length >= 0.8;

            if (scorePassed && user?.id) {
              // Consume the temporary session flag and clear persisted progress.
              try { if (user?.id) sessionStorage.removeItem(`ceuSession_${user.id}`); } catch { /* ignore */ }
              clearCeuProgress();
              try {
                const storedName = localStorage.getItem(`wci_cert_name_${user.id}`);
                const token = await getToken();
                const base = import.meta.env.VITE_API_URL ?? "";
                const res = await fetch(`${base}/ceu-complete`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    clerkUserId: user.id,
                    ...(storedName ? { fullName: storedName } : {}),
                  }),
                });
                const data = await res.json().catch(() => null);
                if (res.ok && data?.success && data?.certificateId) {
                  // API confirmed the write — show pass screen.
                  setFinalExamPassed(true);
                  setRenewedUntil(data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : null);
                  setCeuCertificateId(data.certificateId);
                  if (data.isNew === true) setCeuIsNew(true);
                  setFinalExamResult("passed");
                } else {
                  // Score passed but backend did not confirm issuance.
                  setFinalExamPassed(false);
                  setCeuIssuanceFailed(true);
                }
              } catch (err) {
                console.error("Failed to record CEU renewal:", err);
                setFinalExamPassed(false);
                setCeuIssuanceFailed(true);
              }
            } else {
              setFinalExamPassed(scorePassed);
            }

            setCeuStep("results");
          }}
        >
          {isLast ? "Submit Exam" : "Next Question"}
        </button>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────

  const correct = finalExamAnswers.filter(
    (a, i) => a === finalExamQuestions[i].correctIndex,
  ).length;
  const total = finalExamQuestions.length;
  const pct = Math.round((correct / total) * 100);
  const passed = finalExamPassed === true;

  // Score was sufficient but the backend could not confirm issuance.
  if (ceuIssuanceFailed) {
    return (
      <div className="exam-shell">
        <div className="exam-results-panel" style={{ borderColor: "var(--color-error)" }}>
          <p className="results-label" style={{ color: "var(--color-error)" }}>
            Certificate Not Issued
          </p>
          <p className="results-score" style={{ color: "var(--color-error)" }}>
            {pct}%
          </p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-4)",
            }}
          >
            You scored {pct}%, but your certificate could not be issued — your CEU access may not be active or may have expired. Contact support if you believe this is an error.
          </p>
          <div className="results-actions">
            <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (passed) {
    const successMessage = ceuIsNew
      ? "Your CEU completion certificate is now available."
      : `${correct} of ${total} questions correct — your certification has been renewed.`;

    return (
      <div className="exam-shell">
        <div
          className="exam-results-panel"
          style={{ borderColor: "var(--color-gold)" }}
        >
          <p
            className="results-label"
            style={{ color: "var(--color-gold)" }}
          >
            {ceuIsNew ? "CEU Complete" : "Renewal Passed"}
          </p>
          <p className="results-score">{pct}%</p>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              marginBottom: renewedUntil ? "var(--space-2)" : "var(--space-6)",
            }}
          >
            {successMessage}
          </p>
          {renewedUntil && (
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-6)",
              }}
            >
              Your certification is now valid through {renewedUntil}.
            </p>
          )}
          <div className="results-actions">
            {ceuCertificateId && (
              <button className="btn-primary" onClick={() => navigate("/certificate")}>
                Download Certificate
              </button>
            )}
            <button
              className={ceuCertificateId ? "btn-secondary" : "btn-primary"}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-shell">
      <div className="exam-results-panel">
        <p
          className="results-label"
          style={{ color: "var(--color-error)" }}
        >
          Not Passed
        </p>
        <p
          className="results-score"
          style={{ color: "var(--color-error)" }}
        >
          {pct}%
        </p>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-4)",
          }}
        >
          {correct} of {total} correct — 80% required to pass. You can retry the final exam.
        </p>
        <div className="results-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setFinalExamAnswers(Array(finalExamQuestions.length).fill(null));
              setCurrentQuestionIndex(0);
              setFinalExamPassed(null);
              setCeuStep("final-exam");
            }}
          >
            Retry Final Exam
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function ProtectedCeu() {
  return (
    <>
      <SignedIn>
        <CeuPage />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

// ─── Certificate Page ─────────────────────────────────────────────────────────

function CertificatePage() {
  const { finalExamResult } = useCompletion();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [searchParams] = useSearchParams();
  const paramCertId = searchParams.get("certificateId");
  const [certName, setCertName] = useState<string | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  useEffect(() => {
    const uid = user?.id;
    const base = import.meta.env.VITE_API_URL ?? "";

    // If a specific certificateId was requested (e.g. from dashboard), load it via /verify.
    if (paramCertId) {
      fetch(`${base}/verify?certificateId=${encodeURIComponent(paramCertId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.certificateId) setCertificateId(data.certificateId);
          if (data?.fullName) setCertName(data.fullName);
          else {
            const local = uid ? localStorage.getItem(`wci_cert_name_${uid}`) : null;
            setCertName(local ?? user?.primaryEmailAddress?.emailAddress ?? null);
          }
        })
        .catch(() => {});
      return;
    }

    getToken().then((token) => {
      fetch(`${base}/my-certification`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.certificateId) setCertificateId(data.certificateId);
          if (data?.fullName) {
            setCertName(data.fullName);
          } else {
            const local = uid
              ? localStorage.getItem(`wci_cert_name_${uid}`)
              : null;
            setCertName(
              local ?? user?.primaryEmailAddress?.emailAddress ?? null,
            );
            if (local && data !== null) {
              fetch(`${base}/set-full-name`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ fullName: local }),
              }).catch(() => {});
            }
          }
        })
        .catch(() => {
          const local = uid
            ? localStorage.getItem(`wci_cert_name_${uid}`)
            : null;
          setCertName(local ?? user?.primaryEmailAddress?.emailAddress ?? null);
        });
    });
  }, [user, getToken, paramCertId]);

  if (finalExamResult !== "passed") return <Navigate to="/course" replace />;

  const isCeuCert = certificateId?.startsWith("WCI-CEU-") ?? false;
  const displayName =
    certName ?? user?.primaryEmailAddress?.emailAddress ?? "the participant";
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="certificate-shell">
      <div className="no-print certificate-actions">
        {isCeuCert ? (
          <Link to="/dashboard" className="btn-secondary">
            ← Back to Dashboard
          </Link>
        ) : (
          <Link to="/course" className="btn-secondary">
            ← Back to Course
          </Link>
        )}
        <button className="btn-primary" onClick={() => window.print()}>
          Download PDF
        </button>
      </div>

      <div className="certificate-document">
        <div style={{ height: "6px", background: "#1a2a4a", borderRadius: "2px 2px 0 0", marginBottom: "0" }} />
        <div className="certificate-inner">
          <img src="/shield-icon-only-main.png" alt="" style={{ height: "52px", width: "auto", marginBottom: "12px" }} />

          <p className="certificate-institute">Workplace Compliance Institute</p>

          <h1 className="certificate-heading">Certificate of Completion</h1>

          <p className="certificate-presents">This certifies that</p>

          <p className="certificate-name">{displayName}</p>

          <p className="certificate-completed-text">
            {isCeuCert
              ? "has successfully completed the continuing education renewal"
              : "has successfully completed the course"}
          </p>

          <p className="certificate-course">
            {isCeuCert ? "EEO Investigator Certification — Continuing Education Unit (CEU)" : COURSE.title}
          </p>

          <hr className="certificate-divider" />

          <p className="certificate-date">Issued {date}</p>

          {certificateId && (
            <div className="certificate-id-row">
              <div>
                <p className="certificate-id-label">Certificate ID</p>
                <p className="certificate-id-value">{certificateId}</p>
              </div>
              <div className="certificate-id-verify">
                Verify at workplacecomplianceinstitute.com/verify
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Verify Page ──────────────────────────────────────────────────────────────

type VerifyResult = {
  certificateId: string;
  fullName: string | null;
  examTitle: string;
  issuedAt: string;
  expiresAt: string;
  status: "Valid" | "Expired";
};

function VerifyPage() {
  const [searchParams] = useSearchParams();
  const paramId = searchParams.get("certificateId") ?? "";
  const [certId, setCertId] = useState(paramId);
  const [result, setResult] = useState<
    VerifyResult | "not-found" | "error" | null
  >(null);
  const [loading, setLoading] = useState(false);

  async function runVerify(id: string) {
    if (!id.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const base = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(
        `${base}/verify?certificateId=${encodeURIComponent(id.trim())}`,
      );
      if (res.status === 404) {
        setResult("not-found");
      } else if (res.ok) {
        setResult(await res.json());
      } else {
        setResult("error");
      }
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (paramId) {
      setCertId(paramId);
      runVerify(paramId);
    } else {
      setCertId("");
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    runVerify(certId);
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="verify-shell">
      <header className="catalog-header" style={{ marginBottom: "24px" }}>
        <img
          src="/shield-icon-only-main.png"
          alt="Workplace Compliance Institute"
          className="catalog-header__logo"
        />
        <div>
          <h1 className="catalog-header__name">Workplace Compliance Institute</h1>
          <p className="catalog-header__sub">Professional Certification &amp; Training</p>
        </div>
      </header>
      <Link to="/" className="page-back-link">
        ← Back to Home
      </Link>

      <div className="verify-hero">
        <h1>Verify a Certificate</h1>
        <p>
          Enter the certificate ID printed on the certificate to confirm its
          authenticity and current status.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="verify-form">
        <input
          type="text"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="Certificate ID (e.g. WCI-EEO-A7F3K9)"
          required
          className="verify-input"
        />
        <button type="submit" className="verify-submit" disabled={loading}>
          {loading ? "Checking…" : "Verify"}
        </button>
      </form>

      {result === "not-found" && (
        <div className="verify-result verify-result--invalid">
          <span className="verify-badge verify-badge--invalid">
            ✗ Certificate Not Found
          </span>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              color: "var(--color-error)",
            }}
          >
            No certificate was found with that ID. Please check that the ID is
            entered exactly as printed — it should follow the format{" "}
            <strong>WCI-EEO-XXXXXX</strong> and is case-insensitive.
          </p>
        </div>
      )}

      {result === "error" && (
        <div className="verify-result verify-result--invalid">
          <span className="verify-badge verify-badge--invalid">
            ⚠ Verification Unavailable
          </span>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              color: "var(--color-error)",
            }}
          >
            We were unable to complete the verification check. Please try again
            in a moment.
          </p>
        </div>
      )}

      {result && result !== "not-found" && result !== "error" && (
        <div
          className={`verify-result ${result.status === "Valid" ? "verify-result--valid" : "verify-result--invalid"}`}
        >
          <span
            className={`verify-badge ${result.status === "Valid" ? "verify-badge--valid" : "verify-badge--invalid"}`}
          >
            {result.status === "Valid"
              ? "✓ Valid Certificate"
              : "⚠ Expired Certificate"}
          </span>
          <table className="verify-detail-table">
            <tbody>
              <tr>
                <td>Name</td>
                <td>{result.fullName ?? "—"}</td>
              </tr>
              <tr>
                <td>Certification</td>
                <td>{result.examTitle}</td>
              </tr>
              <tr>
                <td>Certificate ID</td>
                <td>{result.certificateId}</td>
              </tr>
              <tr>
                <td>Issued</td>
                <td>{fmtDate(result.issuedAt)}</td>
              </tr>
              <tr>
                <td>Expires</td>
                <td>{fmtDate(result.expiresAt)}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td
                  style={{
                    color:
                      result.status === "Valid"
                        ? "var(--color-success)"
                        : "var(--color-error)",
                    fontWeight: 600,
                  }}
                >
                  {result.status === "Valid"
                    ? "Valid — Certification is current"
                    : "Expired — Certification is no longer active"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Checkout Pages ───────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

function CheckoutSuccessPage() {
  const { refetchPaidStatus, paid } = useCompletion();
  const { isLoaded, isSignedIn } = useUser();
  const [timedOut, setTimedOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopPolling() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    refetchPaidStatus();

    intervalRef.current = setInterval(() => {
      refetchPaidStatus();
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);

    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (paid) stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  if (paid) {
    return (
      <div className="checkout-shell">
        <h1>Payment Successful</h1>
        <p>
          Your certification purchase was confirmed. You now have full access to
          the course.
        </p>
        <Link to="/dashboard" className="btn-primary">
          Continue to Dashboard →
        </Link>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="checkout-shell">
        <h1>Payment Not Verified</h1>
        <p>
          We couldn't confirm a completed payment for this account. If you
          believe this is an error, please contact support.
        </p>
        <Link to="/" className="btn-secondary">
          Return Home →
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-shell">
      <h1>Verifying payment…</h1>
      <p>Please wait while we confirm your purchase.</p>
    </div>
  );
}

function CheckoutCancelPage() {
  return (
    <div className="checkout-shell">
      <h1>Checkout Canceled</h1>
      <p>
        Your purchase was not completed. You can try again whenever you're
        ready.
      </p>
      <Link to="/" className="btn-secondary">
        Return Home →
      </Link>
    </div>
  );
}

// ─── Guards ───────────────────────────────────────────────────────────────────

const DEV_BYPASS_PAID_GUARD = false; // TODO: remove before production

function CourseAccessGuard({ children }: { children: React.ReactNode }) {
  const { courseAccessActive, paidLoading } = useCompletion();
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  if (DEV_BYPASS_PAID_GUARD) return <>{children}</>;
  const isAdminPreview =
    localStorage.getItem("wci_admin_preview") === "1" &&
    localStorage.getItem("generatedCertification") !== null;
  if (isAdminPreview) return <>{children}</>;
  if (!clerkLoaded || !isSignedIn || paidLoading) return null;
  if (!courseAccessActive) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function CertAccessGuard({ children }: { children: React.ReactNode }) {
  const { courseAccessActive, paidLoading } = useCompletion();
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [certActive, setCertActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    getToken().then((token) => {
      const base = import.meta.env.VITE_API_URL ?? "";
      fetch(`${base}/my-certification`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setCertActive(
            !!(data?.expiresAt && new Date(data.expiresAt) > new Date()),
          );
        })
        .catch(() => setCertActive(false));
    });
  }, [clerkLoaded, isSignedIn, getToken]);

  if (DEV_BYPASS_PAID_GUARD) return <>{children}</>;
  if (!clerkLoaded || !isSignedIn || paidLoading || certActive === null)
    return null;
  if (!courseAccessActive && !certActive) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OwnedExamsGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [hasExams, setHasExams] = useState<boolean | null>(null);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    const base = import.meta.env.VITE_API_URL ?? "";
    getToken().then((token) => {
      fetch(`${base}/my-exams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((exams: ExamEntry[]) => setHasExams(exams.length > 0))
        .catch(() => setHasExams(false));
    });
  }, [clerkLoaded, isSignedIn, getToken]);

  if (!clerkLoaded || !isSignedIn || hasExams === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "40vh",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
        }}
      >
        Loading…
      </div>
    );
  }
  if (!hasExams) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedDashboard() {
  return (
    <>
      <SignedIn>
        <OwnedExamsGuard>
          <DashboardPage />
        </OwnedExamsGuard>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function ProtectedCourse() {
  return (
    <>
      <SignedIn>
        <CourseAccessGuard>
          <CoursePage />
        </CourseAccessGuard>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function ProtectedLesson() {
  return (
    <>
      <SignedIn>
        <CourseAccessGuard>
          <LessonPage />
        </CourseAccessGuard>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function ProtectedQuiz() {
  return (
    <>
      <SignedIn>
        <CourseAccessGuard>
          <QuizPage />
        </CourseAccessGuard>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function ProtectedFinalExam() {
  return (
    <>
      <SignedIn>
        <CourseAccessGuard>
          <FinalExamPage />
        </CourseAccessGuard>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function ProtectedReportBuilder() {
  return (
    <>
      <SignedIn>
        <CourseAccessGuard>
          <ReportBuilderPage />
        </CourseAccessGuard>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function ProtectedCertificate() {
  return (
    <>
      <SignedIn>
        <CertAccessGuard>
          <CertificatePage />
        </CertAccessGuard>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id ?? null;

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>(
    {},
  );
  const [finalExamResult, setFinalExamResultState] =
    useState<QuizResult | null>(null);
  const [paid, setPaidState] = useState<boolean>(false);
  const [courseAccessActive, setCourseAccessActive] = useState<boolean>(false);
  const [paidLoading, setPaidLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setCompleted(new Set());
      setQuizResults({});
      setFinalExamResultState(null);
      setPaidState(false);
      setCourseAccessActive(false);
      setPaidLoading(false);
      return;
    }
    try {
      const s = localStorage.getItem(`wci_completed_lessons_${userId}`);
      setCompleted(s ? new Set(JSON.parse(s)) : new Set());
    } catch {
      setCompleted(new Set());
    }

    try {
      const s = localStorage.getItem(`wci_quiz_results_${userId}`);
      setQuizResults(s ? JSON.parse(s) : {});
    } catch {
      setQuizResults({});
    }

    const examLocal = localStorage.getItem(`wci_final_exam_result_${userId}`);
    setFinalExamResultState(
      examLocal === "passed" || examLocal === "failed" ? examLocal : null,
    );

    const controller = new AbortController();
    loadPaidStatus(userId, controller.signal);

    const base = import.meta.env.VITE_API_URL ?? "";
    getToken({ skipCache: true })
      .then((token) => {
        if (controller.signal.aborted) return;
        return fetch(`${base}/my-certification`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.expiresAt && new Date(data.expiresAt) > new Date()) {
              setFinalExamResultState("passed");
              localStorage.setItem(`wci_final_exam_result_${userId}`, "passed");
            }
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [userId, getToken]);

  const loadPaidStatus = (uid: string, signal?: AbortSignal) => {
    const base = import.meta.env.VITE_API_URL ?? "";
    setPaidLoading(true);
    fetch(`${base}/payment-status?clerkUserId=${uid}`, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPaidState(data.paid === true);
        setCourseAccessActive(data.courseAccessActive === true);
        setPaidLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setPaidState(localStorage.getItem(`wci_paid_user_${uid}`) === "true");
        setCourseAccessActive(false);
        setPaidLoading(false);
      });
  };

  const toggle = (id: string) => {
    if (!userId) return;
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(
        `wci_completed_lessons_${userId}`,
        JSON.stringify([...next]),
      );
      return next;
    });
  };

  const setQuizResult = (sectionId: string, result: QuizResult) => {
    if (!userId) return;
    setQuizResults((prev) => {
      const next = { ...prev, [sectionId]: result };
      localStorage.setItem(`wci_quiz_results_${userId}`, JSON.stringify(next));
      return next;
    });
  };

  const setFinalExamResult = (result: QuizResult) => {
    if (!userId) return;
    localStorage.setItem(`wci_final_exam_result_${userId}`, result);
    setFinalExamResultState(result);
  };

  const refetchPaidStatus = () => {
    if (!userId) return;
    loadPaidStatus(userId);
  };

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
        courseAccessActive,
        paidLoading,
        refetchPaidStatus,
      }}
    >
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path={EEO_EXAM_PATH} element={<EeoDetailPage />} />
        <Route
          path="/sign-in/*"
          element={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "var(--sp-10)",
              }}
            >
              <div style={{ width: "fit-content" }}>
                <Link
                  to="/"
                  className="page-back-link"
                  style={{
                    display: "inline-block",
                    marginBottom: "12px",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  ← Back to Home
                </Link>
                <SignIn routing="path" path="/sign-in" />
              </div>
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "var(--sp-10)",
              }}
            >
              <div style={{ width: "fit-content" }}>
                <Link
                  to="/"
                  className="page-back-link"
                  style={{
                    display: "inline-block",
                    marginBottom: "12px",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  ← Back to Home
                </Link>
                <SignUp routing="path" path="/sign-up" />
              </div>
            </div>
          }
        />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/course" element={<ProtectedCourse />} />
        <Route path="/lesson/:id" element={<ProtectedLesson />} />
        <Route path="/quiz/:sectionId" element={<ProtectedQuiz />} />
        <Route path="/final-exam" element={<ProtectedFinalExam />} />
        <Route path="/report-builder" element={<ProtectedReportBuilder />} />
        <Route path="/certificate" element={<ProtectedCertificate />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout-cancel" element={<CheckoutCancelPage />} />
        <Route path="/ceu" element={<ProtectedCeu />} />
        <Route
          path="/admin/sign-in/*"
          element={
            <SignIn
              routing="path"
              path="/admin/sign-in"
              fallbackRedirectUrl="/admin/ai-content"
            />
          }
        />
        <Route
          path="/admin/ai-content"
          element={
            <>
              <SignedIn>
                <AdminAiContentPage />
              </SignedIn>
              <SignedOut>
                <Navigate to="/admin/sign-in" replace />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </CompletionContext.Provider>
  );
}
