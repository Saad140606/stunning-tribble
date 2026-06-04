import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized / غیر مجاز' });
  }

  try {
    const result = await db.query(
      'SELECT id, full_name, email, phone, city, cnic, role, is_verified, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found / صارف کا پروفائل نہیں ملا' });
    }

    return res.status(200).json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized / غیر مجاز' });
  }

  const { full_name, phone, city, cnic } = req.body;

  if (!full_name || !phone || !city) {
    return res.status(400).json({ error: 'Full name, phone, and city are required / نام، فون نمبر اور شہر لازمی ہیں' });
  }

  try {
    const updateQuery = `
      UPDATE users 
      SET full_name = $1, phone = $2, city = $3, cnic = $4, updated_at = NOW() 
      WHERE id = $5
      RETURNING id, full_name, email, phone, city, cnic, role, is_verified, is_active
    `;
    const result = await db.query(updateQuery, [full_name, phone, city, cnic || null, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found / صارف نہیں ملا' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully / پروفائل کامیابی سے تبدیل ہو گیا',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized / غیر مجاز' });
  }

  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found / صارف نہیں ملا' });
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Account deleted successfully / اکاؤنٹ کامیابی سے حذف ہو گیا' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};
