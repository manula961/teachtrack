# TeachTrack — Teacher Performance & Development Tracking System

TeachTrack is a full-stack web application created for the **NEXENTIA 26 Codinex Web Development competition**. It gives teachers and school leadership one secure place to manage professional profiles, attendance, punctuality, training, certifications, lesson plans, feedback, observations, development goals, evidence, achievements, timetables, approvals, school responsibilities, and performance analytics.

TeachTrack is designed around three ideas: **Track progress, Grow professionally, Excel through recognition.** Rather than reducing teacher performance to a single score, the platform combines multiple professional indicators and turns them into understandable trends, development recommendations, follow-up actions, and recognition.

## Project objectives

The system is built to help schools:

- Maintain accurate teacher and professional-development records.
- Give teachers visibility into their own professional journey.
- Help school leaders identify strengths, development needs, and workload concerns.
- Support evidence-based observations, feedback, planning, and professional goals.
- Reduce fragmented paper and spreadsheet workflows.
- Protect sensitive information through authentication, role-based access, and database-level security.
- Celebrate teacher achievements and encourage continuous professional development.

## Core features

### Teacher profiles

TeachTrack maintains detailed teacher records containing information such as teacher ID, automatically generated teacher code, name, email, subject, department, section, teaching experience, qualifications, skills, and status. Teacher records can be searched by code, numeric ID, name, subject, department, or section.

Teacher accounts can automatically link to teacher records when the authentication email matches the teacher email, reducing manual administration and keeping teacher-specific data correctly scoped.

### Attendance and punctuality

The platform tracks attendance and punctuality as separate professional indicators. Attendance information can be reviewed individually and used in wider performance analysis. QR attendance sessions and check-ins provide a faster digital attendance workflow.

### Training and certifications

Training, professional-development activities, qualifications, certifications, and related records can be maintained in one place. Certificate expiry monitoring highlights documents that may require renewal and supports proactive professional administration.

### Feedback system

TeachTrack provides structured professional feedback linked to teacher development. Feedback contributes to broader analytics while sensitive creation and access are restricted according to user role and database security policies.

### Lesson plans and planning workflow

Teachers can maintain lesson-plan records while leadership can review planning information through controlled approval workflows. Lesson planning contributes to professional-development analytics and provides visibility into planning consistency.

### Classroom observations

The observation system supports observation records, rubric scores, reviewer notes, and follow-up actions. Observation information can be connected to development plans so that classroom evaluation leads to measurable improvement rather than ending with a score.

### Observation follow-up

Observation follow-ups can capture areas for improvement, recommended actions, deadlines, progress, and completion. This creates a continuous coaching and development process.

### Professional goals and development plans

Teachers can work with professional-development goals and plans, target dates, check-ins, progress updates, recommendations, and evidence. Goal check-ins encourage regular reflection and provide a historical view of growth.

### Evidence library with Google Drive

TeachTrack supports secure professional evidence storage through Google Drive. Evidence files are uploaded server-side so Google credentials are never exposed to the browser.

On the first evidence upload for a teacher, TeachTrack creates a dedicated Google Drive folder using that teacher's unique Teacher Code. Future uploads for the same teacher automatically reuse the existing folder. This keeps the main evidence folder organized by teacher without requiring manual folder management.

Evidence records can be opened, downloaded, and deleted from TeachTrack. Authorized deletion removes both the Drive file and its linked evidence record, preventing stale library entries. Legacy private evidence remains compatible with the existing private-storage workflow.

### Professional document vault

The Document Vault supports private professional documents with preview, replacement, version tracking, archive, and delete operations. Storage and metadata operations include compensating safeguards to reduce inconsistencies if one part of an operation fails.

### Teacher 360° view

The Teacher 360° experience consolidates important professional information such as profile data, attendance, observations, feedback, training, goals, evidence, achievements, and development progress into a single review-oriented view.

### Visual analytics

TeachTrack combines multiple professional indicators to provide understandable teacher-performance insights. Analytics include attendance, punctuality, observation performance, feedback, lesson planning, training, achievements, trend analysis, period comparison, department insights, workload views, and data-completeness information.

The system can classify trends such as **Improving**, **Stable**, and **Needs attention**, helping users focus on direction of progress instead of only current values.

### Recommended development pathway

TeachTrack can identify weaker professional indicators and provide an explainable development pathway with suggested next steps. Recommendations are intended to guide professional growth rather than automatically make employment decisions.

### Action Center and alerts

The Action Center surfaces items requiring attention, including pending approvals, expiring documents, goal deadlines, observation follow-ups, leave items, and other professional tasks. Notification preferences and read/unread state help users manage important information without searching through every module.

### Achievements and recognition

TeachTrack includes achievements, recognition cards, milestones, an Achievement Wall, and an optional leaderboard. These features are designed to celebrate professional excellence and make the system encouraging as well as analytical.

### Teacher portfolio and career history

Professional portfolios can combine achievements, evidence, development history, training, milestones, service history, qualifications, and related records into a structured view of a teacher's professional journey.

### Departments, classes, and grades

