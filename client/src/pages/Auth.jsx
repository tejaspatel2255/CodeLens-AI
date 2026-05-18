import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowRight, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  KeyRound, 
  ArrowLeft 
} from 'lucide-react';

export default function Auth() {
  const { user, authenticateUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Stages: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState(() => localStorage.getItem('traceverse_last_email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // OTP inputs state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // Redirect to home/analyze if already authenticated
  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect') || '/analyze';
      navigate(redirect);
    }
  }, [user, navigate, searchParams]);

  // Real-time password requirement evaluator
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(requirements).every(Boolean);

  const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Handle Signup Logic
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password does not meet all secure requirements.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to complete signup.");

      // Transition to OTP verification stage
      setSuccess("Verification OTP has been sent to your email inbox!");
      setMode('otp');
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Login Logic
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const resData = await response.json();
      
      if (!response.ok) {
        // If email is not confirmed, trigger resend and direct to OTP
        if (response.status === 403 && resData.requiresConfirm) {
          // Re-trigger OTP generation in backend
          await fetch(`${getApiUrl()}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          setSuccess("Please verify your email. A fresh 6-digit OTP code has been sent to your inbox!");
          setMode('otp');
          return;
        }
        throw new Error(resData.error || "Invalid credentials.");
      }

      setSuccess("Logged in successfully! Redirecting...");
      localStorage.setItem('traceverse_last_email', email.trim().toLowerCase());
      authenticateUser(resData.token, resData.user);
      setTimeout(() => navigate('/analyze'), 1000);
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Digit Inputs & focus shifting
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto focus next field
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Shifting focus back on Backspace
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const token = otpDigits.join('');
    if (token.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to verify registration code.");

      setSuccess("Email successfully verified! Welcome to TraceVerse AI.");
      localStorage.setItem('traceverse_last_email', email.trim().toLowerCase());
      authenticateUser(resData.token, resData.user);
      setTimeout(() => navigate('/analyze'), 1200);
    } catch (err) {
      console.error("OTP Verification Error:", err);
      setError(err.message || "Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full py-16 bg-background flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background radial overlays & grids */}
      <div className="bg-grid-lines" />
      <div className="absolute h-96 w-96 rounded-full bg-accentCyan/3 blur-[120px] top-10 left-10 pointer-events-none" />
      <div className="absolute h-96 w-96 rounded-full bg-accentPurple/3 blur-[120px] bottom-10 right-10 pointer-events-none" />

      {/* Main Glassmorphic Wrapper */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-0">
        
        {/* TraceVerse Brand Title */}
        <div className="text-center mb-8">
          <span className="font-heading text-[10px] font-black uppercase tracking-widest text-accentCyan bg-accentCyan/10 px-3 py-1 rounded-full border border-accentCyan/20 inline-flex items-center gap-1.5 justify-center mb-3">
            <Sparkles className="h-3.5 w-3.5 text-accentCyan animate-pulse" /> Secure Gatekeeper
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wide text-textMain">
            TraceVerse Cloud Account
          </h2>
          <p className="text-xs text-mutedMain mt-1">
            Access secure trace sandboxes and sync execution histories.
          </p>
        </div>

        {/* Global Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-xl border border-accentRed/30 bg-accentRed/5 p-4 text-xs text-accentRed flex gap-2.5 items-start text-left"
            >
              <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-xl border border-accentCyan/30 bg-accentCyan/5 p-4 text-xs text-accentCyan flex gap-2.5 items-start text-left font-semibold"
            >
              <ShieldCheck className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-border bg-surface shadow-2xl relative">
          
          <AnimatePresence mode="wait">
            
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleSignIn}
                className="space-y-5 text-left"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-mutedMain">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-mutedMain" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. developer@traceverse.ai"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/80 bg-background font-body text-xs text-textMain placeholder:text-mutedMain/50 focus:border-accentCyan/50 focus:shadow-[0_0_12px_rgba(0,245,196,0.08)] outline-none transition-all"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-mutedMain">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-mutedMain" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/80 bg-background font-body text-xs text-textMain placeholder:text-mutedMain/50 focus:border-accentCyan/50 focus:shadow-[0_0_12px_rgba(0,245,196,0.08)] outline-none transition-all"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accentCyan to-accentPurple text-background font-heading text-xs font-black uppercase tracking-wider shadow-lg shadow-accentCyan/10 hover:shadow-accentCyan/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? "Authenticating..." : (
                    <>
                      <span>Secure Sign In</span>
                      <ArrowRight className="h-4.5 w-4.5 text-background" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-border/30 mt-4">
                  <p className="text-xs text-mutedMain">
                    Don't have a TraceVerse account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccess(null);
                        setMode('register');
                      }}
                      className="text-accentCyan font-bold hover:underline cursor-pointer"
                    >
                      Sign Up Now
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

            {/* REGISTER MODE */}
            {mode === 'register' && (
              <motion.form 
                key="register-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                onSubmit={handleSignUp}
                className="space-y-5 text-left"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-mutedMain">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-mutedMain" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. developer@traceverse.ai"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/80 bg-background font-body text-xs text-textMain placeholder:text-mutedMain/50 focus:border-accentCyan/50 focus:shadow-[0_0_12px_rgba(0,245,196,0.08)] outline-none transition-all"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-mutedMain">
                    Secure Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-mutedMain" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Establish secure password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/80 bg-background font-body text-xs text-textMain placeholder:text-mutedMain/50 focus:border-accentCyan/50 focus:shadow-[0_0_12px_rgba(0,245,196,0.08)] outline-none transition-all"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORDS STRENGTH GRID CONSTRAINTS */}
                <div className="p-3 bg-background/50 border border-border/30 rounded-xl space-y-2">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-mutedMain">
                    Password Security Constraints
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    
                    {/* Minimum 8 characters */}
                    <div className="flex items-center gap-1.5 font-medium">
                      {requirements.length ? (
                        <div className="h-4 w-4 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center flex-shrink-0 animate-scale-up">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-accentRed/10 text-accentRed flex items-center justify-center flex-shrink-0">
                          <X className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className={requirements.length ? "text-accentCyan" : "text-mutedMain/60"}>
                        8+ Characters
                      </span>
                    </div>

                    {/* At least 1 uppercase */}
                    <div className="flex items-center gap-1.5 font-medium">
                      {requirements.uppercase ? (
                        <div className="h-4 w-4 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center flex-shrink-0 animate-scale-up">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-accentRed/10 text-accentRed flex items-center justify-center flex-shrink-0">
                          <X className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className={requirements.uppercase ? "text-accentCyan" : "text-mutedMain/60"}>
                        1+ Uppercase (A-Z)
                      </span>
                    </div>

                    {/* At least 1 lowercase */}
                    <div className="flex items-center gap-1.5 font-medium">
                      {requirements.lowercase ? (
                        <div className="h-4 w-4 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center flex-shrink-0 animate-scale-up">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-accentRed/10 text-accentRed flex items-center justify-center flex-shrink-0">
                          <X className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className={requirements.lowercase ? "text-accentCyan" : "text-mutedMain/60"}>
                        1+ Lowercase (a-z)
                      </span>
                    </div>

                    {/* At least 1 number */}
                    <div className="flex items-center gap-1.5 font-medium">
                      {requirements.number ? (
                        <div className="h-4 w-4 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center flex-shrink-0 animate-scale-up">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-accentRed/10 text-accentRed flex items-center justify-center flex-shrink-0">
                          <X className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className={requirements.number ? "text-accentCyan" : "text-mutedMain/60"}>
                        1+ Number (0-9)
                      </span>
                    </div>

                    {/* At least 1 special char */}
                    <div className="flex items-center gap-1.5 font-medium sm:col-span-2">
                      {requirements.special ? (
                        <div className="h-4 w-4 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center flex-shrink-0 animate-scale-up">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-accentRed/10 text-accentRed flex items-center justify-center flex-shrink-0">
                          <X className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className={requirements.special ? "text-accentCyan" : "text-mutedMain/60"}>
                        1+ Symbol (!, @, #, $, %, etc.)
                      </span>
                    </div>

                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accentCyan to-accentPurple text-background font-heading text-xs font-black uppercase tracking-wider shadow-lg shadow-accentCyan/10 hover:shadow-accentCyan/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? "Registering account..." : (
                    <>
                      <span>Secure Register & Send OTP</span>
                      <ArrowRight className="h-4.5 w-4.5 text-background" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-border/30 mt-4">
                  <p className="text-xs text-mutedMain">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccess(null);
                        setMode('login');
                      }}
                      className="text-accentCyan font-bold hover:underline cursor-pointer"
                    >
                      Login Here
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

            {/* OTP VERIFICATION MODE */}
            {mode === 'otp' && (
              <motion.form 
                key="otp-form"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6 text-center"
              >
                <div className="flex flex-col items-center justify-center mb-2">
                  <div className="h-12 w-12 rounded-2xl bg-accentCyan/10 border border-accentCyan/20 flex items-center justify-center text-accentCyan mb-4 shadow-[0_0_15px_rgba(0,245,196,0.15)]">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h4 className="font-heading text-sm font-extrabold uppercase text-accentCyan tracking-wider">
                    Confirm Email OTP
                  </h4>
                  <p className="text-[11px] text-mutedMain mt-1.5 max-w-[280px]">
                    We sent a secure 6-digit confirmation code to: <br/>
                    <strong className="text-textMain/90 font-mono mt-0.5 block">{email}</strong>
                  </p>
                </div>

                {/* 6-digit individual box inputs */}
                <div className="flex items-center justify-center gap-2">
                  {otpDigits.map((val, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 sm:w-12 h-12 rounded-xl bg-background border border-border/80 font-code font-black text-center text-lg text-accentCyan focus:border-accentCyan focus:shadow-[0_0_15px_rgba(0,245,196,0.15)] outline-none transition-all shadow-inner"
                      required
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accentCyan to-accentPurple text-background font-heading text-xs font-black uppercase tracking-wider shadow-lg shadow-accentCyan/10 hover:shadow-accentCyan/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying..." : "Confirm Verification OTP"}
                </button>

                <div className="flex items-center justify-between text-xs font-medium border-t border-border/30 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setMode('register');
                    }}
                    className="text-mutedMain hover:text-textMain flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      setSuccess(null);
                      try {
                        const response = await fetch(`${getApiUrl()}/api/auth/signup`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, password })
                        });
                        const resData = await response.json();
                        if (!response.ok) throw new Error(resData.error || "Failed to resend code.");
                        setSuccess("Fresh 6-digit OTP code dispatched to inbox!");
                      } catch (err) {
                        setError(err.message || "Failed to resend code. Try again in a minute.");
                      }
                    }}
                    className="text-accentCyan hover:underline font-bold cursor-pointer"
                  >
                    Resend OTP Code
                  </button>
                </div>
              </motion.form>
            )}

          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
