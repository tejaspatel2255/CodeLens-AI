# CodeLens AI 🔎

**CodeLens AI** is a step-by-step code debugger, trace visualizer, and computer science explainer designed for both students and professionals. Powered by **Groq API** (Llama-3.3-70b-versatile) and backed by a **Supabase PostgreSQL database**, it takes standard code snippets, creates high-fidelity logical step breakdowns, presents localized memory CPU trace states ("Under the Hood"), shares fun everyday analogies, and highlights syntactical defects.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, highlight.js, canvas-confetti
- **Backend:** Node.js, Express, CORS
- **Database:** Supabase (PostgreSQL)
- **AI Core:** Groq API (Llama-3.3-70b-versatile)

---

## 🚀 Getting Started

Follow these steps to set up and run the application locally on your system.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) installed.

### 2. Set Up the Supabase Database

1. Create a free account on [Supabase](https://supabase.com/).
2. Create a new project.
3. Open the **SQL Editor** in your Supabase project dashboard.
4. Execute the following SQL query to create the `code_analyses` table:

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

### 3. Obtain a Free Groq API Key

1. Create a free account on [Groq Console](https://console.groq.com/).
2. Head over to **API Keys** and generate a new API key.
3. Copy this key (it starts with `gsk_`).

### 4. Configure Environment Variables

Create a file named `.env` in the root of this project (we have already created a template for you!). Fill in your respective keys:

```env
# Server Configuration
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
PORT=5000

# Client Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_API_URL=http://localhost:5000
```

> ⚠️ **IMPORTANT SECURITY NOTICE:** Never commit your `.env` file containing active API keys to public code repositories like GitHub. We have pre-configured the master [.gitignore](file:///d:/CodeLens%20AI/.gitignore) at the root to ignore `.env` files automatically. Keep this file locally on your system!

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

## 🐙 Pushing Safely to GitHub

To store, share, or version-control your CodeLens AI application on GitHub, open a terminal at the project root and run these standard commands:

### 1. Initialize local Git repository
```bash
git init
```

### 2. Add all files to staging index
*(The pre-configured `.gitignore` will automatically prevent `node_modules/`, local `.env` keys, and production builds from staging.)*
```bash
git add .
```

### 3. Commit files locally
```bash
git commit -m "feat: complete production-ready CodeLens AI with UI enhancements"
```

### 4. Link and push to your new GitHub repository
```bash
# Rename the default branch to main
git branch -M main

# Link your remote GitHub repository
git remote add origin https://github.com/your-username/codelens-ai.git

# Push to GitHub
git push -u origin main
```

---

## 📂 Project Architecture

```
codelens-ai/
├── client/                      # Vite React Frontend
│   ├── src/
│   │   ├── components/          # Navbar, CodeEditor, StepCard, BugCard, etc.
│   │   ├── pages/               # Home, Analyze, History
│   │   ├── hooks/               # Custom API caller hooks (useAnalyze.js)
│   │   ├── context/             # Global Session & Cache Manager (AppContext.jsx)
│   │   ├── lib/                 # Supabase configuration helper
│   │   ├── App.jsx              # Routing & Master Layout
│   │   └── main.jsx             # React Bootstrap Root
│   └── tailwind.config.js       # Custom animations, fonts, and colors
├── server/                      # Express Backend Server
│   ├── routes/                  # Express routers (/analyze, /history)
│   ├── controllers/             # Core controller logics (Groq query, fetch logs)
│   ├── prompts/                 # Strict LLM output system Prompts
│   ├── lib/                     # Database connector configuration
│   └── index.js                 # Server entry bootstraper
├── .env                         # Shared key configurations
├── .gitignore                   # Safe Git files exclusions rules
└── README.md                    # Project documentation (this file)
```

---

## 💎 Extra Features Built-In

1. **Syntax Highlighting:** Fully integrated with `highlight.js` using the premium Dark Tokyo Night theme to color code blocks according to the detected programming language.
2. **One-Click Sharing:** Generate instant web links like `/analyze?id=uuid-string` which auto-restores full analyses for other users directly from the database.
3. **Scroll Trace Progress Bar:** A sleek sticky status indicator tracks scroll progress through your line-by-line execution steps.
4. **Local File Ingest:** Drag and drop `.py`, `.js`, `.java`, `.cpp`, `.ts`, or `.cs` source code files directly into the editor for instant parsing.
5. **Clean Code Celebrations:** If no bugs are found in your code, CodeLens AI celebrates with animated colorful confetti bursts!
6. **Responsive Layouts:** Hand-coded responsive grid layouts for full support on tablets, phones, and high-DPI monitors.
