// Seed data for the EEO Investigator Certification builder.
// Each section owns its lessons, quiz questions, and a coverage description
// used in the final exam summary.
//
// This file is the single authoritative source for the static EEO certification
// content. Replace or extend it to change what the builder assembles.

const EEO_CERT_SEED = {
  sourceSummary:
    "Source material drawn from EEOC-enforced federal statutes: Title VII of the Civil Rights Act (1964), the Age Discrimination in Employment Act (ADEA), the Americans with Disabilities Act (ADA), the Pregnancy Discrimination Act (PDA), and the Pregnant Workers Fairness Act (PWFA). Topics include harassment, discrimination, retaliation, accommodation obligations, and complaint procedures.",
  passingScore: "80%",
  sections: [
    {
      title: "Section 1: EEO Framework & Federal Law",
      coverageDescription: "Federal EEO law overview and enforcement agencies",
      lessons: [
        {
          title: "Overview of EEO Law",
          estimatedTime: "15 minutes",
          content: [
            "The Equal Employment Opportunity (EEO) legal framework is a set of federal laws designed to protect employees and job applicants from workplace discrimination based on protected characteristics.",
            "Key statutes include Title VII of the Civil Rights Act (1964), the Age Discrimination in Employment Act (ADEA), the Americans with Disabilities Act (ADA), and the Pregnant Workers Fairness Act (PWFA).",
            "These laws apply to employers with 15 or more employees and cover all aspects of employment including hiring, promotion, pay, discipline, and termination.",
          ],
        },
        {
          title: "Role of the EEOC",
          estimatedTime: "15 minutes",
          content: [
            "The Equal Employment Opportunity Commission (EEOC) is the federal agency responsible for enforcing EEO laws in the private sector, state and local governments, and federal agencies.",
            "The EEOC investigates charges of discrimination, attempts mediation between parties, and may file lawsuits on behalf of complainants when it finds reasonable cause.",
            "Employers are required to post EEOC notices in the workplace and cooperate with EEOC investigations, including providing requested documents and permitting interviews.",
          ],
        },
        {
          title: "Employee Rights & Employer Obligations",
          estimatedTime: "15 minutes",
          content: [
            "Employees have the right to work in an environment free from discrimination, harassment, and retaliation. They may file a charge with the EEOC within 180 or 300 days of an alleged violation depending on state law.",
            "Employers are obligated to maintain written anti-discrimination policies, conduct prompt investigations of complaints, and take corrective action when violations are found.",
            "Failing to meet these obligations can result in EEOC findings of cause, monetary damages, injunctive relief, and required policy changes.",
          ],
        },
      ],
      quizQuestions: [
        { question: "Which federal agency is primarily responsible for enforcing EEO laws?", options: ["Department of Labor", "EEOC", "Department of Justice", "Office of Personnel Management"], correctIndex: 1 },
        { question: "How many employees must an employer have for Title VII to apply?", options: ["5 or more", "10 or more", "15 or more", "50 or more"], correctIndex: 2 },
        { question: "Within how many days must an employee file an EEOC charge in a state with a work-sharing agreement?", options: ["90 days", "180 days", "300 days", "365 days"], correctIndex: 2 },
        { question: "Which of the following is NOT a protected characteristic under Title VII?", options: ["Race", "Religion", "Political affiliation", "National origin"], correctIndex: 2 },
      ],
    },
    {
      title: "Section 2: Harassment in the Workplace",
      coverageDescription: "Harassment definitions, types, and employer liability",
      lessons: [
        {
          title: "Defining Harassment",
          estimatedTime: "15 minutes",
          content: [
            "Harassment is a form of employment discrimination that violates Title VII, the ADEA, and the ADA. It involves unwelcome conduct based on a protected characteristic.",
            "To be unlawful, harassment must either result in an adverse employment action (quid pro quo) or be severe or pervasive enough to create a hostile work environment.",
            "Isolated incidents, minor teasing, or offhand comments generally do not rise to the level of illegal harassment, though they may still violate company policy.",
          ],
        },
        {
          title: "Quid Pro Quo vs. Hostile Work Environment",
          estimatedTime: "20 minutes",
          content: [
            "Quid pro quo harassment occurs when a supervisor conditions an employment benefit — such as a raise, promotion, or continued employment — on an employee's submission to unwelcome conduct.",
            "A hostile work environment exists when unwelcome conduct based on a protected characteristic is so severe or pervasive that it alters the conditions of employment.",
            "Both types may involve the same underlying conduct. The distinction matters for determining employer liability: employers are strictly liable for quid pro quo harassment by supervisors.",
          ],
        },
        {
          title: "Bystander Responsibility",
          estimatedTime: "10 minutes",
          content: [
            "Bystanders — coworkers who witness harassment — play an important role in preventing and addressing misconduct. Inaction can contribute to a culture that tolerates harassment.",
            "Employees who witness harassment can intervene safely, document what they observed, or report the conduct to HR or a manager even if the target does not come forward.",
            "Organizations with active bystander training programs have lower rates of sustained harassment complaints and faster resolution times.",
          ],
        },
        {
          title: "Preventing Harassment as a Manager",
          estimatedTime: "20 minutes",
          content: [
            "Managers are responsible for maintaining a harassment-free environment in their teams. They must respond promptly to complaints or observed misconduct regardless of whether a formal complaint is filed.",
            "A manager's failure to act on known harassment may expose the employer to liability even if HR was never notified. Prompt escalation to HR is required.",
            "Managers should never discourage employees from reporting concerns and must avoid retaliating against anyone who raises a complaint in good faith.",
          ],
        },
      ],
      quizQuestions: [
        { question: "Quid pro quo harassment requires the harasser to be:", options: ["A coworker", "A supervisor", "A client", "Any employee"], correctIndex: 1 },
        { question: "For a hostile work environment claim, conduct must be:", options: ["Physical only", "Intentional only", "Severe or pervasive", "Reported to HR first"], correctIndex: 2 },
        { question: "Which Supreme Court case established employer liability standards for supervisor harassment?", options: ["McDonnell Douglas v. Green", "Burlington Industries v. Ellerth", "Bostock v. Clayton County", "Groff v. DeJoy"], correctIndex: 1 },
        { question: "A manager who witnesses harassment and takes no action:", options: ["Is not liable if HR was not notified", "May expose the employer to liability", "Is only liable if the conduct was physical", "Has no obligation unless the victim complains"], correctIndex: 1 },
        { question: "Bystander intervention is best described as:", options: ["Mandatory reporting by law", "Encouraged but legally irrelevant", "A way employees can help prevent harassment", "Only appropriate for managers"], correctIndex: 2 },
      ],
    },
    {
      title: "Section 3: Discrimination & Protected Classes",
      coverageDescription: "Protected classes and forms of discrimination",
      lessons: [
        {
          title: "Protected Classes Under Title VII",
          estimatedTime: "15 minutes",
          content: [
            "Title VII prohibits discrimination based on race, color, religion, sex, and national origin. Subsequent laws extended protections to age (ADEA), disability (ADA), and pregnancy (PDA/PWFA).",
            "The Supreme Court's decision in Bostock v. Clayton County (2020) held that Title VII's prohibition on sex discrimination includes discrimination based on sexual orientation and gender identity.",
            "Employers may not use protected characteristics as a factor in any employment decision, including hiring, pay, assignments, promotions, discipline, or termination.",
          ],
        },
        {
          title: "Recognizing Disparate Treatment",
          estimatedTime: "20 minutes",
          content: [
            "Disparate treatment is intentional discrimination — treating an employee less favorably because of a protected characteristic compared to similarly situated employees outside that class.",
            "Evidence may be direct (a discriminatory statement) or circumstantial. In most cases, complainants use the McDonnell Douglas burden-shifting framework to establish an inference of discrimination.",
            "Investigators look for comparator evidence: were employees in similar roles with similar performance records treated differently based on a protected characteristic?",
          ],
        },
        {
          title: "Disparate Impact & Neutral Policies",
          estimatedTime: "20 minutes",
          content: [
            "Disparate impact occurs when a facially neutral policy or practice disproportionately excludes or harms members of a protected class, even without discriminatory intent.",
            "Employers may defend a disparate impact claim by demonstrating the practice is job-related and consistent with business necessity. Complainants may still prevail by showing a less discriminatory alternative exists.",
            "Common examples include hiring tests, educational requirements, and physical standards that screen out protected groups at higher rates without a validated business justification.",
          ],
        },
        {
          title: "Age & Disability Discrimination",
          estimatedTime: "20 minutes",
          content: [
            "The ADEA prohibits discrimination against employees and applicants 40 years of age or older. Employers may not use age as a factor in layoffs, promotions, or hiring decisions.",
            "The ADA prohibits discrimination against qualified individuals with disabilities and requires employers to provide reasonable accommodations unless doing so causes undue hardship.",
            "A disability under the ADA is a physical or mental impairment that substantially limits a major life activity. The definition is interpreted broadly following the ADA Amendments Act of 2008.",
          ],
        },
      ],
      quizQuestions: [
        { question: "The Supreme Court's Bostock decision extended Title VII protections to:", options: ["Age and disability", "Sexual orientation and gender identity", "Political beliefs", "Immigration status"], correctIndex: 1 },
        { question: "Disparate treatment requires proof of:", options: ["Intentional discrimination", "A neutral policy with adverse impact", "A written discriminatory policy", "Economic harm only"], correctIndex: 0 },
        { question: "The ADEA protects employees who are:", options: ["Under 40", "40 or older", "50 or older", "Any age"], correctIndex: 1 },
        { question: "A neutral hiring test that disproportionately excludes a protected group is an example of:", options: ["Disparate treatment", "Quid pro quo harassment", "Disparate impact", "Retaliation"], correctIndex: 2 },
        { question: "The ADA definition of disability was expanded by:", options: ["The PWFA (2023)", "The ADA Amendments Act of 2008", "Bostock v. Clayton County", "The PDA"], correctIndex: 1 },
      ],
    },
    {
      title: "Section 4: Reasonable Accommodation",
      coverageDescription: "Accommodation obligations and the interactive process",
      lessons: [
        {
          title: "What Is a Reasonable Accommodation?",
          estimatedTime: "15 minutes",
          content: [
            "A reasonable accommodation is any modification to a job, work environment, or the way work is performed that enables a qualified person with a disability to enjoy equal employment opportunities.",
            "Examples include modified schedules, remote work, assistive technology, reassignment to a vacant position, and adjustments to training materials or testing procedures.",
            "Accommodations are also required for sincerely held religious beliefs and practices under Title VII, and for pregnancy-related conditions under the PWFA.",
          ],
        },
        {
          title: "The Interactive Process",
          estimatedTime: "20 minutes",
          content: [
            "When an employee requests an accommodation, employers are required to engage in a good-faith interactive process — a dialogue to identify the employee's limitations and explore effective accommodations.",
            "The interactive process does not require the employer to accept the employee's preferred accommodation; it requires genuine consideration of effective alternatives.",
            "Failing to engage in the interactive process, or ending it prematurely, can itself constitute a violation of the ADA even if a reasonable accommodation would have been difficult to identify.",
          ],
        },
        {
          title: "Undue Hardship Analysis",
          estimatedTime: "15 minutes",
          content: [
            "An employer may deny a requested accommodation if it would impose an undue hardship — a significant difficulty or expense — considering the nature of the business, its financial resources, and the impact on operations.",
            "Undue hardship is a high bar. Cost alone is rarely sufficient; employers must assess available tax credits, external funding, and whether the hardship can be reduced through alternative accommodations.",
            "For religious accommodations, the Supreme Court raised the standard in Groff v. DeJoy (2023): employers must show substantial increased costs in the conduct of their business to establish undue hardship.",
          ],
        },
      ],
      quizQuestions: [
        { question: "An employer's obligation when receiving an accommodation request is to:", options: ["Grant it immediately", "Deny it if costly", "Engage in the interactive process", "Require medical documentation only"], correctIndex: 2 },
        { question: "Which of the following is NOT typically a reasonable accommodation?", options: ["Modified schedule", "Reassignment to a vacant position", "Eliminating an essential job function", "Assistive technology"], correctIndex: 2 },
        { question: "Under Groff v. DeJoy, an employer may deny a religious accommodation if it causes:", options: ["Any inconvenience", "Minor scheduling difficulty", "Substantial increased costs to the business", "Employee dissatisfaction"], correctIndex: 2 },
        { question: "Ending the interactive process prematurely:", options: ["Is acceptable if the employee stops responding", "Can itself constitute an ADA violation", "Relieves the employer of liability", "Is required after 30 days"], correctIndex: 1 },
      ],
    },
    {
      title: "Section 5: Retaliation & Whistleblower Protections",
      coverageDescription: "Retaliation and protected activity",
      lessons: [
        {
          title: "What Constitutes Retaliation",
          estimatedTime: "20 minutes",
          content: [
            "Retaliation occurs when an employer takes a materially adverse action against an employee because they engaged in protected activity, such as filing a complaint, cooperating with an investigation, or opposing discriminatory practices.",
            "Materially adverse actions include termination, demotion, pay cuts, schedule changes, negative performance reviews, and increased scrutiny — anything that would deter a reasonable person from making or supporting a complaint.",
            "Retaliation claims are among the most frequently filed charges with the EEOC and are actionable even when the underlying discrimination claim is not proven.",
          ],
        },
        {
          title: "Protected Activity & Reporting",
          estimatedTime: "15 minutes",
          content: [
            "Protected activity includes both 'opposition' (objecting to discriminatory practices) and 'participation' (filing a charge, testifying, or cooperating in an investigation). Both forms are protected from retaliation.",
            "The complaint does not need to be formal or legally precise to qualify as protected activity. An informal complaint to a manager or HR is sufficient if it raises concern about conduct prohibited by EEO law.",
            "Employers must maintain clear reporting channels, protect the confidentiality of complainants to the extent possible, and ensure that no adverse action follows a complaint within a suspicious timeframe.",
          ],
        },
      ],
      quizQuestions: [
        { question: "Retaliation is actionable even when:", options: ["The employer intended no harm", "The underlying discrimination claim is not proven", "The adverse action was minor", "HR was not involved"], correctIndex: 1 },
        { question: "Which of the following qualifies as protected activity?", options: ["Refusing a work assignment for personal reasons", "Informally complaining to a manager about discriminatory conduct", "Requesting a raise", "Calling in sick"], correctIndex: 1 },
        { question: "A 'materially adverse action' in a retaliation claim is defined as:", options: ["Any change in job duties", "Anything that would deter a reasonable person from complaining", "Only termination or demotion", "Actions affecting pay only"], correctIndex: 1 },
      ],
    },
    {
      title: "Section 6: Investigation & Reporting Procedures",
      coverageDescription: "Complaint procedures and investigation responsibilities",
      lessons: [
        {
          title: "How to Report a Complaint",
          estimatedTime: "10 minutes",
          content: [
            "Employees may report concerns internally through HR, a designated EEO officer, or a manager outside the chain of command. Employers should provide multiple reporting channels to reduce barriers.",
            "Externally, employees may file a charge with the EEOC within 180 days of the alleged violation (or 300 days if a state agency has a work-sharing agreement). Filing is a prerequisite to a federal lawsuit.",
            "Employers must post EEOC notices informing employees of their right to file charges and must not discourage or penalize employees who exercise that right.",
          ],
        },
        {
          title: "Conducting a Workplace Investigation",
          estimatedTime: "25 minutes",
          content: [
            "A prompt, thorough, and impartial investigation is the employer's primary defense against liability. The investigator must have no conflict of interest and must treat all parties with respect.",
            "The investigation should include interviews of the complainant, the respondent, and relevant witnesses; a review of documentary evidence; and a credibility assessment based on consistency, corroboration, and motive.",
            "Confidentiality should be maintained to the extent practicable, but absolute confidentiality cannot be promised. All participants should be reminded of the anti-retaliation policy.",
          ],
        },
        {
          title: "Documenting Findings & Next Steps",
          estimatedTime: "20 minutes",
          content: [
            "The investigator should prepare a written report summarizing the allegations, the evidence reviewed, credibility determinations, and a finding as to whether a policy violation occurred.",
            "If a violation is found, the employer must take prompt corrective action proportional to the severity of the conduct. Discipline, training, policy changes, or termination may be appropriate.",
            "All investigation records should be retained in a secure file separate from the employee's personnel file. Retention periods vary by jurisdiction but a minimum of three years is recommended.",
          ],
        },
      ],
      quizQuestions: [
        { question: "The investigation report should include:", options: ["Only the complainant's account", "Allegations, evidence reviewed, credibility findings, and a conclusion", "HR's recommendation only", "A summary of disciplinary history"], correctIndex: 1 },
        { question: "Investigation records should be stored:", options: ["In the respondent's personnel file", "Destroyed after the investigation closes", "In a secure file separate from personnel files", "Shared with all employees for transparency"], correctIndex: 2 },
        { question: "Prompt corrective action after a founded complaint should be:", options: ["Always termination", "Proportional to the severity of the conduct", "Deferred pending an external investigation", "Limited to verbal warnings"], correctIndex: 1 },
        { question: "Absolute confidentiality during an investigation:", options: ["Is required by the EEOC", "Can always be guaranteed to witnesses", "Cannot be promised but should be maintained as much as practicable", "Is only required for the complainant"], correctIndex: 2 },
      ],
    },
  ],
  examples: [
    { title: "Hostile Work Environment", scenario: "A supervisor regularly makes comments about a female employee's appearance in front of coworkers, creating an atmosphere she feels she cannot escape." },
    { title: "Disability Accommodation Request", scenario: "An employee with a chronic back condition requests a standing desk. The employer denies the request without engaging in an interactive process." },
    { title: "Retaliation After Complaint", scenario: "An employee files an internal harassment complaint. Two weeks later, she is transferred to a less desirable shift with no performance-related justification." },
    { title: "Age-Based Hiring Bias", scenario: "A hiring manager remarks that a candidate 'might not keep up with the pace' after reviewing their graduation year, and does not advance them without documented justification." },
  ],
  finalExamQuestions: [
    { question: "Which federal agency is the primary enforcement body for EEO laws?", options: ["Department of Labor", "EEOC", "Department of Justice", "Office of Personnel Management"], correctIndex: 1 },
    { question: "Title VII of the Civil Rights Act of 1964 prohibits discrimination based on all of the following EXCEPT:", options: ["Race", "National origin", "Political affiliation", "Religion"], correctIndex: 2 },
    { question: "The burden-shifting framework for disparate treatment claims was established in:", options: ["Harris v. Forklift Systems", "McDonnell Douglas Corp. v. Green", "Meritor Savings Bank v. Vinson", "Burlington Industries v. Ellerth"], correctIndex: 1 },
    { question: "For a hostile work environment claim, the conduct must be:", options: ["Physical and intentional", "Reported to HR first", "Both subjectively and objectively offensive", "Committed only by a supervisor"], correctIndex: 2 },
    { question: "The Supreme Court's Bostock v. Clayton County decision extended Title VII protections to:", options: ["Age and disability", "Sexual orientation and gender identity", "Political beliefs", "Immigration status"], correctIndex: 1 },
    { question: "Quid pro quo harassment occurs when:", options: ["A coworker makes offensive jokes", "A supervisor conditions a job benefit on submission to unwelcome conduct", "An employer applies a neutral policy with disparate impact", "An employee is denied a reasonable accommodation"], correctIndex: 1 },
    { question: "Disparate impact occurs when:", options: ["An employer intentionally treats employees differently based on race", "A facially neutral policy disproportionately excludes a protected class", "A supervisor retaliates against a complainant", "An employer fails to engage in the interactive process"], correctIndex: 1 },
    { question: "The ADEA protects employees who are:", options: ["Under 40", "40 or older", "50 or older", "Any age"], correctIndex: 1 },
    { question: "Under the ADA, a reasonable accommodation must be provided unless it:", options: ["Is requested verbally", "Costs more than $500", "Causes undue hardship", "Requires supervisor approval"], correctIndex: 2 },
    { question: "The interactive process under the ADA requires:", options: ["The employer to grant the first accommodation requested", "A good-faith dialogue to identify effective accommodations", "HR approval before any discussion begins", "A written request from the employee's physician"], correctIndex: 1 },
    { question: "Following Groff v. DeJoy, an employer may deny a religious accommodation if it causes:", options: ["Any inconvenience", "Minor scheduling difficulty", "Substantial increased costs to the business", "Employee complaints"], correctIndex: 2 },
    { question: "Which of the following qualifies as protected activity under EEO law?", options: ["Refusing a work assignment for personal reasons", "Informally complaining to a manager about discriminatory conduct", "Requesting a pay raise", "Taking unscheduled leave"], correctIndex: 1 },
    { question: "Retaliation is actionable even when:", options: ["The employer acted in good faith", "The underlying discrimination claim is not proven", "The adverse action was minor", "HR was not informed"], correctIndex: 1 },
    { question: "A materially adverse action in a retaliation claim is defined as:", options: ["Any change in job duties", "Only termination or demotion", "Anything that would deter a reasonable person from complaining", "Actions affecting pay only"], correctIndex: 2 },
    { question: "Which of the following is NOT typically considered a reasonable accommodation?", options: ["Modified work schedule", "Reassignment to a vacant position", "Eliminating an essential job function", "Assistive technology"], correctIndex: 2 },
    { question: "An EEO investigation report must include:", options: ["Only the complainant's account", "Allegations, evidence, credibility findings, and a conclusion", "HR's disciplinary recommendation only", "A summary of the respondent's personnel file"], correctIndex: 1 },
    { question: "Employer liability for a hostile work environment created by a co-worker requires:", options: ["Strict liability regardless of knowledge", "That the employer knew or should have known and failed to act", "A prior written complaint from the victim", "That the conduct was physical"], correctIndex: 1 },
    { question: "The Pregnant Workers Fairness Act (PWFA) requires accommodations for:", options: ["Only conditions that meet ADA disability standards", "Known limitations related to pregnancy, childbirth, or related medical conditions", "Employees on FMLA leave only", "Medical conditions diagnosed before hire"], correctIndex: 1 },
    { question: "Investigation records should be retained:", options: ["In the respondent's personnel file", "Destroyed once the case is closed", "In a secure file separate from personnel records", "Only if a lawsuit is filed"], correctIndex: 2 },
    { question: "Which of the following best describes disparate treatment?", options: ["A neutral policy that screens out a protected group", "Intentionally treating an employee less favorably because of a protected characteristic", "Failure to provide a reasonable accommodation", "Conduct that creates a hostile work environment"], correctIndex: 1 },
  ],
};

export { EEO_CERT_SEED };
