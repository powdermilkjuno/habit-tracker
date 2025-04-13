// pages/api/user/shared/[code].js
import { supabase } from '@/lib/supabaseClient';
import rateLimit from 'express-rate-limit';

// =========== RATE LIMITER SETUP ===========
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  keyGenerator: (req) => {
    // Get IP from headers (works behind proxies like Vercel)
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests - try again later' });
  }
});

// =========== MAIN API HANDLER ===========
export default async function handler(req, res) {
  // 1. Apply rate limiter first
  try {
    await new Promise((resolve, reject) => {
      limiter(req, res, (result) => {
        if (result instanceof Error) reject(result);
        else resolve(result);
      });
    });
  } catch (error) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // 2. Existing validation
  const { code } = req.query;
  if (!/^\d{12}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid code format' });
  }

  // 3. Database query
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        username,
        height,
        weight,
        goal,
        share_code,
        created_at
      `)
      .eq('share_code', code)
      .single();

    if (error) throw error;
    res.status(200).json(data);
    
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
}

