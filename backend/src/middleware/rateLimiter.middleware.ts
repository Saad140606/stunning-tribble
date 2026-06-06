import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 points
  duration: 86400, // per 24 hours (1 day)
});

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Use user id if authenticated, otherwise fallback to IP address
  const key = (req as any).user?.id ? String((req as any).user.id) : req.ip || 'anonymous';
  
  rateLimiter.consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({
        error: 'Daily limit reached. Citizens are limited to 5 submissions per day. / روزانہ کی حد پوری ہو چکی ہے۔ شہری روزانہ صرف 5 رپورٹس جمع کرا سکتے ہیں۔'
      });
    });
};