Leadership can maintain departments, school sections, classes, grades, mediums, student counts, academic years, and class-teacher assignments. Teacher search is integrated into class and department workflows to make assignments faster and less error-prone.

### School timetable

TeachTrack provides timetable management for teachers, classes, subjects, rooms, teaching periods, and substitutions. Database conflict rules help prevent teacher, class, room, and substitution clashes.

### Timetable generator

Leadership can define class-subject requirements including teacher, periods per week, room, and priority. The generator attempts to distribute lessons while preserving existing entries and avoiding known conflicts. Unscheduled requirements are shown clearly for manual review.

### Conflict detection

Conflict analysis can identify problems involving timetable entries, teacher leave, substitute assignments, duties, staff meetings, school events, and examination responsibilities. This helps management detect operational conflicts before they affect the school day.

### Leave management and approvals

Teachers can submit leave requests while authorized leadership handles review and approval. Security rules prevent teachers from escalating the status of their own leave requests. Approval workflows are also integrated with lesson planning and training where appropriate.

### School responsibilities

TeachTrack includes school events, examination responsibilities, duty rosters, staff meetings, meeting actions, service history, archives, and related administrative records. These records can participate in conflict detection and professional history.

### Mentoring and skills matrix

Mentoring pairs and mentoring sessions support collaborative teacher development. A skills matrix helps leadership understand existing expertise, identify skill gaps, find potential mentors, and plan development opportunities.

### School goals

School-wide goals can be maintained so individual professional development can be connected to wider school priorities.

### Department health and workload fairness

Management analytics provide department-level indicators and workload analysis. These views are intended to support fairer distribution of responsibilities and identify teams that may need additional support.

### Reports and presentation mode

The Report Builder supports selected reporting workflows and reusable presets. Presentation Mode provides a clean way to present important information during management meetings, teacher reviews, project demonstrations, or professional-development discussions.

### Data quality and completeness

TeachTrack includes a Data Quality Centre, completeness indicators, expiry alerts, and freshness information. These tools help users identify missing or outdated records so analytics are based on better-quality data.

### Productivity and navigation

The interface includes categorized navigation, breadcrumbs, academic-year and term context, a command palette, Quick Add, Recently Viewed, Favorites, notification controls, searchable teacher selectors, contextual help, drafts, and responsive mobile navigation.

### Progressive Web App support

TeachTrack includes a web manifest, application icons, service-worker support, install capability, connectivity awareness, and an offline fallback experience for supported browsers.

## User roles and permissions

TeachTrack uses five primary application roles.

| Role | Main responsibility |
| --- | --- |
| **Principal** | School-wide leadership, management analytics, approvals, and highest-level user-role control |
| **Vice Principal** | Operational leadership, analytics, approvals, and delegated user-role control |
| **Section Head** | Section-level review, professional oversight, and authorized analytics |
| **Reviewer** | Observation, review, and authorized professional-development workflows |
| **Teacher** | Personal professional workspace and teacher-scoped records |

The Principal can assign Principal, Vice Principal, Section Head, Reviewer, and Teacher roles. The Vice Principal can assign Section Head, Reviewer, and Teacher roles, but cannot modify Principal or Vice Principal accounts. Users cannot change their own role through the interface.

Teacher access is intentionally scoped to the teacher's own linked professional identity for protected personal workflows.

## Security architecture

TeachTrack uses layered security rather than relying on hidden navigation elements.

- **Supabase Authentication** manages authenticated sessions.
- **Role-Based Access Control** determines application permissions.
- **PostgreSQL Row Level Security** acts as the main database security boundary.
- Sensitive management pages use additional route and page-level role checks.
- Teachers cannot approve or reject their own leave requests through the protected database policy.
- Feedback creation is restricted to authorized leadership.
- Observation-score access is scoped to appropriate reviewers/leadership and the relevant teacher.
- Google Drive credentials remain server-side.
- Google Drive evidence is streamed through authenticated server routes instead of being made public.
- Private document storage uses protected storage policies.
- Session timeout awareness helps reduce risk on shared school computers.
- Audit logging records important application activity where supported.

## Google Drive evidence organization

A configured school evidence folder acts as the root. TeachTrack automatically creates and reuses per-teacher folders:

```text
TeachTrack Evidence
├── TCH-0001
│   ├── Classroom Observation Evidence.pdf
│   ├── Training Certificate.png
│   └── Lesson Planning Evidence.pdf
├── TCH-0002
│   └── Professional Development Evidence.pdf
└── TCH-0003
    └── Workshop Certificate.pdf
```

The application stores Drive identifiers and evidence metadata in Supabase while the physical evidence files remain in Google Drive. Files are not intentionally shared publicly.

## Performance model

TeachTrack's professional-performance view uses multiple indicators instead of one isolated metric. The current analytical model considers:

- Attendance
- Punctuality
- Classroom observations
- Feedback
- Lesson planning
- Training and development
- Achievements

The resulting analytics are intended to support professional reflection and leadership discussion. They are not designed as an automated employment-decision system.

## Technology stack

### Frontend

