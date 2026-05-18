# TraceVerse AI 🔎

**TraceVerse AI** is a step-by-step code debugger, trace visualizer, and computer science explainer designed for both students and professionals. Powered by **Groq API** (Llama-3.3-70b-versatile) and backed by a **Supabase PostgreSQL database**, it takes standard code snippets, creates high-fidelity logical step breakdowns, presents localized memory CPU trace states ("Under the Hood"), shares fun everyday analogies, highlights syntactical defects, and narrates explanations out loud.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, highlight.js, canvas-confetti, lucide-react
- **Backend:** Node.js, Express, CORS, JSON Web Tokens (JWT), bcryptjs, nodemailer
- **Database:** Supabase (PostgreSQL)
- **AI Core:** Groq API (Llama-3.3-70b-versatile)

---

## 🚀 Key Production Upgrades (Built-In)

We have upgraded TraceVerse AI with a suite of enterprise-grade features:

### 1. 🔒 Custom SMTP Authentication (Nodemailer)
*   Switched from standard Supabase Auth to a fully custom backend login system.
*   Secure local password hashing using `bcryptjs` and session signatures with custom JWT tokens.
*   OTP email verification triggered via **Nodemailer** using secure Gmail App Passwords.
*   *Zero-crash fallback:* If no SMTP is configured, it auto-spins an **Ethereal test mail system** and prints a one-click preview link in the terminal!

### 2. ⚡ Synchronized Active Line Highlighting
*   When stepping through your Call Stack frames inside the **Memory Sandbox** (right panel), the corresponding statement currently executing is visually highlighted in the left **Code Editor** in real-time.
*   Features a glowing emerald background, neon left-border card overlays, and dynamic scale animations!

### 3. 🎙️ Dual AI Speech Narrators
Located at the header of your Execution Flow cards:
*   **Narrate Flow (`🔊`):** Reads a concise, high-level control-flow brief of how the compiler interacts with the algorithmic structure.
*   **Detailed AI Tutor (`🎓`):** Speaks a full computer science tutoring lecture! Explains programming languages, parses parameters, steps line-by-line through active execution values, and reads performance optimization tips.
*   *Smart Crossfade:* Audio loops automatically terminate and bridge when toggling narrators, ensuring zero double-talk bugs.

### 4. 🗃️ Session Logs CRUD Operations
*   **Delete History Logs (Delete):** A beautiful glowing red trash can button on every log card in the history sidebar lets you securely wipe traces from the Supabase database.
*   **Instant Code Re-use (Read & Reload):** Clicking a log card instantly extracts its code snippet and refills the editing workspace! You can edit, tweak, or analyze it again in a single click.

### 5. 🔑 Enterprise Cryptographic History Locks
*   Traces and logs are locked per user. 
*   Registered session IDs require matching JWT header signatures, preventing malicious users from accessing, guessing, or viewing anyone else's history!

---

## 🚀 Getting Started

Follow these steps to set up and run the application locally on your system.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) installed.

### 2. Set Up the Supabase Database

1. Create a free account on [Supabase](https://supabase.com/).
2. Create a new project.
3. Open the **SQL Editor** in your Supabase project dashboard.
4. Execute the SQL queries inside [schema.sql](file:///d:/CodeLens%20AI/server/db/schema.sql) to create the custom auth tables, and create the master `code_analyses` table:

```sql
-- Create code analyses table
create table code_analyses (
  id uuid default gen_random_uuid() primary key,
  user_session text not null,
  language text,
  original_code text not null,
  summary text,
  steps jsonb,
  bugs jsonb,
  optimizations jsonb,
  concepts jsonb,
  flow text,
  created_at timestamp with time zone default now()
);
```

### 3. Configure Environment Variables

Create a file named `.env` in the root of this project (use our [.env.example](file:///d:/CodeLens%20AI/.env.example) template as a guide!). Fill in your respective keys:

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
PORT=5000
JWT_SECRET=some_strong_jwt_signature_secret_key
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password
```

---

## 💻 Running the App Locally

We have integrated a monorepo-style setup at the root. You don't need to boot separate terminal sessions unless you want to!

### 1. Install all dependencies (Client + Server + Root)
From the root directory, run:
```bash
npm run install-all
```

### 2. Run both the Frontend and Backend concurrently
From the root directory, run:
```bash
npm run dev
```

This single command triggers:
- The **Vite React Frontend** booting on [http://localhost:5173](http://localhost:5173)
- The **Express Backend Server** starting on [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Architecture

```
traceverse-ai/
├── client/                      # Vite React Frontend
│   ├── src/
│   │   ├── components/          # Navbar, CodeEditor, StepCard, BugCard, etc.
│   │   ├── pages/               # Home, Analyze, History, Auth
│   │   ├── hooks/               # Custom API caller hooks (useAnalyze.js)
│   │   ├── context/             # Global Session & Cache Manager (AppContext.jsx)
│   │   ├── lib/                 # Supabase configuration helper
│   │   ├── App.jsx              # Routing & Master Layout
│   │   └── main.jsx             # React Bootstrap Root
│   └── tailwind.config.js       # Custom animations, fonts, and colors
├── server/                      # Express Backend Server
│   ├── routes/                  # Express routers (/analyze, /history, /auth)
│   ├── controllers/             # Core controllers (Groq query, auth checking)
│   ├── prompts/                 # Strict LLM output system Prompts
│   ├── db/                      # PostgreSQL Custom Schemas (schema.sql)
│   ├── lib/                     # Database connector configuration
│   └── index.js                 # Server entry bootstraper
├── .env                         # Shared key configurations
├── .gitignore                   # Safe Git files exclusions rules
└── README.md                    # Project documentation (this file)
```
