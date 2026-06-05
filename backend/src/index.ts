import * as dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './config/db';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import complaintsRoutes from './routes/complaints.routes';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware configurations
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/complaints', complaintsRoutes);

// Base health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date(), db: db.isPg ? 'postgresql' : 'local-json' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error / اندرونی سرور کی خرابی' });
});

// Initialize DB and start server
const startServer = async () => {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`🚀 Fix Karachi backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
