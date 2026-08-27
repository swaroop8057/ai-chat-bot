import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  isDemo?: boolean;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication token missing or malformed',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Check if token is an explicit demo token
  if (token === 'demo-token' || token.startsWith('demo-')) {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@askflow.ai',
      name: 'Alex Demo',
      isDemo: true,
    };
    next();
    return;
  }

  // 2. Check if token is a base64 encoded demo user object
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (decoded && (decoded.id || decoded.email)) {
      req.user = {
        id: decoded.id || '00000000-0000-0000-0000-000000000001',
        email: decoded.email || 'user@askflow.ai',
        name: decoded.name || decoded.email?.split('@')[0] || 'AskFlow User',
        isDemo: true,
      };
      next();
      return;
    }
  } catch {
    // Not a base64 demo token, proceed to Supabase verification
  }

  // 3. If Supabase is configured, verify with Supabase Auth
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication session. Please sign out and sign in again.',
        });
        return;
      }

      req.user = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        isDemo: false,
      };

      next();
      return;
    } catch (err) {
      console.error('Error verifying Supabase token:', err);
      res.status(401).json({
        success: false,
        error: 'Failed to authenticate user with Supabase',
      });
      return;
    }
  }

  // 4. Default fallback user for dev sandbox
  req.user = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'user@askflow.ai',
    name: 'AskFlow User',
    isDemo: true,
  };
  next();
}

