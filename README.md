# StudyPilot 🎓

> **AI-powered personalized study planner for smarter, more structured exam preparation.**

StudyPilot is a full-stack AI study management platform designed to help students organize subjects, topics, study materials, exams, and daily study sessions in one place.

The platform uses **Google Gemini AI** to generate personalized study schedules based on the student's exam date, available topics, previous-year questions (PYQs), notes, and extracted study material.

---

## ✨ Features

### 🤖 AI Study Plan Generation

Generate a personalized study schedule for an upcoming exam.

The AI considers:

* Exam date
* Subject
* Available topics
* Previous-year questions
* Uploaded notes
* Extracted study material
* Topic importance
* Material depth and complexity
* Available study time

Each generated task includes:

* 📅 Study date
* ⏱️ Recommended duration
* 🎯 Priority
* 📚 Topic
* 📝 Material-based subtopics

---

### 📝 Material-Aware AI

StudyPilot goes beyond simple topic-based scheduling.

Students can upload:

* **PYQs (Previous Year Questions)**
* **Notes**
* **PDF files**
* **DOCX files**
* **TXT files**

The backend extracts text from supported documents and uses the extracted content when generating AI study plans.

The AI can identify important concepts from uploaded material and use them as study subtopics.

For example:

```text
Topic: Tuples

Subtopics:
• Tuple definition and immutability
• Tuple unpacking
• Tuple slicing
• Difference between lists and tuples
```

If no relevant material exists for a topic, the system does not invent unsupported subtopics.

---

### 📄 PDF Text Extraction

StudyPilot supports server-side text extraction from uploaded study material.

Supported formats:

* PDF
* DOCX
* TXT

PDF extraction runs inside a dedicated **Node.js Worker Thread** to prevent heavy document processing from blocking the main Express server.

Extraction states include:

```text
Pending
   ↓
Processing
   ↓
Completed
```

If extraction fails:

```text
Failed
```

The system also tracks extraction errors and whether extracted content was truncated.

---

### 📚 Subjects & Topics

Students can organize their preparation using:

```text
Subject
   ├── Topic
   ├── Topic
   └── Topic
```

This structure is used throughout:

* Study planning
* Study materials
* Study Room
* Study History
* AI generation

---

### 📑 PYQs & Notes

Upload and manage study materials directly inside relevant subjects/topics.

Features include:

* Multiple-file uploads
* File validation
* Download
* Delete
* Subject association
* Topic association for notes
* Extraction status tracking

---

### ⏱️ Study Room

StudyPilot includes a dedicated Study Room for focused study sessions.

Students can:

* Select a subject
* Select a topic
* Start studying
* Track study duration
* Stop the session
* Save completed sessions

Study plans can directly navigate the student to the relevant Study Room topic.

---

### 📊 Study History

Track previously completed study sessions.

History includes:

* Subject
* Topic
* Duration
* Completion date
* Study sessions

This provides students with a simple record of their study activity.

---

### 🔐 Authentication

StudyPilot uses **Supabase Authentication**.

Authentication includes:

* Signup
* Login
* Session persistence
* Protected routes
* Logout

Unauthenticated users are redirected to the login experience.

---

### 🗄️ Secure Database

StudyPilot uses **Supabase PostgreSQL**.

The database stores:

* User profiles
* Subjects
* Topics
* Exams
* Study plans
* Study tasks
* Study sessions
* Study materials

Row Level Security (RLS) is used to ensure users can only access their own data.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      StudyPilot     │
                    │      React SPA      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Express Server   │
                    │      REST API       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌───────────┐    ┌────────────┐   ┌────────────┐
        │ Supabase  │    │  Gemini AI │   │  Storage   │
        │ PostgreSQL│    │            │   │   Bucket   │
        └───────────┘    └────────────┘   └────────────┘
                               │
                               ▼
                       ┌──────────────┐
                       │   Material   │
                       │  Extraction  │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ Node Worker  │
                       │    Thread    │
                       └──────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS
* Lucide Icons

### Backend

* Node.js
* Express
* TypeScript

### Database & Authentication

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Row Level Security

### AI

* Google Gemini API
* `@google/genai`

### Document Processing

* `pdf-parse`
* `mammoth`
* Node.js `worker_threads`

### Development Tools

* Git
* GitHub
* ESLint
* TypeScript
* Vite
* esbuild

### Deployment

* Render

---

## 📁 Project Structure

