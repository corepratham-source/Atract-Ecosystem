const express = require("express");
const router = express.Router();
const { completeWithGroq } = require("../utils/groq");

const policyTypes = [
  { id: "leave", name: "Leave Policy", icon: "🏖️" },
  { id: "workfromhome", name: "Work from Home Policy", icon: "🏠" },
  { id: "codeofconduct", name: "Code of Conduct", icon: "📋" },
  { id: "recruitment", name: "Recruitment Policy", icon: "👥" },
  { id: "performance", name: "Performance Review Policy", icon: "📊" },
  { id: "disciplinary", name: "Disciplinary Policy", icon: "⚖️" },
  { id: "confidentiality", name: "Confidentiality Policy", icon: "🔒" },
  { id: "grievance", name: "Grievance Redressal Policy", icon: "📢" },
];

const companySizes = [
  { id: "1-20", name: "Startup", multiplier: 0.8 },
  { id: "21-100", name: "SMB", multiplier: 0.9 },
  { id: "101-500", name: "Mid-size", multiplier: 1.0 },
  { id: "500+", name: "Enterprise", multiplier: 1.2 },
];

const tones = {
  formal: { prefix: "POLICY DOCUMENT", style: "formal" },
  neutral: { prefix: "POLICY", style: "standard" },
  warm: { prefix: "Guidelines", style: "friendly" },
};

