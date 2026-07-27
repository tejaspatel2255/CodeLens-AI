import rateLimit from 'express-rate-limit';

// 1. AI Rate Limiter: max 10 requests per 10 minutes per IP
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    error: 'Too many AI requests from this IP address. Please wait 10 minutes before generating or analyzing more code.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Auth Rate Limiter: max 5 requests per 15 minutes per IP (Login/Signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. OTP Verification Rate Limiter: max 5 attempts per email per 15 minutes
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => {
    const email = req.body?.email?.toString().trim().toLowerCase();
    return email || req.ip; // key by email if provided, fallback to IP
  },
  message: {
    error: 'Too many OTP verification attempts for this account. Please wait 15 minutes before attempting again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
