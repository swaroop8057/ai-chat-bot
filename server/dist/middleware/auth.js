import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication token missing or malformed',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    // If Supabase is configured, verify with Supabase Auth
    if (isSupabaseConfigured() && supabaseAdmin) {
        try {
            const { data, error } = await supabaseAdmin.auth.getUser(token);
            if (error || !data.user) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired authentication session',
                });
                return;
            }
            req.user = {
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            };
            next();
            return;
        }
        catch (err) {
            console.error('Error verifying Supabase token:', err);
            res.status(401).json({
                success: false,
                error: 'Failed to authenticate user',
            });
            return;
        }
    }
    // Development/Demo fallback authentication when Supabase is not connected
    if (token === 'demo-token' || token.startsWith('demo-')) {
        req.user = {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'demo@askflow.ai',
            name: 'Alex Demo',
        };
        next();
        return;
    }
    // Try decoding base64 payload if token is demo-encoded
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        if (decoded && decoded.id && decoded.email) {
            req.user = {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name || decoded.email.split('@')[0],
            };
            next();
            return;
        }
    }
    catch {
        // Ignore error and fall through
    }
    // Default fallback user for dev sandbox
    req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'user@askflow.ai',
        name: 'AskFlow User',
    };
    next();
}
