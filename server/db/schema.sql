-- Create custom users table
CREATE TABLE IF NOT EXISTS public.codelens_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create OTPs table
CREATE TABLE IF NOT EXISTS public.codelens_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable indexes for high-speed authentication lookups
CREATE INDEX IF NOT EXISTS idx_codelens_users_email ON public.codelens_users(email);
CREATE INDEX IF NOT EXISTS idx_codelens_otps_email ON public.codelens_otps(email);

-- Create code_analyses table
CREATE TABLE IF NOT EXISTS public.code_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_session TEXT NOT NULL,
    language TEXT,
    original_code TEXT NOT NULL,
    summary TEXT,
    steps JSONB,
    bugs JSONB,
    optimizations JSONB,
    concepts JSONB,
    flow TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index user_session for efficient history queries
CREATE INDEX IF NOT EXISTS idx_code_analyses_user_session ON public.code_analyses(user_session);

