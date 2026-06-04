import { useCallback, useMemo, useState } from 'react';

const KEY = 'fix-karachi-rate-limit';
const LIMIT = 5;

interface RateLimitState {
  count: number;
  resetTime: number;
}

const midnightTomorrow = () => {
  const reset = new Date();
  reset.setDate(reset.getDate() + 1);
  reset.setHours(0, 0, 0, 0);
  return reset.getTime();
};

const readState = (): RateLimitState => {
  const raw = localStorage.getItem(KEY);
  const parsed = raw ? JSON.parse(raw) as RateLimitState : { count: 0, resetTime: midnightTomorrow() };
  if (Date.now() > parsed.resetTime) {
    return { count: 0, resetTime: midnightTomorrow() };
  }
  return parsed;
};

export function useRateLimit() {
  const [state, setState] = useState<RateLimitState>(() => readState());

  const persist = useCallback((next: RateLimitState) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    setState(next);
  }, []);

  const increment = useCallback(() => {
    const fresh = readState();
    persist({ ...fresh, count: fresh.count + 1 });
  }, [persist]);

  return useMemo(() => ({
    count: state.count,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - state.count),
    isLimited: state.count >= LIMIT,
    message: 'Daily limit reached / آج کی حد پوری ہوئی',
    increment,
  }), [state.count, increment]);
}

