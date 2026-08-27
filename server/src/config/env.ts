import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Check for missing environment variables
export function validateEnv() {
  const warnings: string[] = [];

  if (!ENV.GEMINI_API_KEY) {
    warnings.push('⚠️ GEMINI_API_KEY is not set. Gemini AI responses will use fallback demo responses.');
  }

  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Auth verification and DB storage will use simulated session handling.');
  }

  if (warnings.length > 0) {
    console.log('\n================ ENVIRONMENT WARNINGS ================');
    warnings.forEach((w) => console.warn(w));
    console.log('======================================================\n');
  }
}
