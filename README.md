# TraceVerse AI 🔎

**TraceVerse AI** is a full-stack AI-powered code intelligence platform for students and professionals. It provides step-by-step code analysis, an interactive memory sandbox, AI code generation, and voice narration — all backed by **Groq API** (Llama-3.3-70b-versatile) and **Supabase PostgreSQL**.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://react.dev/)
[![Groq](https://img.shields.io/badge/Groq-LLM-orange?style=flat-square)](https://console.groq.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-teal?style=flat-square&logo=supabase)](https://supabase.com/)

---

## ✨ Features

### 🧠 Analyze Code
Paste any code snippet and get a full AI-powered breakdown:
- Step-by-step execution traces with memory, CPU, and call-stack states
- Real-world analogies for every line
- Bug detection with fix suggestions
- Complexity analysis and optimization tips

### ⚡ Generate Code
Describe a programming problem with specific constraints and the AI generates:
- Fully correct, runnable code matching every constraint
- Time & Space complexity analysis
- A natural language explanation
- A "Send to Analyzer" button to trace the generated code line-by-line

### 🗄️ Personal History Archives
- All analyses are stored per-user in Supabase
- Authenticated users see **only their own data** — zero data bleed
- Guest users see 5 static example templates to explore the platform

### 🔐 Secure Authentication
- Custom OTP email verification via Nodemailer (Gmail App Passwords)
- Password hashing with `bcryptjs`
- JWT-signed session tokens with per-resource authorization checks
- Auto fallback to Ethereal test email if no SMTP is configured

### 🎙️ Voice Tutor
- AI narrates the execution flow and explains concepts aloud
- Smart crossfade between narrators — no double-talk bugs

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React |
| **Backend** | Node.js, Express, Nodemailer, bcryptjs, JSON Web Tokens |
| **Database** | Supabase (PostgreSQL) |
| **AI Core** | Groq API — Llama-3.3-70b-versatile |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A free [Groq API key](https://console.groq.com/keys)
- A free [Supabase](https://supabase.com/) project

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/traceverse-ai.git
cd traceverse-ai
```

### 2. Set up the Supabase Database

1. Create a project on [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run the schema from `server/db/schema.sql`

The main table looks like this:

```sql
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

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

**Required keys in `.env`:**

```env
# Groq AI — get your key at https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key_here

# Supabase — from Project Settings > API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Backend server
PORT=5000
JWT_SECRET=your_strong_secret_here

# Email verification (Gmail App Password)
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx

# Client (Vite)
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Token optimization (maximize free Groq tier throughput)
GROQ_MAX_TOKENS=2048
GROQ_GENERATE_REVIEW=false
```

> **Tip:** If you leave `SMTP_USER` and `SMTP_PASS` empty, the server automatically generates an [Ethereal](https://ethereal.email/) test inbox and prints a preview link in the terminal — no setup needed for local testing!

### 4. Install dependencies

```bash
npm run install-all
```

### 5. Start the app

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend** → [http://localhost:5173](http://localhost:5173)
- **Backend** → [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Structure

```
traceverse-ai/
├── client/                        # Vite + React Frontend
│   └── src/
│       ├── components/            # Navbar, CodeEditor, StepCard, BugCard, etc.
│       ├── pages/                 # Home, Analyze, Generate, History, Auth
│       ├── hooks/                 # useAnalyze.js, useGenerate.js
│       ├── context/               # AppContext — global session & history cache
│       └── App.jsx                # Routes & master layout
│
├── server/                        # Node.js + Express Backend
│   ├── controllers/               # analyzeController, generateController, authController
│   ├── routes/                    # /api/analyze, /api/generate, /api/history, /api/auth
│   ├── prompts/                   # LLM system prompts (systemPrompt, generatePrompt, codeReviewPrompt)
│   ├── lib/                       # Supabase client, Groq JSON helper, error formatter
│   ├── db/                        # schema.sql — full Supabase table definitions
│   └── index.js                   # Express server entry point
│
├── .env.example                   # Environment variable template (safe to commit)
├── .gitignore                     # Git exclusions
└── README.md                      # This file
```

---

## ⚙️ Token Optimization

The free Groq tier allows ~**6,000 tokens per minute**, giving you roughly:

| Mode | `GROQ_MAX_TOKENS` | `GROQ_GENERATE_REVIEW` | Requests/day |
|---|---|---|---|
| **High throughput** | `2048` | `false` | ~4,200 ✅ |
| **Balanced** | `4096` | `false` | ~2,100 |
| **Quality (two-pass)** | `8192` | `true` | ~430 |

Switch modes instantly by editing `server/.env` — no code changes required.

---

## 🔒 Security Notes

- **Never commit `.env` files** — they are excluded by `.gitignore`
- All user history is locked behind JWT verification — no cross-user data access
- Guest users see only static example templates, never other users' data
- Passwords are hashed with `bcryptjs` and never stored in plain text

---

## 📄 License

MIT License — feel free to fork, extend, and build on top of TraceVerse AI.
