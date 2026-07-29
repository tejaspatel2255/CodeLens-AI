# CodeLens AI 🔎

**CodeLens AI** is a full-stack AI-powered code intelligence platform for students and professionals. It provides step-by-step code analysis, an interactive memory sandbox, AI code generation, and voice narration — all backed by **Groq API** (Llama-3.3-70b-versatile) and **Supabase PostgreSQL**.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://react.dev/)
[![Groq](https://img.shields.io/badge/Groq-LLM-orange?style=flat-square)](https://console.groq.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-teal?style=flat-square&logo=supabase)](https://supabase.com/)

---

## ✨ Features & Architecture

### 🧠 Step-by-Step Code Explainer & Memory State
Paste any C, C++, Java, Python, or JavaScript code snippet to receive:
- **Execution Step Traces**: Memory allocation, call stack, CPU behavior, and relatable analogies for every single step.
- **Live Variable Memory Visualizer**: Real-time stack frame grid showing variable name/value bindings per line of execution.

### 🐛 Defect Scanner & 1-Click Fix
- Detects bugs, unexpected side-effects, and off-by-one errors.
- **1-Click Apply Fix**: Click the fix button directly inside the defect card to swap in the correction and instantly re-run the trace.

### 🧪 Automated Unit Test & Edge Case Generator
- Generates input/output boundary assertions (Standard case vs. empty/null/max edge conditions) displayed under a dedicated **Test Cases** tab panel.

### 🔀 Multi-Language Code Transpiler
- Translates source code seamlessly across C++, Java, Python, and JavaScript directly from the Code Editor toolbar without losing logic context.

### 💬 Interactive AI Chat Assistant ("Ask CodeLens AI")
- Context-aware floating chat drawer at the bottom-right for 24/7 Q&A based on the active code context.

### ⚙️ Time & Space Complexity Benchmark
- **Asymptotic Growth Metrics**: Computes $O(N)$, $O(N \log N)$, etc., and auxiliary RAM space bounds.
- Displays prominent **Time** & **Space** complexity badges at the top execution flow summary and inside a dedicated **Benchmark** dashboard tab.

### 📤 PDF Report Generator & Export

- Formats analysis results into a clean 1-page report and triggers the native browser print/PDF export dialog.

### ⚡ AI Code Generator
Describe any programming task to generate clean, production-grade code with time/space complexity metadata.

### 🗄️ Personal History & Shared Logs
- All analyses are isolated per user in Supabase.
- Supports secure public/private shareable links with ownership authorization protection.

### 🔐 Hardened Production Security
- **OTP Auth**: Powered by Brevo REST API over HTTPS (Port 443) with secure production response masking.
- **API Protection**: Express rate limiting across auth, OTP verification, and AI endpoints.
- **Error Privacy**: Abort controller timeouts map cleanly to standard `504 Gateway Timeout` responses with sanitized internal stack traces.


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
git clone https://github.com/your-username/codelens-ai.git
cd codelens-ai
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

# Required keys in `.env` (Server startup will fail if any of the mandatory 4 are missing):
GROQ_API_KEY=gsk_your_groq_api_key_here          # Mandatory
SUPABASE_URL=https://your-project.supabase.co     # Mandatory
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # Mandatory
JWT_SECRET=your_strong_secret_here                # Mandatory

# Backend server
PORT=5000


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
codelens-ai/
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

MIT License — feel free to fork, extend, and build on top of CodeLens AI.