```text
StudyPilot/
│
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── MaterialManager.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── lib/
│   │   ├── apiClient.ts
│   │   └── supabase.ts
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Exams.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Settings.tsx
│   │   ├── Subjects.tsx
│   │   ├── SubjectDetail.tsx
│   │   ├── StudyHistory.tsx
│   │   ├── StudyPlan.tsx
│   │   └── StudyRoom.tsx
│   │
│   ├── server/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   │
│   ├── shared/
│   │   └── types.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── supabase/
│   └── migrations/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔄 AI Study Plan Workflow

The core StudyPilot workflow looks like this:

```text
Student creates Exam
        ↓
Selects Subject
        ↓
Adds Topics
        ↓
Uploads PYQs / Notes
        ↓
Material Extraction
        ↓
Extracted text stored securely
        ↓
Student clicks
"Generate AI Study Plan"
        ↓
Backend collects:
    • Exam information
    • Topics
    • Completed materials
    • PYQs
    • Topic notes
        ↓
Context is prepared
        ↓
Google Gemini generates plan
        ↓
AI response validated
        ↓
Study Tasks saved
        ↓
Student sees:
    • Date
    • Duration
    • Priority
    • Subtopics
        ↓
Start Studying
        ↓
Study Room
        ↓
Study Session saved
        ↓
Study History
```

---

## 🧠 AI Planning Logic

StudyPilot uses uploaded material as evidence when determining study priorities.

The AI is instructed to:

1. Give higher importance to concepts appearing repeatedly in PYQs.
2. Consider the depth and complexity of notes.
3. Allocate more time to substantial material.
4. Avoid inventing information not present in the student's materials.
5. Generate material-based subtopics where evidence exists.
6. Leave subtopics empty when no supporting material exists.
7. Respect the exam date.
8. Avoid generating tasks after the exam date.
9. Balance the student's available study time.
10. Assign priorities as:

```text
Low
Medium
High
```

---

## 🔒 Security

StudyPilot follows a backend-first approach for sensitive operations.

### Protected Secrets

The following secrets are kept server-side:

```text
GEMINI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

They are never intended to be exposed to the browser.

### Database Security

Supabase Row Level Security ensures that user-owned resources remain scoped to the authenticated user.

Material extraction and AI generation also scope database operations using the authenticated user's ID.

---

## ⚙️ Environment Variables

Create a `.env` file based on the project's environment configuration.

Typical variables include:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

> Never commit real API keys or service-role credentials to GitHub.

---

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/aman-07-codex/studypilot.git
cd studypilot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your `.env` file and provide the required Supabase and Gemini credentials.

### 4. Run the development server

```bash
npm run dev
```

The application should then be available through the local development URL shown by Vite.

---

## 🧪 Validation

Before deploying, the project can be validated using:

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

```bash
npm run build
```

All three should complete successfully before deployment.

---

## 🌐 Deployment

The application is deployed using **Render**.

The production build generates:

```text
dist/
```

The Express server serves the production application and API routes.

A typical production start command is:

```bash
npm run start
```

---

## 🗃️ Database Migrations

Database changes are maintained through Supabase migrations.

The project has progressively introduced functionality for:

* Core application schema
* Study materials
* Material extraction
* Study task subtopics

Always execute migrations in the intended order when setting up a fresh database.

---

## 🎯 Project Goals

StudyPilot was designed around a simple idea:

> **Don't just tell students what to study. Use their actual study material and exam history to help them decide what deserves their time.**

The goal is to combine:

**Planning + AI + Study Material + PYQs + Time Tracking**

into one focused study platform.

---

## 🚧 Current Scope

The current stable version focuses on:

* AI-powered study planning
* Material-aware scheduling
* PYQ analysis
* Notes integration
* Document text extraction
* AI-generated subtopics
* Study sessions
* Study history
* Exam management
* Subject/topic management
* Secure authentication

The project is considered feature-complete for its current scope.

---

## 🔮 Future Improvements

Potential future improvements include:

* More resilient AI generation/retry handling
* Advanced study analytics
* Progress visualization
* Smarter revision scheduling
* Spaced repetition
* AI-powered question explanations
* More document formats
* Improved mobile experience
* Notifications and reminders
* Offline study support

---

## 👨‍💻 Author

**Aman Mishra**

B.Tech — Information Technology
Jabalpur Engineering College

### Technologies

`C` · `Python` · `TypeScript` · `React` · `Node.js` · `Express` · `Supabase` · `PostgreSQL` · `Gemini AI`

---

## 📄 License

This project is currently maintained as a personal/academic project.

If you plan to reuse or distribute the project, please contact the author first.
