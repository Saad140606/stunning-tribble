import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-karachi-key-zabe-fest-2026-auth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-karachi-refresh-key-zabe-fest-2026-auth';
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

const generateAccessToken = (user: { id: number; email: string; role: string }) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION as any
  });
};

const generateRefreshToken = (user: { id: number; email: string; role: string }) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION as any
  });
};

export const register = async (req: Request, res: Response) => {
  const { full_name, email, phone, password, confirm_password, city, cnic, role } = req.body;

  // Basic validation
  if (!full_name || !email || !phone || !password || !confirm_password || !city) {
    return res.status(400).json({ error: 'All required fields must be filled / تمام مطلوبہ خانوں کو پُر کرنا لازمی ہے' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match / پاس ورڈز آپس میں نہیں ملتے' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters / پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے' });
  }

  const assignedRole = role === 'admin' || role === 'authority' ? role : 'citizen';

  try {
    // Check if user exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists / اس ای میل والا صارف پہلے سے موجود ہے' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user
    const insertQuery = `
      INSERT INTO users (full_name, email, phone, password_hash, city, cnic, role, is_verified, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, full_name, email, phone, city, cnic, role, is_verified, is_active
    `;
    // For admin role, auto-verify for convenience in development/hackathon, others false
    const isVerified = assignedRole === 'admin' || assignedRole === 'authority';
    const params = [full_name, email, phone, passwordHash, city, cnic || null, assignedRole, isVerified, true];
    
    const result = await db.query(insertQuery, params);
    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, expiresAt]);

    // Set refresh token in secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      message: 'Registration successful / رجسٹریشن کامیاب ہو گئی',
      user,
      accessToken
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration / رجسٹریشن کے دوران سرور کی خرابی' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required / ای میل اور پاس ورڈ درکار ہیں' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password / غلط ای میل یا پاس ورڈ' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated / یہ اکاؤنٹ معطل ہے' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password / غلط ای میل یا پاس ورڈ' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, expiresAt]);

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password_hash, ...userProfile } = user;

    return res.status(200).json({
      message: 'Login successful / لاگ ان کامیاب رہا',
      user: userProfile,
      accessToken
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login / لاگ ان کے دوران سرور کی خرابی' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required / ریفریش ٹوکن درکار ہے' });
  }

  try {
    // Look up token in database
    const tokenResult = await db.query('SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false', [refreshToken]);
    if (tokenResult.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid or revoked refresh token / غلط یا منسوخ شدہ ریفریش ٹوکن' });
    }

    const tokenRow = tokenResult.rows[0];

    // Check expiration
    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Expired refresh token / زائد المیعاد ریفریش ٹوکن' });
    }

    // Verify token structure
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number; email: string; role: string };

    // Fetch user
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'User not found / صارف نہیں ملا' });
    }

    const user = userResult.rows[0];

    // Refresh Token Rotation (RTR): Revoke the current refresh token
    await db.query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [refreshToken]);

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, newRefreshToken, expiresAt]);

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(403).json({ error: 'Failed to refresh token / ٹوکن ریفریش کرنے میں ناکامی' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (refreshToken) {
    // Revoke in database
    await db.query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [refreshToken]).catch(() => undefined);
  }

  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logout successful / لاگ آؤٹ کامیاب رہا' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required / ای میل ایڈریس درکار ہے' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No user registered with this email / اس ای میل والا کوئی صارف نہیں ہے' });
    }

    // Mock reset flow: Generate a reset token (JWT)
    const user = result.rows[0];
    const resetToken = jwt.sign({ id: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: '15m' });

    // In a real application, you would mail this link: e.g., /reset-password?token=XYZ
    // For this hackathon project, we return it in the response to make it easy to inspect/test!
    return res.status(200).json({
      message: 'Reset instructions generated / پاس ورڈ دوبارہ ترتیب دینے کی ہدایات جاری کر دی گئیں',
      resetToken, // Hackathon preview
      resetLink: `http://localhost:3000/reset-password?token=${resetToken}`
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password, confirm_password } = req.body;

  if (!token || !password || !confirm_password) {
    return res.status(400).json({ error: 'All fields are required / تمام خانے پُر کریں' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match / پاس ورڈز آپس میں نہیں ملتے' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters / پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; type: string };
    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: 'Invalid reset token / غلط ری سیٹ ٹوکن' });
    }

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found / صارف نہیں ملا' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, decoded.id]);

    // Revoke all existing refresh tokens for security
    await db.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [decoded.id]);

    return res.status(200).json({ message: 'Password reset successful. You can login now / پاس ورڈ کامیابی سے تبدیل ہو گیا، اب آپ لاگ ان کر سکتے ہیں' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(400).json({ error: 'Invalid or expired reset token / غلط یا زائد المیعاد ری سیٹ ٹوکن' });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated / تصدیق نہیں ہوئی' });
  }

  try {
    const result = await db.query('SELECT id, full_name, email, phone, city, cnic, role, is_verified, is_active, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found / صارف نہیں ملا' });
    }
    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};
