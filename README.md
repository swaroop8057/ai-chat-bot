# ⚡ AskFlow AI - Full-Stack AI Application

AskFlow AI is a modern, responsive full-stack conversational AI application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js/Express**, **Supabase Auth & PostgreSQL**, and the **Google Gemini API** using the official `@google/genai` SDK.

---

## 🌟 Key Features

- 🔐 **Authentication & Security**:
  - User signup with name, email, and password.
  - User login & session persistence.
  - Protected client routes with React Router.
  - Supabase JWT token verification on the Express backend.
  - PostgreSQL **Row Level Security (RLS)** ensuring users only access their own conversations and messages.
  - **Zero Key Exposure**: Gemini API key and Supabase service-role key are strictly kept on the Node.js backend.
- 📱 **Responsive UI & Navigation**:
  - Left sidebar navigation (**Dashboard** and **AI Chatbot**).
  - Collapsible mobile drawer with hamburger menu.
  - Bottom user profile bar displaying logged-in user's name, email, and one-click logout.
- 📊 **Dashboard**:
  - Personalized welcome message (*"Welcome back, {User Name}!"*).
  - **Total AI Conversations** metric card with quick navigation.
  - **Start New Chat** call-to-action button card.
- 💬 **AI Chatbot**:
  - Real-time conversation view powered by Google Gemini (`@google/genai`).
  - Multi-turn conversation context history.
  - Markdown rendering with syntax highlighting and copy-to-clipboard buttons.
  - Starter prompt pills for instant idea generation.
  - Dynamic auto-expanding chat input with keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline).
  - Full chat history with delete & new conversation options.
- 🛡️ **Robust Backend & Validation**:
  - Request validation using **Zod** schemas.
  - Centralized error handler and CORS protection.
  - PostgreSQL schema migrations with cascade deletion triggers.

---

## 📁 Clean Folder Structure

```
pb/
├── client/                     # Frontend Application (React + TS + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/           # ChatBubble, ChatInput, ConversationList
│   │   │   ├── common/         # ProtectedRoute, LoadingSpinner
│   │   │   └── layout/         # AppLayout, Sidebar
│   │   ├── context/            # AuthContext (Supabase Auth provider)
│   │   ├── lib/                # supabase.ts, api.ts
│   │   ├── pages/              # Login, Signup, Dashboard, Chatbot
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Route definitions
│   │   ├── index.css           # Tailwind design tokens & styling
│   │   └── main.tsx            # Entry point
│   ├── .env.example            # Client environment template
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Backend Application (Node.js + Express + TS)
│   ├── src/
│   │   ├── config/             # Environment variables loader
│   │   ├── lib/                # gemini.ts (@google/genai), supabase.ts, database.ts
│   │   ├── middleware/         # auth.ts, validate.ts (Zod), errorHandler.ts
│   │   ├── routes/             # chat.routes.ts, conversation.routes.ts
│   │   ├── schemas/            # Zod validation schemas
│   │   └── server.ts           # Express server entry point
│   ├── .env.example            # Server environment template
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   └── schema.sql              # PostgreSQL schema & Row Level Security (RLS) policies
├── package.json                # Root package for concurrently running client & server
└── README.md
```

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

From the project root:

```bash
# Install root, server, and client dependencies
npm run install:all
```

Or install in each directory individually:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

---

### Step 2: Set Up Supabase Database & Auth

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. In your Supabase Dashboard, navigate to the **SQL Editor**.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql), copy its contents, paste into the SQL Editor, and click **Run**.
   - This creates the `conversations` and `messages` tables.
   - It sets up foreign key references to `auth.users`.
   - It enables **Row Level Security (RLS)** with user isolation policies.
4. Retrieve your API credentials from **Project Settings > API**:
   - `Project URL`
   - `anon public` key
   - `service_role secret` key

---

### Step 3: Get a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Create API Key**.
3. Copy your API key.

---

### Step 4: Configure Environment Variables

#### 1. Backend (`server/.env`):
Create `server/.env` (or copy from `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Google Gemini API Key from Google AI Studio
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Supabase Admin Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

#### 2. Frontend (`client/.env`):
Create `client/.env` (or copy from `client/.env.example`):

```env
# Supabase Client Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

---

### Step 5: Run the Application

From the root directory, start both the client and server concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Backend Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔒 Security Architecture

1. **Client Isolation**:
   - The frontend communicates only with Supabase Auth for login/signup tokens and the Express backend for chat requests.
   - The Gemini API Key and Supabase `service_role` key are **never** bundled into the client build.
2. **Backend Authentication**:
   - The Express middleware (`server/src/middleware/auth.ts`) validates the Supabase JWT Bearer token on every protected API call.
3. **Database Row Level Security (RLS)**:
   - All queries and mutations in PostgreSQL enforce `auth.uid() = user_id`.
   - Users cannot view, modify, or delete conversations and messages belonging to other users.
4. **Input Validation**:
   - All incoming API payloads are strictly validated using **Zod** (`server/src/schemas/chat.schema.ts`).

---

## 🧪 Testing and Verification

- To run the server independently:
  ```bash
  npm run dev:server
  ```
- To run the client independently:
  ```bash
  npm run dev:client
  ```
- To build for production:
  ```bash
  npm run build
  ```

---

## 💡 Sandbox Preview Mode

For instant local testing before configuring Supabase or Gemini API keys, AskFlow AI includes a **built-in Sandbox Preview Mode**:
- Click **"Instant Demo Login"** on the login screen to sign in as **Alex Rivers**.
- The backend will gracefully simulate responses and in-memory chat sessions until you add your live keys.
