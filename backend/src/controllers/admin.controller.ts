import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.query(
      'SELECT id, full_name, email, phone, city, cnic, role, is_verified, is_active, created_at FROM users ORDER BY id ASC'
    );
    return res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role, is_verified, is_active } = req.body;

  if (!role && is_verified === undefined && is_active === undefined) {
    return res.status(400).json({ error: 'No fields provided for update / کوئی معلومات فراہم نہیں کی گئیں' });
  }

  try {
    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (is_verified !== undefined) {
      fields.push(`is_verified = $${paramIndex++}`);
      values.push(is_verified);
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    fields.push(`updated_at = NOW()`);
    values.push(Number(id)); // ID goes to the end
    const idParamIndex = paramIndex;

    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${idParamIndex} 
      RETURNING id, full_name, email, phone, city, cnic, role, is_verified, is_active
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found / صارف نہیں ملا' });
    }

    return res.status(200).json({
      message: 'User updated successfully / صارف کی معلومات کامیابی سے تبدیل کر دی گئیں',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Admin update user error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [Number(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found / صارف نہیں ملا' });
    }

    return res.status(200).json({ message: 'User deleted successfully / صارف کامیابی سے حذف کر دیا گیا' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};
