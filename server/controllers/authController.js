import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { supabase } from '../lib/supabase.js';
import { JWT_SECRET } from '../lib/env.js';


// Helper: Setup Nodemailer Transporter dynamically
export const getTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const rawPort = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && rawPort && user && pass) {
    const port = parseInt(rawPort, 10);
    const isGmail = host.includes('gmail');

    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      dnsOptions: { family: 4 }
    });
  }


  // In production, throw immediately if SMTP is missing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) are not configured for production email dispatch.');
  }

  // Fallback for non-production / local testing: Dynamic Ethereal Test SMTP
  console.log("\n======================================================================");
  console.log("ℹ️  SMTP keys not found in .env. Generating temporary Ethereal account...");
  const testAccount = await nodemailer.createTestAccount();
  console.log(`🔑 Ethereal Test Account: User="${testAccount.user}" Pass="${testAccount.pass}"`);
  console.log("======================================================================\n");

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

// Helper: Standard DB table error handler
const handleDbError = (err, res) => {
  console.error("Database Auth Error:", err);
  if (err.code === '42P01') {
    return res.status(500).json({
      error: "Authentication database tables are missing in Supabase. Please run the SQL queries inside 'server/db/schema.sql' in your Supabase SQL Editor to establish them!"
    });
  }
  return res.status(500).json({ error: err.message || "An authentication database error occurred." });
};

// 1. SIGN UP & DISPATCH EMAIL OTP
export const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Check if user already exists
    const { data: existingUser, error: checkErr } = await supabase
      .from('codelens_users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (checkErr) return handleDbError(checkErr, res);

    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ error: "An account with this email is already registered and verified." });
    }

    // Password Hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save or update unverified user
    let userId;
    if (existingUser) {
      const { data: updatedUser, error: updateErr } = await supabase
        .from('codelens_users')
        .update({ password_hash: passwordHash })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateErr) return handleDbError(updateErr, res);
      userId = updatedUser.id;
    } else {
      const { data: newUser, error: insertErr } = await supabase
        .from('codelens_users')
        .insert([{ email: email.trim().toLowerCase(), password_hash: passwordHash, is_verified: false }])
        .select()
        .single();

      if (insertErr) return handleDbError(insertErr, res);
      userId = newUser.id;
    }

    // Generate 6-Digit random numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute expiration

    // Clean up any existing active OTP for this email to prevent unique key violations
    await supabase.from('codelens_otps').delete().eq('email', email.trim().toLowerCase());

    // Insert the fresh OTP registry
    const { error: otpErr } = await supabase
      .from('codelens_otps')
      .insert([{ email: email.trim().toLowerCase(), otp, expires_at: expiresAt.toISOString() }]);

    if (otpErr) return handleDbError(otpErr, res);

    // Dispatch OTP via Nodemailer SMTP
    const transporter = await getTransporter();

    // Verify SMTP connection/auth BEFORE attempting to send mail
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error("❌ SMTP Connection/Auth Verification Error:", verifyErr);
      const detail = verifyErr.response || verifyErr.message || verifyErr;
      throw new Error(`SMTP connection/auth failed: ${detail}`);
    }

    // Gmail's SMTP relay silently drops or flags mail when From header doesn't match the authenticated SMTP_USER account
    const defaultFrom = process.env.SMTP_USER 
      ? `"CodeLens AI" <${process.env.SMTP_USER}>` 
      : '"CodeLens AI" <gatekeeper@codelens.ai>';
    const fromAddress = process.env.SMTP_FROM || defaultFrom;

    const mailOptions = {
      from: fromAddress,
      to: email.trim().toLowerCase(),
      subject: '🔑 Your CodeLens AI Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #080c14; color: #f8fafc; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
          <h2 style="color: #00f5c4; text-align: center; text-transform: uppercase; letter-spacing: 2px;">CodeLens AI</h2>
          <hr style="border-color: #1e293b; margin: 20px 0;" />
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">Welcome to the future of step-by-step trace debugging!</p>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">Please verify your registration by entering the secure 6-digit confirmation code below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #00f5c4; background-color: #0c1524; border: 1px solid #00f5c4; padding: 15px 30px; border-radius: 8px; box-shadow: 0 0 15px rgba(0, 245, 196, 0.15);">${otp}</span>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">This verification code will expire in 15 minutes. If you did not trigger this request, please disregard this email.</p>
        </div>
      `
    };

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (sendErr) {
      console.error("❌ SMTP Send Mail Error:", sendErr);
      const detail = sendErr.response || sendErr.message || sendErr;
      throw new Error(`SMTP send failed: ${detail}`);
    }

    console.log("📧 Verification OTP dispatched:", info.messageId);

    // If using Ethereal, log the clickable preview inbox!
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("\n======================================================================");
      console.log("📬  [TEST MODE] OTP Verification Email Dispatched!");
      console.log(`🔗  Click here to view your inbox: ${previewUrl}`);
      console.log("======================================================================\n");
    }

    return res.status(200).json({ 
      message: "Verification OTP dispatched successfully!",
      previewUrl: previewUrl || null 
    });

  } catch (err) {
    console.error("Signup Error Details:", {
      message: err.message,
      code: err.code,
      response: err.response,
      responseCode: err.responseCode
    });
    return res.status(500).json({ error: err.message || "Unable to complete registration." });
  }
};

// 2. VERIFY 6-DIGIT OTP

export const verifyOtp = async (req, res) => {
  const { email, token } = req.body;

  if (!email || !token) {
    return res.status(400).json({ error: "Email and OTP token are required." });
  }

  try {
    // Query OTP record
    const { data: record, error: otpErr } = await supabase
      .from('codelens_otps')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (otpErr) return handleDbError(otpErr, res);

    if (!record) {
      return res.status(400).json({ error: "No active verification code was generated for this email." });
    }

    // Verify token & expiration
    if (record.otp !== token.trim()) {
      return res.status(400).json({ error: "Incorrect verification code. Please check your inbox and try again." });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    // Clean up used OTP
    await supabase.from('codelens_otps').delete().eq('email', email.trim().toLowerCase());

    // Verify user profile
    const { data: user, error: userErr } = await supabase
      .from('codelens_users')
      .update({ is_verified: true })
      .eq('email', email.trim().toLowerCase())
      .select()
      .single();

    if (userErr) return handleDbError(userErr, res);

    // Sign jwt session token
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: "Email verified successfully!",
      token: jwtToken,
      user: { id: user.id, email: user.email }
    });

  } catch (err) {
    console.error("Verify OTP Crash Error:", err);
    return res.status(500).json({ error: err.message || "Unable to verify registration code." });
  }
};

// 3. SECURE PASSWORDS SIGN IN
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { data: user, error: userErr } = await supabase
      .from('codelens_users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (userErr) return handleDbError(userErr, res);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: "Email unconfirmed", requiresConfirm: true });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }

    // Sign session token
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: "Authorized successfully!",
      token: jwtToken,
      user: { id: user.id, email: user.email }
    });

  } catch (err) {
    console.error("Login Crash Error:", err);
    return res.status(500).json({ error: err.message || "Unable to complete session authorization." });
  }
};

// 4. VERIFY ACTIVE JWT STATE (client page sync)
export const me = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Missing authorization token header." });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ user: { id: decoded.id, email: decoded.email } });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
};
