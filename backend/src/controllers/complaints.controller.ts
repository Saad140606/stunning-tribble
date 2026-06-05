import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const DAILY_LIMIT = 5;

const startOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const earth = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const mapComplaintRow = (row: any) => ({
  id: String(row.id),
  userId: row.user_id ? String(row.user_id) : null,
  title: row.title,
  description: row.description,
  category: row.category,
  severity: row.severity,
  status: row.status,
  latitude: row.latitude,
  longitude: row.longitude,
  district: row.district,
  ward: row.ward,
  street: row.street,
  imageUrl: row.image_url,
  blurhash: row.blurhash,
  priority: row.priority,
  slaDeadline: row.sla_deadline,
  flagCount: row.flag_count ?? 0,
  adminNote: row.admin_note,
  assignedTo: row.assigned_to,
  isDuplicate: row.is_duplicate ?? false,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createComplaint = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized / غیر مجاز' });
  }

  const {
    title,
    description,
    category,
    severity,
    status,
    latitude,
    longitude,
    district,
    ward,
    street,
    imageUrl,
    blurhash,
    priority,
    slaDeadline,
    isDuplicate,
  } = req.body;

  if (!category || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Category and coordinates are required / زمرہ اور لوکیشن لازمی ہے' });
  }

  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  if (lat === null || lng === null) {
    return res.status(400).json({ error: 'Invalid coordinates / لوکیشن غلط ہے' });
  }

  try {
    if (db.isPg) {
      const countResult = await db.query(
        'SELECT COUNT(*) FROM complaints WHERE user_id = $1 AND created_at >= DATE_TRUNC(\'day\', NOW())',
        [req.user.id]
      );
      const todayCount = Number(countResult.rows[0]?.count ?? 0);
      if (todayCount >= DAILY_LIMIT) {
        return res.status(429).json({ error: 'Daily report limit reached / روزانہ کی حد پوری ہو چکی ہے' });
      }

      const insertQuery = `
        INSERT INTO complaints (
          user_id, title, description, category, severity, status,
          latitude, longitude, district, ward, street,
          image_url, blurhash, priority, sla_deadline, is_duplicate
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        req.user.id,
        title || `${category} report`,
        description || null,
        category,
        Number(severity) || 5,
        status || 'reported',
        lat,
        lng,
        district || null,
        ward || null,
        street || null,
        imageUrl || null,
        blurhash || null,
        Number(priority) || 0,
        slaDeadline ? new Date(slaDeadline) : null,
        Boolean(isDuplicate),
      ]);

      return res.status(201).json({ complaint: mapComplaintRow(result.rows[0]) });
    }

    const data = db.readLocal();
    const now = new Date();
    const todayStart = startOfToday();
    const todayCount = data.complaints.filter((c) => c.user_id === req.user!.id && new Date(c.created_at).getTime() >= todayStart).length;
    if (todayCount >= DAILY_LIMIT) {
      return res.status(429).json({ error: 'Daily report limit reached / روزانہ کی حد پوری ہو چکی ہے' });
    }

    const nextId = data.complaints.length + 1;
    const record = {
      id: nextId,
      user_id: req.user.id,
      title: title || `${category} report`,
      description: description || null,
      category,
      severity: Number(severity) || 5,
      status: status || 'reported',
      latitude: lat,
      longitude: lng,
      district: district || null,
      ward: ward || null,
      street: street || null,
      image_url: imageUrl || null,
      blurhash: blurhash || null,
      priority: Number(priority) || 0,
      sla_deadline: slaDeadline ? new Date(slaDeadline).toISOString() : null,
      flag_count: 0,
      admin_note: null,
      assigned_to: null,
      is_duplicate: Boolean(isDuplicate),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    data.complaints.push(record);
    db.writeLocal(data);
    return res.status(201).json({ complaint: mapComplaintRow(record) });
  } catch (err) {
    console.error('Create complaint error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const listPublicComplaints = async (_req: Request, res: Response) => {
  try {
    if (db.isPg) {
      const result = await db.query('SELECT * FROM complaints ORDER BY created_at DESC', []);
      return res.status(200).json({ complaints: result.rows.map(mapComplaintRow) });
    }

    const data = db.readLocal();
    const rows = [...data.complaints].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.status(200).json({ complaints: rows.map(mapComplaintRow) });
  } catch (err) {
    console.error('List public complaints error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const listAdminComplaints = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (db.isPg) {
      const result = await db.query('SELECT * FROM complaints ORDER BY created_at DESC', []);
      return res.status(200).json({ complaints: result.rows.map(mapComplaintRow) });
    }

    const data = db.readLocal();
    const rows = [...data.complaints].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.status(200).json({ complaints: rows.map(mapComplaintRow) });
  } catch (err) {
    console.error('List admin complaints error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const updateComplaint = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, adminNote, assignedTo, priority } = req.body;

  if (!status && adminNote === undefined && assignedTo === undefined && priority === undefined) {
    return res.status(400).json({ error: 'No fields provided for update / کوئی معلومات فراہم نہیں کی گئیں' });
  }

  try {
    if (db.isPg) {
      const fields: string[] = [];
      const values: any[] = [];
      let index = 1;

      if (status) {
        fields.push(`status = $${index++}`);
        values.push(status);
      }
      if (adminNote !== undefined) {
        fields.push(`admin_note = $${index++}`);
        values.push(adminNote);
      }
      if (assignedTo !== undefined) {
        fields.push(`assigned_to = $${index++}`);
        values.push(assignedTo);
      }
      if (priority !== undefined) {
        fields.push(`priority = $${index++}`);
        values.push(Number(priority));
      }

      fields.push('updated_at = NOW()');
      values.push(Number(id));
      const idIndex = index;

      const query = `UPDATE complaints SET ${fields.join(', ')} WHERE id = $${idIndex} RETURNING *`;
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Complaint not found / شکایت نہیں ملی' });
      }

      return res.status(200).json({ complaint: mapComplaintRow(result.rows[0]) });
    }

    const data = db.readLocal();
    const targetIndex = data.complaints.findIndex((c) => String(c.id) === String(id));
    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Complaint not found / شکایت نہیں ملی' });
    }

    const target = data.complaints[targetIndex];
    if (status) target.status = status;
    if (adminNote !== undefined) target.admin_note = adminNote;
    if (assignedTo !== undefined) target.assigned_to = assignedTo;
    if (priority !== undefined) target.priority = Number(priority);
    target.updated_at = new Date().toISOString();

    data.complaints[targetIndex] = target;
    db.writeLocal(data);
    return res.status(200).json({ complaint: mapComplaintRow(target) });
  } catch (err) {
    console.error('Update complaint error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const flagComplaint = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized / غیر مجاز' });
  }

  const { id } = req.params;

  try {
    if (db.isPg) {
      const exists = await db.query(
        'SELECT id FROM complaint_flags WHERE complaint_id = $1 AND user_id = $2',
        [Number(id), req.user.id]
      );
      if (exists.rows.length > 0) {
        return res.status(200).json({ message: 'Already flagged / پہلے سے رپورٹ ہو چکا ہے' });
      }

      await db.query(
        'INSERT INTO complaint_flags (complaint_id, user_id) VALUES ($1, $2)',
        [Number(id), req.user.id]
      );
      await db.query(
        'UPDATE complaints SET flag_count = COALESCE(flag_count, 0) + 1, updated_at = NOW() WHERE id = $1',
        [Number(id)]
      );

      return res.status(200).json({ message: 'Flag recorded / شکایت درج ہو گئی' });
    }

    const data = db.readLocal();
    const already = data.complaint_flags.some((f) => String(f.complaint_id) === String(id) && f.user_id === req.user!.id);
    if (already) {
      return res.status(200).json({ message: 'Already flagged / پہلے سے رپورٹ ہو چکا ہے' });
    }

    data.complaint_flags.push({
      id: data.complaint_flags.length + 1,
      complaint_id: Number(id),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
    });

    const targetIndex = data.complaints.findIndex((c) => String(c.id) === String(id));
    if (targetIndex !== -1) {
      data.complaints[targetIndex].flag_count = (data.complaints[targetIndex].flag_count ?? 0) + 1;
      data.complaints[targetIndex].updated_at = new Date().toISOString();
    }

    db.writeLocal(data);
    return res.status(200).json({ message: 'Flag recorded / شکایت درج ہو گئی' });
  } catch (err) {
    console.error('Flag complaint error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};

export const checkDuplicate = async (req: Request, res: Response) => {
  const category = String(req.query.category || '');
  const lat = toNumber(req.query.lat);
  const lng = toNumber(req.query.lng);

  if (!category || lat === null || lng === null) {
    return res.status(400).json({ error: 'Category and coordinates are required / زمرہ اور لوکیشن لازمی ہے' });
  }

  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    let rows: any[] = [];
    if (db.isPg) {
      const result = await db.query(
        'SELECT * FROM complaints WHERE category = $1 AND status != $2 AND created_at >= $3',
        [category, 'resolved', sinceDate]
      );
      rows = result.rows;
    } else {
      const data = db.readLocal();
      rows = data.complaints.filter((c) =>
        c.category === category &&
        c.status !== 'resolved' &&
        new Date(c.created_at).getTime() >= sinceDate.getTime()
      );
    }

    for (const row of rows) {
      const distance = distanceMeters({ lat, lng }, { lat: Number(row.latitude), lng: Number(row.longitude) });
      if (distance <= 200) {
        const createdAt = new Date(row.created_at);
        const hoursAgo = Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 3600000));
        return res.status(200).json({
          duplicate: {
            id: String(row.id),
            category: row.category,
            distanceMeters: Math.round(distance),
            hoursAgo,
          }
        });
      }
    }

    return res.status(200).json({ duplicate: null });
  } catch (err) {
    console.error('Duplicate check error:', err);
    return res.status(500).json({ error: 'Server error / سرور کی خرابی' });
  }
};
