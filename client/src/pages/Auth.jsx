import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  ShieldAlert,
  KeyRound, 
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react';

export default function Auth() {
  const { user, authenticateUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Stages: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState(() => localStorage.getItem('codelens_last_email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // OTP inputs state & verification animation state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpStatus, setOtpStatus] = useState('idle'); // 'idle' | 'verifying' | 'verified' | 'unsuccessful'
  const [verifyMessage, setVerifyMessage] = useState('');
  const [scanStep, setScanStep] = useState(0);
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
      localStorage.setItem('codelens_last_email', email.trim().toLowerCase());
      authenticateUser(resData.token, resData.user);
      setTimeout(() => navigate('/analyze'), 1000);
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Digit Inputs & focus shifting & paste
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto focus next field
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto verify if complete 6 digits entered
    if (value && index === 5 && newDigits.every(d => d !== '')) {
      handleVerifyOtp(null, newDigits);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Shifting focus back on Backspace
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtpDigits(digits);
      if (otpRefs.current[5]) otpRefs.current[5].focus();
      handleVerifyOtp(null, digits);
    }
  };

  // Verify 6-digit OTP with High-Class Visual Animations
  const handleVerifyOtp = async (e, customDigits) => {
    if (e) e.preventDefault();
    const digits = customDigits || otpDigits;
    const token = digits.join('');
    if (token.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setOtpStatus('verifying');
    setScanStep(0);
    setLoading(true);
    setError(null);
    setSuccess(null);

    const stepTimer1 = setTimeout(() => setScanStep(1), 400);
    const stepTimer2 = setTimeout(() => setScanStep(2), 900);

    const startTime = Date.now();

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });

      const resData = await response.json();

      // Ensure minimum scanning animation duration (1600ms) for high-class experience
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1600) {
        await new Promise(r => setTimeout(r, 1600 - elapsedTime));
      }

      if (!response.ok) throw new Error(resData.error || "Invalid or expired OTP code.");

      // Success animation sequence
      setOtpStatus('verified');
      setVerifyMessage("Email OTP verified successfully!");
      
      // Trigger festive confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f5c4', '#a855f7', '#3b82f6', '#ffffff']
        });
      } catch (confettiErr) {
        console.warn("Confetti effect failed:", confettiErr);
      }

      localStorage.setItem('codelens_last_email', email.trim().toLowerCase());
      authenticateUser(resData.token, resData.user);

      // Redirect after showing verified animation
      setTimeout(() => {
        navigate('/analyze');
      }, 1800);
    } catch (err) {
      console.error("OTP Verification Error:", err);
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1600) {
        await new Promise(r => setTimeout(r, 1600 - elapsedTime));
      }
      setOtpStatus('unsuccessful');
      setVerifyMessage(err.message || "Verification unsuccessful. Invalid OTP code.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
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
        
        {/* CodeLens Brand Title */}
        <div className="text-center mb-8">
          <span className="font-heading text-[10px] font-black uppercase tracking-widest text-accentCyan bg-accentCyan/10 px-3 py-1 rounded-full border border-accentCyan/20 inline-flex items-center gap-1.5 justify-center mb-3">
            <Sparkles className="h-3.5 w-3.5 text-accentCyan animate-pulse" /> Secure Gatekeeper
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wide text-textMain">
            CodeLens Cloud Account
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
                      placeholder="e.g. developer@codelens.ai"
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
                    Don't have a CodeLens account?{" "}
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
                      placeholder="e.g. developer@codelens.ai"
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

            {/* OTP VERIFICATION MODE WITH HIGH-CLASS ANIMATION */}
            {mode === 'otp' && (
              <motion.div 
                key="otp-container"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="space-y-6 text-center"
              >
                <AnimatePresence mode="wait">
                  
                  {/* 1. IDLE STATE: USER ENTERS OTP */}
                  {otpStatus === 'idle' && (
                    <motion.form 
                      key="otp-idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleVerifyOtp}
                      className="space-y-6 text-center"
                    >
                      <div className="flex flex-col items-center justify-center mb-2">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-2xl bg-accentCyan/10 border border-accentCyan/30 flex items-center justify-center text-accentCyan mb-4 shadow-[0_0_20px_rgba(0,245,196,0.2)]">
                            <KeyRound className="h-7 w-7" />
                          </div>
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                            className="absolute -inset-1 rounded-2xl border border-dashed border-accentCyan/40 pointer-events-none"
                          />
                        </div>
                        <h4 className="font-heading text-sm font-extrabold uppercase text-accentCyan tracking-wider">
                          Confirm Email OTP
                        </h4>
                        <p className="text-[11px] text-mutedMain mt-1.5 max-w-[280px]">
                          We sent a secure 6-digit confirmation code to: <br/>
                          <strong className="text-textMain font-mono mt-0.5 block">{email}</strong>
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
                            onPaste={handleOtpPaste}
                            className="w-10 sm:w-12 h-12 rounded-xl bg-background border border-border/80 font-code font-black text-center text-lg text-accentCyan focus:border-accentCyan focus:shadow-[0_0_18px_rgba(0,245,196,0.25)] outline-none transition-all shadow-inner"
                            required
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accentCyan to-accentPurple text-background font-heading text-xs font-black uppercase tracking-wider shadow-lg shadow-accentCyan/10 hover:shadow-accentCyan/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Confirm Verification OTP</span>
                        <Zap className="h-4 w-4" />
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

                  {/* 2. VERIFYING SCANNING ANIMATION STATE */}
                  {otpStatus === 'verifying' && (
                    <motion.div
                      key="otp-verifying"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="py-6 flex flex-col items-center justify-center space-y-6"
                    >
                      {/* Futuristic Cyber Scanning Core */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        {/* Outer Rotating Ring 1 */}
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accentCyan border-r-accentCyan/40 shadow-[0_0_25px_rgba(0,245,196,0.3)]"
                        />
                        {/* Outer Rotating Ring 2 (reverse) */}
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                          className="absolute inset-2 rounded-full border-2 border-transparent border-b-accentPurple border-l-accentPurple/40"
                        />
                        {/* Pulse Aura */}
                        <motion.div 
                          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.15, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                          className="absolute inset-4 rounded-full bg-gradient-to-tr from-accentCyan/20 to-accentPurple/20 blur-md"
                        />
                        {/* Center Core Icon */}
                        <div className="relative z-10 h-14 w-14 rounded-2xl bg-surface/90 border border-accentCyan/50 flex items-center justify-center shadow-2xl backdrop-blur-md">
                          <Loader2 className="h-7 w-7 text-accentCyan animate-spin" />
                        </div>
                      </div>

                      <div className="space-y-2 max-w-[280px] text-center">
                        <h4 className="font-heading text-sm font-extrabold uppercase text-accentCyan tracking-wider flex items-center justify-center gap-2">
                          <span>Authenticating Token</span>
                          <span className="flex gap-1">
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }}>.</motion.span>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
                          </span>
                        </h4>
                        
                        <p className="text-xs font-mono text-mutedMain animate-pulse">
                          {scanStep === 0 && "Decrypting 6-digit OTP hash..."}
                          {scanStep === 1 && "Verifying token authenticity..."}
                          {scanStep === 2 && "Syncing sandbox access keys..."}
                        </p>
                      </div>

                      {/* Futuristic Cyber Progress Bar */}
                      <div className="w-full max-w-[220px] h-1.5 rounded-full bg-background border border-border/50 overflow-hidden relative">
                        <motion.div 
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.6, ease: "easeInOut" }}
                          className="h-full bg-gradient-to-r from-accentCyan via-accentPurple to-accentCyan rounded-full shadow-[0_0_10px_rgba(0,245,196,0.6)]"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* 3. VERIFIED HIGH-CLASS SUCCESS ANIMATION STATE */}
                  {otpStatus === 'verified' && (
                    <motion.div
                      key="otp-verified"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="py-6 flex flex-col items-center justify-center space-y-5"
                    >
                      {/* Glowing Green Shield Success Badge */}
                      <div className="relative">
                        <motion.div 
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                          className="h-20 w-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.35)]"
                        >
                          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                        </motion.div>
                        {/* Outer Expanding Pulse Ring */}
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 1 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute inset-0 rounded-3xl border-2 border-emerald-400 pointer-events-none"
                        />
                      </div>

                      <div className="space-y-1 text-center">
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <span className="font-heading text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-400/30 inline-block mb-2">
                            Verified & Authenticated
                          </span>
                          <h4 className="font-heading text-lg font-black uppercase text-emerald-400 tracking-wide">
                            Access Granted
                          </h4>
                        </motion.div>
                        <p className="text-xs text-mutedMain max-w-[260px] mx-auto pt-1">
                          Welcome to CodeLens AI. Redirecting to workspace...
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono font-semibold pt-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading Sandboxes...</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 4. UNSUCCESSFUL HIGH-CLASS FAILURE ANIMATION STATE */}
                  {otpStatus === 'unsuccessful' && (
                    <motion.div
                      key="otp-unsuccessful"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="py-6 flex flex-col items-center justify-center space-y-5"
                    >
                      {/* Crimson Red Error Alert Icon with Glitch Shake */}
                      <div className="relative">
                        <motion.div 
                          animate={{ x: [-10, 10, -8, 8, -4, 4, 0] }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="h-20 w-20 rounded-3xl bg-accentRed/10 border-2 border-accentRed flex items-center justify-center text-accentRed shadow-[0_0_40px_rgba(255,75,75,0.35)]"
                        >
                          <XCircle className="h-10 w-10 text-accentRed" />
                        </motion.div>
                        {/* Crimson Ripple Pulse */}
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 1 }}
                          animate={{ scale: 1.6, opacity: 0 }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                          className="absolute inset-0 rounded-3xl border-2 border-accentRed/50 pointer-events-none"
                        />
                      </div>

                      <div className="space-y-1 text-center">
                        <span className="font-heading text-[10px] font-black uppercase tracking-widest text-accentRed bg-accentRed/10 px-3 py-1 rounded-full border border-accentRed/30 inline-block mb-2">
                          Verification Error
                        </span>
                        <h4 className="font-heading text-lg font-black uppercase text-accentRed tracking-wide">
                          Verification Unsuccessful
                        </h4>
                        <p className="text-xs text-accentRed/90 bg-accentRed/5 border border-accentRed/20 p-3 rounded-xl max-w-[280px] mx-auto mt-2 font-medium">
                          {verifyMessage || "The 6-digit OTP code entered is invalid or has expired."}
                        </p>
                      </div>

                      {/* Interactive Actions for Unsuccessful State */}
                      <div className="w-full space-y-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStatus('idle');
                            setOtpDigits(['', '', '', '', '', '']);
                            setError(null);
                            setTimeout(() => {
                              if (otpRefs.current[0]) otpRefs.current[0].focus();
                            }, 100);
                          }}
                          className="w-full py-3 rounded-xl bg-accentRed/10 border border-accentRed/30 text-accentRed font-heading text-xs font-black uppercase tracking-wider hover:bg-accentRed/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Try Entering OTP Again</span>
                        </button>

                        <div className="flex items-center justify-between text-xs font-medium border-t border-border/30 pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setSuccess(null);
                              setOtpStatus('idle');
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
                                setOtpStatus('idle');
                              } catch (err) {
                                setError(err.message || "Failed to resend code. Try again in a minute.");
                              }
                            }}
                            className="text-accentCyan hover:underline font-bold cursor-pointer"
                          >
                            Resend OTP Code
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
