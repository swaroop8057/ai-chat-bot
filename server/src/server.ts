import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV, validateEnv } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import conversationRoutes from './routes/conversation.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Validate environment variables on startup
validateEnv();

const app: Express = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins in dev or specific origins
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Public Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    app: 'AskFlow AI Server',
    time: new Date().toISOString(),
    env: ENV.NODE_ENV,
    geminiConfigured: !!ENV.GEMINI_API_KEY,
    supabaseConfigured: !!(ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY),
  });
});

// Protected API Routes (Supabase Auth protected)
app.use('/api/conversations', requireAuth, conversationRoutes);
app.use('/api/chat', requireAuth, chatRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Start listening
const server = app.listen(ENV.PORT, () => {
  console.log(`\n🚀 AskFlow AI Server is running on http://localhost:${ENV.PORT}`);
  console.log(`📡 Health check available at http://localhost:${ENV.PORT}/api/health\n`);
});

export default app;