- Next.js App Router
- React
- TypeScript
- HTML and CSS

### Backend and data

- Next.js server routes
- Node.js runtime
- Supabase Authentication
- Supabase PostgreSQL
- Supabase Row Level Security
- Supabase Storage
- Google Drive API

### Interface and analytics libraries

- Recharts for charts and visual analytics
- Lucide React for interface icons
- QRCode React for QR-based functionality

### Deployment architecture

TeachTrack is designed for deployment on **Vercel** with Supabase providing cloud authentication/database services and Google Drive providing professional evidence storage. Environment secrets remain server-side and are not committed to the public repository.

## Main application areas

TeachTrack includes teacher-facing and management-oriented areas covering dashboards, teacher profiles, attendance, training, feedback, lesson plans, analytics, observations, development plans, approvals, evidence, documents, achievements, departments, classes, timetables, substitutions, leave, examinations, duties, meetings, mentoring, skills, reports, notifications, data quality, school goals, security review, and other school-development workflows.

## Typical teacher experience

A teacher can sign in, review their professional profile, view attendance and performance information, maintain planning and development records, follow goals and check-ins, review training and certifications, upload professional evidence into their own automatically organized Drive folder, review achievements and milestones, and monitor relevant alerts and recommendations.

## Typical leadership experience

Authorized school leadership can search for teachers, review professional performance, manage organizational records, process approvals, review observations and follow-ups, inspect department and workload information, manage timetables and substitutions, monitor development plans, manage evidence, review data quality, create reports, and recognize teacher achievements.

## Usage guidance

TeachTrack is intended to be used through a modern web browser. Users sign in using the appropriate teacher or management entry point. Available modules are automatically adjusted according to the authenticated user's role. Academic year and term selectors provide context for school records, while the sidebar, search, command palette, Quick Add, and dashboards provide access to the main workflows.

Teachers should use their own account for personal professional records. Leadership accounts should only be assigned to authorized school personnel. Evidence and private documents should contain appropriate school-approved material and should not be shared publicly outside the platform's intended workflows.

## Database and migration documentation

The repository contains the Supabase schema and upgrade migrations used by the final application. For a new database, migrations should be applied in the documented order, ending with the latest security and Google Drive repair migration. Existing databases should apply only migrations that have not already been installed; the base schema should not be rerun over an existing installation.

The final migration set includes support for role-based access, timetable functionality, full-school modules, workflow approvals, automatic teacher linking, competition polish, teacher sections, department/class relationships, advanced UX features, and security/Google Drive evidence repairs.

## Privacy and responsible use

Teacher professional data can be sensitive. TeachTrack therefore follows a privacy-conscious design:

- Access is authenticated and role-scoped.
- Teacher-specific records are linked to the authenticated teacher identity.
- Sensitive files are stored privately.
- Google Drive files are accessed through server-side authorization.
- Elevated keys and OAuth secrets must remain server-side.
- Public demo accounts, when used for demonstration, should never be reused for a real school's production database.

## Responsive and accessible design

TeachTrack is designed for desktop, laptop, tablet, and mobile use. The interface includes responsive navigation, keyboard-accessible controls, visible focus treatment, dialog focus management, clear form labels, readable hierarchy, and mobile-friendly layouts.

## Originality and open-source credits

TeachTrack is an original individual competition project. Open-source frameworks and libraries are used as permitted by the competition rules and are credited below:

- **Next.js** — React application framework
- **React** — user-interface library
- **TypeScript** — typed JavaScript development language
- **Supabase JavaScript / SSR libraries** — authentication, database, and server integration
- **Recharts** — charting library
- **Lucide React** — icon library
- **QRCode React** — QR rendering library

Each dependency remains subject to its own license and terms.

## Competition requirement coverage

| Competition requirement | TeachTrack implementation |
| --- | --- |
| Teacher Profiles | Detailed profiles, Teacher Codes, qualifications, skills, department, section, experience, status |
| Attendance & Punctuality | Attendance records, punctuality indicators, QR attendance, trends and analytics |
| Training & Certifications | Training history, certifications, private documents, expiry monitoring |
| Feedback System | Structured professional feedback with role-based security |
| Lesson Plans | Lesson-plan records, approval workflow and analytics contribution |
| Visual Analytics | Teacher trends, 360° view, period comparison, department insights, workload and completeness analytics |
| Admin / Management Dashboard | Role-secured management workspace, approvals, user control, school records, analytics and reporting |
| Optional Gamification | Leaderboard, achievements, recognition cards, milestones and Achievement Wall |

## Project information

**Project:** TeachTrack  
**Type:** Teacher Performance & Development Tracking System  
**Competition:** NEXENTIA 26 — Codinex Web Development  
**Development model:** Individual project  
**Application architecture:** Full-stack Next.js application with Supabase and Google Drive integration

## Final note

TeachTrack is designed to make teacher development more organized, understandable, secure, and encouraging. It brings professional records, evidence, analytics, school responsibilities, development planning, and recognition together in a single platform so teachers can see their growth and leadership can support improvement with better information.