// Helper functions for policy generation
const getLeavePolicy = (form) => {
  const companySize = companySizes.find(s => s.id === form.companySize)?.name || "Company";
  const baseCL = Math.round(10 * (form.companySize === "1-20" ? 0.8 : 1));
  const baseSL = Math.round(10 * (form.companySize === "1-20" ? 0.8 : 1));
  const baseEL = Math.round(15 * (form.companySize === "1-20" ? 0.8 : 1));

  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                              LEAVE POLICY DOCUMENT
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Leave Policy
Company            : ${form.companyName || "[Company Name]"}
Company Type       : ${form.companyType || "Private Limited"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. PURPOSE
─────────────────────────────────────────────────────────────────────────────

This Leave Policy has been established to outline the guidelines, procedures,
and entitlements regarding leave for all employees of ${form.companyName || "[Company Name]"}.
This policy aims to ensure a balanced approach to employee well-being and
business continuity while maintaining transparency and fairness.

─────────────────────────────────────────────────────────────────────────────
2. SCOPE AND APPLICABILITY
─────────────────────────────────────────────────────────────────────────────

This policy applies to:
• All full-time employees of ${form.companyName || "[Company Name]"}
• All departments and locations
• ${form.location || "All locations"} based employees

This policy does not apply to:
• Contract workers (covered under separate agreement)
• Consultants and external advisors

─────────────────────────────────────────────────────────────────────────────
3. LEAVE ENTITLEMENTS
─────────────────────────────────────────────────────────────────────────────

3.1 Casual Leave (CL)
• Entitlement: ${baseCL} days per calendar year
• Accumulation: Unused CL cannot be carried forward
• Application: Minimum 1 day advance notice required
• Approval: Subject to departmental approval

3.2 Sick Leave (SL)
• Entitlement: ${baseSL} days per calendar year
• Accumulation: Can be accumulated up to ${baseSL * 2} days
• Medical Certificate: Required for absence of 3 or more consecutive days
• Notification: Inform supervisor on the first day of absence

3.3 Earned Leave (EL)
• Entitlement: ${baseEL} days per completed year of service
• Accumulation: Maximum accumulation up to ${baseEL * 2} days
• Encashment: Encashable at year end (subject to minimum balance)
• Calculation: 1.25 days earned per month of service

3.4 Public Holidays
• Fixed holidays as per ${form.location || "company"} calendar
• Typically ${Math.floor(Math.random() * 5) + 10} public holidays per year
• Optional working on holidays with double compensation

─────────────────────────────────────────────────────────────────────────────
4. LEAVE APPLICATION PROCESS
─────────────────────────────────────────────────────────────────────────────

4.1 Application Submission
• Submit leave application through HR portal/email
• Minimum notice: 2 days for planned leaves
• Same day leave: Notify before 9:00 AM

4.2 Approval Authority
• Up to 3 days: Direct Manager approval
• More than 3 days: Manager + HR approval
• More than 10 days: Management approval

4.3 Leave Cancellation
• Original application to be cancelled
• Manager notification required
• Compensatory arrangements if needed

─────────────────────────────────────────────────────────────────────────────
5. SPECIAL LEAVES
─────────────────────────────────────────────────────────────────────────────

5.1 Maternity Leave
• Entitlement: 26 weeks as per Maternity Benefit Act
• Eligibility: Minimum 80 days continuous service
• Payment: As per statutory requirements

5.2 Paternity Leave
• Entitlement: 15 days
• Eligibility: Within 6 months of child birth

5.3 Bereavement Leave
• Entitlement: 5 days for immediate family loss
• Documentation: Death certificate required

5.4 Marriage Leave
• Entitlement: 5 days
• Validity: Within 6 months of marriage

─────────────────────────────────────────────────────────────────────────────
6. GENERAL CONDITIONS
─────────────────────────────────────────────────────────────────────────────

• Leave cannot be availed for more than 10 consecutive days without HR review
• Annual leave planning to be done in Q4 for the next year
• Leave during notice period requires special approval
• Unauthorized absence: Treated as loss of pay and disciplinary action

─────────────────────────────────────────────────────────────────────────────
7. COMPLIANCE AND REVIEW
─────────────────────────────────────────────────────────────────────────────

This policy complies with:
• The Industrial Employment (Standing Orders) Act
• The Employees' State Insurance Act
• The Maternity Benefit Act
• Applicable state labor laws

Policy Review: Annually or as required by law

─────────────────────────────────────────────────────────────────────────────
8. HR CONTACT
─────────────────────────────────────────────────────────────────────────────

For queries regarding this policy, please contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const getWorkFromHomePolicy = (form) => {
  const companySize = companySizes.find(s => s.id === form.companySize)?.name || "Company";

  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                        WORK FROM HOME POLICY DOCUMENT
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Work from Home Policy
Company            : ${form.companyName || "[Company Name]"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. PURPOSE
─────────────────────────────────────────────────────────────────────────────

This Work from Home (WFH) Policy provides guidelines and framework for
employees of ${form.companyName || "[Company Name]"} to perform their work duties
remotely while maintaining productivity, collaboration, and work-life balance.

─────────────────────────────────────────────────────────────────────────────
2. POLICY OBJECTIVES
─────────────────────────────────────────────────────────────────────────────

• Enable flexible work arrangements
• Maintain business continuity
• Support employee well-being
• Ensure consistent performance delivery
• Promote trust and accountability

─────────────────────────────────────────────────────────────────────────────
3. ELIGIBILITY CRITERIA
─────────────────────────────────────────────────────────────────────────────

3.1 General Eligibility
• Completed minimum 6 months of continuous service
• Consistent performance rating of 3/5 or above
• No active disciplinary actions
• Role suitable for remote work

3.2 Role Suitability
WFH is generally suitable for:
• Software development and IT roles
• Content and creative roles
• Administrative and support functions
• Data analysis and reporting roles

─────────────────────────────────────────────────────────────────────────────
4. WORK FROM HOME SCHEDULE
─────────────────────────────────────────────────────────────────────────────

4.1 Standard Arrangement
• ${form.companySize === "1-20" ? "Up to 3 days per week" : form.companySize === "21-100" ? "Up to 4 days per week" : "Up to 2 days per week"}
• Core collaboration hours: 10:00 AM - 3:00 PM (IST)
• Minimum in-office days: As determined by team

4.2 Ad-hoc WFH
• Maximum 2 days per month
• Requires 1-day advance approval
• Not applicable during critical project phases

─────────────────────────────────────────────────────────────────────────────
5. EQUIPMENT AND INFRASTRUCTURE
─────────────────────────────────────────────────────────────────────────────

5.1 Company Provided
• Laptop/desktop as per standard configuration
• Required software and licenses
• VPN access configuration

5.2 Employee Responsibility
• Stable internet connection (minimum 10 Mbps)
• Dedicated workspace with adequate lighting
• Power backup for uninterrupted work
• Ergonomic seating arrangement

─────────────────────────────────────────────────────────────────────────────
6. COMMUNICATION AND AVAILABILITY
─────────────────────────────────────────────────────────────────────────────

6.1 Core Availability
• Online during core hours: 10:00 AM - 3:00 PM IST
• Response time: Within 30 minutes during work hours
• Phone/Video call availability for meetings

6.2 Daily Updates
• Update calendar with availability status
• Brief daily standup with team (as applicable)
• Clear out-of-office notifications

─────────────────────────────────────────────────────────────────────────────
7. DATA SECURITY AND CONFIDENTIALITY
─────────────────────────────────────────────────────────────────────────────

• Use only company-approved devices
• VPN connection mandatory for accessing company systems
• No unauthorized copying of company data
• Confidential documents to be stored on company drives only
• Webcam backgrounds should be professional
• Password protection on all devices

─────────────────────────────────────────────────────────────────────────────
8. PERFORMANCE AND PRODUCTIVITY
─────────────────────────────────────────────────────────────────────────────

• Deliverable-based performance assessment
• Weekly task completion tracking
• Monthly check-ins with manager
• Maintain or exceed productivity standards

─────────────────────────────────────────────────────────────────────────────
9. EXPENSES
─────────────────────────────────────────────────────────────────────────────

• Internet reimbursement: Up to ₹1,000/month (as applicable)
• Electricity reimbursement: Not provided
• Equipment: As per company asset policy

─────────────────────────────────────────────────────────────────────────────
10. POLICY COMPLIANCE
─────────────────────────────────────────────────────────────────────────────

Violation of this policy may result in:
• Revocation of WFH privileges
• Disciplinary action as per company policy
• Security review for data breaches

─────────────────────────────────────────────────────────────────────────────
11. HR CONTACT
────────────────────────────────────────────────────────────────────────────═

For queries regarding this policy, please contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const getCodeOfConduct = (form) => {
  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                           CODE OF CONDUCT
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Code of Conduct
Company            : ${form.companyName || "[Company Name]"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. INTRODUCTION
────────────────────────────────────────────────────────────────────────────═

${form.companyName || "[Company Name]"} is committed to maintaining the highest
standards of integrity, professionalism, and ethical conduct. This Code of
Conduct outlines the expected behavior and standards for all employees.

─────────────────────────────────────────────────────────────────────────────
2. PROFESSIONAL STANDARDS
─────────────────────────────────────────────────────────────────────────────

2.1 Workplace Behavior
• Treat all colleagues with dignity and respect
• Maintain professional language and conduct
• Be punctual and maintain regular attendance
• Dress appropriately for the workplace

2.2 Communication
• Communicate professionally in all interactions
• Listen actively and respectfully to others
• Provide clear and timely information
• Use appropriate channels for official communications

─────────────────────────────────────────────────────────────────────────────
3. INTEGRITY AND HONESTY
────────────────────────────────────────────────────────────────────────────═

• Be truthful in all professional dealings
• Report accurate information and maintain records
• Avoid conflicts of interest
• Never misrepresent or deceive

─────────────────────────────────────────────────────────────────────────────
4. CONFIDENTIALITY
─────────────────────────────────────────────────────────────────────────────

• Protect company proprietary information
• Safeguard employee and customer data
• Follow data protection guidelines
• Return all company property upon exit

─────────────────────────────────────────────────────────────────────────────
5. ANTI-HARASSMENT POLICY
────────────────────────────────────────────────────────────────────────────═

${form.companyName || "[Company Name]"} maintains a zero-tolerance policy for:
• Sexual harassment of any kind
• Bullying and intimidation
• Discriminatory behavior based on race, gender, religion, age, disability
• Any form of verbal, physical, or visual harassment

All complaints will be investigated confidentially.

─────────────────────────────────────────────────────────────────────────────
6. CONFLICT OF INTEREST
─────────────────────────────────────────────────────────────────────────────

Employees must:
• Disclose potential conflicts of interest
• Avoid situations where personal interests conflict with company interests
• Seek approval for external employment or investments
• Not accept gifts that could influence decisions

─────────────────────────────────────────────────────────────────────────────
7. SUBSTANCE ABUSE
─────────────────────────────────────────────────────────────────────────────

• Reporting to work under the influence is prohibited
• Possession or use of illegal substances is grounds for termination
• Alcohol at company events: Follow company guidelines
• Prescription medications: Inform HR if affecting work

─────────────────────────────────────────────────────────────────────────────
8. USE OF COMPANY RESOURCES
────────────────────────────────────────────────────────────────────────────═

• Use company resources responsibly and efficiently
• Company systems are for business purposes
• Personal use should be minimal and not affect productivity
• Company reserves the right to monitor resource usage

─────────────────────────────────────────────────────────────────────────────
9. COMPLIANCE WITH LAWS
─────────────────────────────────────────────────────────────────────────────

• Comply with all applicable laws and regulations
• Follow industry-specific compliance requirements
• Report any violations to appropriate authorities
• Cooperate with investigations

─────────────────────────────────────────────────────────────────────────────
10. REPORTING VIOLATIONS
─────────────────────────────────────────────────────────────────────────────

Employees should report violations to:
• Immediate supervisor
• HR Department
• Anonymous hotline (if available)

${form.companyName || "[Company Name]"} prohibits retaliation against
good-faith reporters.

─────────────────────────────────────────────────────────────────────────────
11. CONSEQUENCES
─────────────────────────────────────────────────────────────────────────────

Violations may result in:
• Verbal warning
• Written warning
• Suspension
• Termination of employment
• Legal action where applicable

─────────────────────────────────────────────────────────────────────────────
HR CONTACT
─────────────────────────────────────────────────────────────────────────────

For queries, contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const getRecruitmentPolicy = (form) => {
  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                         RECRUITMENT POLICY
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Recruitment Policy
Company            : ${form.companyName || "[Company Name]"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. PURPOSE
─────────────────────────────────────────────────────────────────────────────

This Recruitment Policy outlines the guidelines and procedures for hiring
at ${form.companyName || "[Company Name]"} to ensure fair, transparent, and
efficient recruitment practices.

─────────────────────────────────────────────────────────────────────────────
2. POLICY SCOPE
─────────────────────────────────────────────────────────────────────────────

• Applies to all permanent, contractual, and temporary hires
• Covers all departments and locations
• Includes internal and external recruitment

─────────────────────────────────────────────────────────────────────────────
3. RECRUITMENT PROCESS
─────────────────────────────────────────────────────────────────────────────

3.1 Position Request
• Department head submits hiring request
• Approval from respective authorities
• Job description finalization
• Budget confirmation

3.2 Recruitment Channels
• Company career portal
• Job boards (LinkedIn, Naukri, etc.)
• Employee referrals
• Campus recruitment
• Recruitment agencies (if required)

3.3 Screening Process
• Resume shortlisting based on criteria
• Initial HR screening call
• Technical assessment (if applicable)
• Manager/panel interviews
• Reference verification
• Final HR discussion

─────────────────────────────────────────────────────────────────────────────
4. SELECTION CRITERIA
─────────────────────────────────────────────────────────────────────────────

• Educational qualifications
• Relevant work experience
• Technical/professional skills
• Cultural fit assessment
• Values alignment

${form.companyName || "[Company Name]"} is an equal opportunity employer.

─────────────────────────────────────────────────────────────────────────────
5. INTERVIEW GUIDELINES
─────────────────────────────────────────────────────────────────────────────

• Structured interview process
• Interview scorecard completion
• Consistent questions for similar roles
• No discriminatory questions
• Panel diversity encouraged
• Feedback within 48 hours

─────────────────────────────────────────────────────────────────────────────
6. REFERENCE CHECK
─────────────────────────────────────────────────────────────────────────────

• Professional references (minimum 2)
• Employment verification
• Background check (as applicable)
• Education verification (if required)

─────────────────────────────────────────────────────────────────────────────
7. OFFER PROCESS
─────────────────────────────────────────────────────────────────────────────

• Salary approval from authorities
• Formal offer letter issuance
• Background verification initiation
• Expected response time: 5-7 working days
• Offer validity: As specified in offer letter

─────────────────────────────────────────────────────────────────────────────
8. JOINING PROCESS
─────────────────────────────────────────────────────────────────────────────

• Background verification completion
• Pre-employment medical (if applicable)
• Document collection and verification
• ID card and access creation
• Orientation program
• Role-specific training

─────────────────────────────────────────────────────────────────────────────
9. INTERNAL CANDIDATES
─────────────────────────────────────────────────────────────────────────────

• Internal job postings available
• Preference to internal candidates (subject to eligibility)
• No-relocation policy for internal transfers
• Manager approval required
• Service continuation period may apply

─────────────────────────────────────────────────────────────────────────────
10. HR CONTACT
─────────────────────────────────────────────────────────────────────────────

For queries, contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const getPerformanceReviewPolicy = (form) => {
  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                      PERFORMANCE REVIEW POLICY
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Performance Review Policy
Company            : ${form.companyName || "[Company Name]"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. PURPOSE
─────────────────────────────────────────────────────────────────────────────

This Performance Review Policy establishes a fair, transparent, and
objective system for evaluating employee performance at ${form.companyName || "[Company Name]"}.

─────────────────────────────────────────────────────────────────────────────
2. POLICY OBJECTIVES
─────────────────────────────────────────────────────────────────────────────

• Align individual goals with organizational objectives
• Identify training and development needs
• Facilitate career growth discussions
• Reward and recognize high performers
• Address performance gaps constructively

─────────────────────────────────────────────────────────────────────────────
3. REVIEW CYCLE
─────────────────────────────────────────────────────────────────────────────

3.1 Annual Review
• Conducted once per financial year
• Covers full year performance
• Linked to annual increments and bonuses

3.2 Mid-Year Review
• Conducted at mid-point of financial year
• Progress assessment and course correction
• No direct linkage to compensation

3.3 Probation Review
• End of probation period assessment
• Confirmation decision based on performance
• Feedback and development plan

─────────────────────────────────────────────────────────────────────────────
4. PERFORMANCE CRITERIA
─────────────────────────────────────────────────────────────────────────────

4.1 Core Competencies (Applicable to All)
• Quality of Work
• Productivity and Efficiency
• Communication
• Teamwork and Collaboration
• Initiative and Innovation
• Professional Conduct

4.2 Role-Specific Competencies
• Technical/professional skills
• Job knowledge
• Goal achievement
• Customer focus (if applicable)

─────────────────────────────────────────────────────────────────────────────
5. RATING SCALE
─────────────────────────────────────────────────────────────────────────────

Rating Scale (1-5):
• 5 - Exceptional: Consistently exceeds expectations
• 4 - Exceeds Expectations: Frequently exceeds expectations
• 3 - Meets Expectations: Consistently meets expectations
• 2 - Needs Improvement: Occasionally below expectations
• 1 - Unsatisfactory: Consistently below expectations

─────────────────────────────────────────────────────────────────────────────
6. REVIEW PROCESS
─────────────────────────────────────────────────────────────────────────────

6.1 Self-Assessment
• Employee completes self-evaluation
• Reflect on achievements and challenges
• Identify development areas

6.2 Manager Assessment
• Manager provides objective evaluation
• Specific examples for ratings
• Development recommendations

6.3 Calibration Session
• Department-level review meetings
• Ensure consistent standards
• Address rating disparities

6.4 Final Discussion
• One-on-one feedback session
• Goal setting for next cycle
• Development plan discussion

─────────────────────────────────────────────────────────────────────────────
7. PERFORMANCE OUTCOMES
─────────────────────────────────────────────────────────────────────────────

7.1 Rating 5 - Exceptional
• Highest increment and bonus
• Fast-track promotion consideration
• Special recognition/award

7.2 Rating 4 - Exceeds Expectations
• Above-average increment
• Bonus as per policy
• Promotion consideration

7.3 Rating 3 - Meets Expectations
• Standard increment and bonus
• Continue development plan
• Eligible for promotions

7.4 Rating 2 - Needs Improvement
• Below-average or no increment
• Performance improvement plan (PIP)
• Re-review in 3 months

7.5 Rating 1 - Unsatisfactory
• No increment or bonus
• Mandatory PIP
• Continued low performance may lead to termination

─────────────────────────────────────────────────────────────────────────────
8. CAREER DEVELOPMENT
─────────────────────────────────────────────────────────────────────────────

• Promotion opportunities based on performance
• Internal job openings - preference to high performers
• Training and development programs
• Mentorship programs
• Leadership development for high potentials

─────────────────────────────────────────────────────────────────────────────
9. HR CONTACT
─────────────────────────────────────────────────────────────────────────────

For queries, contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const getDisciplinaryPolicy = (form) => {
  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                        DISCIPLINARY POLICY
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Disciplinary Policy
Company            : ${form.companyName || "[Company Name]"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. PURPOSE
────────────────────────────────────────────────────────────────────────────═

This Disciplinary Policy establishes clear guidelines for addressing
employee misconduct and ensures fair and consistent treatment.

─────────────────────────────────────────────────────────────────────────────
2. SCOPE
─────────────────────────────────────────────────────────────────────────────

Applies to all employees of ${form.companyName || "[Company Name]"} including:
• Permanent employees
• Contractual employees
• Temporary staff

─────────────────────────────────────────────────────────────────────────────
3. DEFINITION OF MISCONDUCT
─────────────────────────────────────────────────────────────────────────────

3.1 Minor Misconduct
• Repeated tardiness (>3 occasions/month)
• Unauthorized absence from workstation
• Dress code violations
• Use of mobile phone during work hours
• Minor policy violations

3.2 Major Misconduct
• Unexcused absence (3 or more consecutive days)
• Performance issues despite PIP
• Safety violations
• Dishonesty in records
• Disrespectful behavior

3.3 Severe Misconduct
• Theft or fraud
• Harassment or discrimination
• Violence or threats
• Drug/alcohol abuse
• Gross negligence
• Breach of confidentiality
• Falsification of records
• Misrepresentation

─────────────────────────────────────────────────────────────────────────────
4. DISCIPLINARY PROCEDURE
─────────────────────────────────────────────────────────────────────────────

4.1 First Instance - Verbal Warning
• For minor misconduct
• Documented in personal file
• Clear expectation setting
• Review period: 3 months

4.2 Second Instance - Written Warning
• For repeated minor misconduct
• Formal written warning
• Copy to personal file
• Review period: 6 months

4.3 Third Instance - Final Warning
• Continued minor misconduct
• Final written warning
• Clear consequence stated
• Review period: 6 months

4.4 Severe Misconduct - Direct Action
• Immediate investigation
• May lead to suspension
• Depending on severity:
  - Demotion
  - Salary reduction
  - Termination

────────────────────────────────────────────────────────────────────────────═
5. SUSPENSION
─────────────────────────────────────────────────────────────────────────────

• May be imposed during investigation
• Maximum period: 30 days
• Paid suspension for major cases
• Employee cooperation required

─────────────────────────────────────────────────────────────────────────────
6. INVESTIGATION PROCESS
─────────────────────────────────────────────────────────────────────────────

• HR initiates investigation
• Evidence collection
• Witness statements
• Employee opportunity to respond
• Fair and impartial panel
• Documentation throughout

─────────────────────────────────────────────────────────────────────────────
7. APPEALS
─────────────────────────────────────────────────────────────────────────────

• Employee can appeal disciplinary action
• Appeal within 7 days of decision
• Higher authority reviews case
• Final decision by management

────────────────────────────────────────────────────────────────────────────═
8. TERMINATION
─────────────────────────────────────────────────────────────────────────────

Termination may result from:
• Continued poor performance after PIP
• Severe misconduct
• Accumulation of warnings
• Breach of employment contract
• Legal requirements

As per ${form.location || "applicable"} labor laws.

─────────────────────────────────────────────────────────────────────────────
9. HR CONTACT
─────────────────────────────────────────────────────────────────────────────

For queries, contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const getConfidentialityPolicy = (form) => {
  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                        CONFIDENTIALITY POLICY
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Confidentiality Policy
Company            : ${form.companyName || "[Company Name]"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. PURPOSE
─────────────────────────────────────────────────────────────────────────────

This Confidentiality Policy protects ${form.companyName || "[Company Name]"}'s
sensitive information and establishes guidelines for information security.

─────────────────────────────────────────────────────────────────────────────
2. SCOPE
─────────────────────────────────────────────────────────────────────────────

Applies to all:
• Employees
• Contractors
• Consultants
• Third parties with access to company information

─────────────────────────────────────────────────────────────────────────────
3. DEFINITION OF CONFIDENTIAL INFORMATION
─────────────────────────────────────────────────────────────────────────────

Confidential information includes:
• Business strategies and plans
• Financial data and projections
• Customer information and lists
• Vendor/supplier agreements
• Technical specifications
• Software and source code
• Marketing strategies
• Employee records
• Trade secrets
• Any information marked "Confidential"

─────────────────────────────────────────────────────────────────────────────
4. EMPLOYEE OBLIGATIONS
─────────────────────────────────────────────────────────────────────────────

4.1 During Employment
• Protect all confidential information
• Use information only for company purposes
• Follow data protection procedures
• Report security concerns immediately
• Secure all documents and files

4.2 Upon Termination
• Return all company property
• Destroy copies of confidential documents
• Return access credentials
• Maintain confidentiality of past information
• Clear personal devices of company data

─────────────────────────────────────────────────────────────────────────────
5. DATA PROTECTION GUIDELINES
─────────────────────────────────────────────────────────────────────────────

5.1 Electronic Data
• Use strong passwords
• Enable two-factor authentication
• Lock computers when away
• Don't share login credentials
• Encrypt sensitive files

5.2 Physical Documents
• Store in secure locations
• Don't leave sensitive documents visible
• Shred documents before disposal
• Limited access to physical files

5.3 Communication
• Verify recipient before sending sensitive info
• Use encrypted channels for sensitive data
• Don't discuss confidential matters publicly
• Be aware of shoulder surfing

─────────────────────────────────────────────────────────────────────────────
6. NON-DISCLOSURE AGREEMENT (NDA)
─────────────────────────────────────────────────────────────────────────────

• All employees sign NDA at joining
• Separate NDAs for special projects
• NDAs survive employment
• Legal action for breach

─────────────────────────────────────────────────────────────────────────────
7. BREACH CONSEQUENCES
─────────────────────────────────────────────────────────────────────────────

Breach of confidentiality may result in:
• Written warning
• Financial penalties
• Termination of employment
• Legal action
• Recovery of damages

─────────────────────────────────────────────────────────────────────────────
8. HR CONTACT
─────────────────────────────────────────────────────────────────────────────

For queries, contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const getGrievancePolicy = (form) => {
  return `═══════════════════════════════════════════════════════════════════════
                         ${(form.companyName || "[COMPANY NAME]").toUpperCase()}
                   GRIEVANCE REDRESSAL POLICY
═══════════════════════════════════════════════════════════════════════════════

Document Information
─────────────────────────────────────────────────────────────────────────────
Policy Name        : Grievance Redressal Policy
Company            : ${form.companyName || "[Company Name]"}
Effective Date     : ${form.effectiveDate || new Date().toLocaleDateString("en-IN")}
Prepared By        : ${form.hrName || form.hrContact || "HR Department"}
Document Version   : 1.0

─────────────────────────────────────────────────────────────────────────────
1. PURPOSE
─────────────────────────────────────────────────────────────────────────────

This Grievance Redressal Policy provides a fair, transparent, and timely
mechanism for employees to raise concerns and seek resolution.

────────────────────────────────────────────────────────────────────────────═
2. SCOPE
─────────────────────────────────────────────────────────────────────────────

Applies to all employees regarding:
• Work-related grievances
• Interpersonal conflicts
• Policy interpretation issues
• Working conditions
• Discrimination complaints
• Harassment concerns
• Any other workplace concerns

─────────────────────────────────────────────────────────────────────────────
3. GRIEVANCE CATEGORIES
─────────────────────────────────────────────────────────────────────────────

3.1 General Grievances
• Work assignments
• Working conditions
• Peer relationships
• Departmental issues

3.2 Serious Grievances
• Harassment
• Discrimination
• Victimization
• Safety concerns

─────────────────────────────────────────────────────────────────────────────
4. REDRESSAL PROCESS
─────────────────────────────────────────────────────────────────────────────

4.1 Step 1 - Direct Discussion
• Employee discusses with immediate supervisor
• Attempt informal resolution
• Timeline: 5 working days

4.2 Step 2 - Written Complaint
• If unresolved, submit written complaint
• Submit to HR Department
• Detailed description of grievance
• Supporting documents if any

4.3 Step 3 - Investigation
• HR acknowledges receipt
• Investigation within 10 working days
• Confidential and impartial process
• Evidence collection and interviews

4.4 Step 4 - Grievance Committee Review
• Committee reviews investigation
• Recommendation for resolution
• Decision communicated to employee

4.5 Step 5 - Appeal
• If unsatisfied, appeal to higher authority
• Final decision by Management
• Timeline: 15 working days

─────────────────────────────────────────────────────────────────────────────
5. TIMELINES
─────────────────────────────────────────────────────────────────────────────

• Acknowledgment: 2 working days
• Investigation: 10 working days
• Resolution: 25 working days total
• Appeal decision: 15 working days

─────────────────────────────────────────────────────────────────────────────
6. CONFIDENTIALITY
─────────────────────────────────────────────────────────────────────────────

• All grievances treated confidentially
• Identity protection maintained
• Information shared on need-to-know basis
• Retaliation strictly prohibited

─────────────────────────────────────────────────────────────────────────────
7. WHISTLEBLOWER PROTECTION
─────────────────────────────────────────────────────────────────────────────

• Good-faith reporters protected
• No retaliation for genuine complaints
• Anonymous complaints accepted
• Investigation of retaliation claims

─────────────────────────────────────────────────────────────────────────────
8. HR CONTACT
─────────────────────────────────────────────────────────────────────────────

For queries, contact:
Email: ${form.hrContact || "hr@company.com"}
Phone: [Company HR Phone]

Grievance Email: ${form.hrContact ? "grievance@" + form.hrContact.split("@")[1] : "grievance@company.com"}

═══════════════════════════════════════════════════════════════════════════════
Generated by ATRact HR Policy Builder | ${new Date().toLocaleDateString("en-IN")}
═══════════════════════════════════════════════════════════════════════════════`;
};

const policyGenerators = {
  leave: getLeavePolicy,
  workfromhome: getWorkFromHomePolicy,
  codeofconduct: getCodeOfConduct,
  recruitment: getRecruitmentPolicy,
  performance: getPerformanceReviewPolicy,
  disciplinary: getDisciplinaryPolicy,
  confidentiality: getConfidentialityPolicy,
  grievance: getGrievancePolicy,
};

router.post("/generate", async (req, res) => {
  try {
    const form = req.body;
    const policyType = form.policyType || "leave";
    
    const generator = policyGenerators[policyType];
    if (!generator) {
      return res.status(400).json({ error: "Invalid policy type" });
    }

    // Generate a strong template policy first
    const basePolicy = generator(form);

    // Try to refine using Groq so tone/structure match selected tone & company details
    let finalPolicy = basePolicy;
    try {
      const tone = form.tone || "formal";
      const toneLabel =
        tone === "warm" ? "warm and people-friendly" :
        tone === "neutral" ? "balanced and neutral" :
        "formal and compliance-focused";

      const prompt = `You are an expert HR policy writer.

Rewrite and lightly restructure the following ${policyTypes.find(p => p.id === policyType)?.name || "HR"} policy for the company "${
        form.companyName || "[Company Name]"
      }" so that it is clear, consistent, and ${toneLabel}.

RULES:
- Keep all legal and compliance clauses intact
- Preserve all headings and sections
- Do NOT shorten the document aggressively; only tighten language where helpful
- Keep the output as plain text (no Markdown, no bullets beyond simple text)

Original policy text:
${basePolicy}`;

      const aiText = await completeWithGroq(
        prompt,
        "You draft legally sound HR policies in clear plain English.",
        { max_tokens: 1600 }
      );

      if (aiText && typeof aiText === "string" && aiText.trim().length > 100) {
        finalPolicy = aiText.trim();
      }
    } catch (aiErr) {
      console.warn("Groq HR policy refinement failed, using template text:", aiErr.message);
    }
    
    res.json({ policy: finalPolicy });
  } catch (err) {
    console.error("Policy generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate policy" });
  }
});

module.exports = router;
