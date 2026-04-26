<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI-NVIDIA%20MiniMax-76b900?style=for-the-badge&logo=nvidia" alt="NVIDIA AI" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

<h1 align="center">💕 Heart2Heart</h1>
<h3 align="center"><em>AI-Powered Daily Activities That Strengthen Real Relationships</em></h3>

<p align="center">
  Heart2Heart uses AI to generate personalized daily couple activities based on mood, love language, and comfort level — turning everyday moments into meaningful connections.
</p>

---

## 🎯 The Problem

Modern couples are busy. Date nights get postponed, conversations become transactional, and emotional intimacy fades into routine. Generic "relationship tips" don't work because every couple is different.

## 💡 Our Solution

Heart2Heart is a **real-time relationship engagement platform** that:

1. **Learns** each partner's love language, mood, and comfort level
2. **Generates** a personalized daily activity using AI (not random — *contextual*)
3. **Tracks** completion, feedback, and emotional trends over time
4. **Adapts** future tasks based on what actually worked

> Think of it as a personal relationship coach that lives in your pocket — backed by AI, grounded in behavioral science.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Task Generation** | NVIDIA MiniMax M2.7 generates unique daily activities tailored to mood, love language, and comfort level |
| 💑 **Partner Linking** | 6-character invite codes to connect couples in real-time with live presence tracking |
| 📊 **Connection Score** | Dynamic score calculated from task quality (80%) and consistency (20%) |
| 🎭 **Mood Check-ins** | Emoji-based mood selector with optional partner sharing |
| 📈 **Activity Timeline** | Full history of completed activities with ratings and emotional trends |
| ⚙️ **Preferences** | Sound effects, notification controls, and relationship settings |
| 🔊 **Sound Design** | Premium audio feedback (clicks, success chimes) respecting user preferences |
| 🛡️ **Admin Dashboard** | Full admin panel with user management, couple oversight, and AI monitoring |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Landing  │  │Dashboard │  │ Settings │  ...       │
│  │  Page    │  │  + Feed  │  │  + Prefs │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │                │
│  Firebase Auth ──────┴──────────────┘                │
│  Firebase Firestore (real-time sync)                 │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │     API Routes          │
        │  /api/generate-task     │──▶ NVIDIA AI (MiniMax M2.7)
        │  /api/tasks             │
        │  /api/couples           │──▶ Supabase (Postgres)
        │  /api/mood              │
        │  /api/auth/sync         │──▶ Firebase Admin SDK
        │  /api/admin/*           │
        └─────────────────────────┘
```

### Dual Database Strategy

| Layer | Database | Why |
|---|---|---|
| **Frontend real-time** | Firebase Firestore | Instant UI updates, presence, preferences |
| **Backend relational** | Supabase (Postgres) | Couples, tasks, feedback, mood — with RLS policies |
| **Auth** | Firebase Authentication | Google Sign-In, email/password |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (Auth + Firestore enabled)
- Supabase project (run `schema.sql`)
- NVIDIA API key ([NVIDIA NIM](https://build.nvidia.com/))

### 1. Clone & Install

```bash
git clone https://github.com/Kittu2007/heart2heart.git
cd heart2heart
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for API routes)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI
NVIDIA_API_KEY=your_nvidia_api_key
```

### 3. Database Setup

Run the schema on your Supabase project:

```bash
node run-schema.js
# or paste schema.sql directly into Supabase SQL Editor
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
heart2heart/
├── app/
│   ├── (app)/                    # Authenticated app routes
│   │   ├── dashboard/            # Main dashboard with tasks, mood, partner status
│   │   ├── connect/              # Partner linking via invite codes
│   │   ├── onboarding/           # Love language & comfort level setup
│   │   ├── settings/             # Preferences, notifications, relationship config
│   │   └── timeline/             # Activity history & connection score trends
│   ├── (auth)/                   # Auth routes (login, register)
│   ├── api/                      # Backend API routes
│   │   ├── generate-task/        # AI-powered task generation (NVIDIA)
│   │   ├── tasks/                # CRUD for daily tasks
│   │   ├── couples/              # Couple creation & joining
│   │   ├── mood/                 # Mood check-in endpoints
│   │   ├── auth/sync/            # Firebase ↔ Supabase user sync
│   │   └── admin/                # Admin panel APIs
│   └── components/
│       ├── landing/              # Landing page (Hero, Features, Testimonials)
│       └── dashboard/            # Dashboard components (TaskCard, MoodSelector, etc.)
├── lib/
│   ├── auth/                     # Firebase Admin token verification, auth middleware
│   ├── supabase/                 # Supabase client + admin (lazy init for Vercel)
│   └── ai/                       # AI operation logging
├── utils/
│   ├── firebase/client.ts        # Firebase client SDK config
│   └── sound.ts                  # Audio engine with preference-aware playback
└── schema.sql                    # Full Postgres schema with RLS policies
```

---

## 🧠 How the AI Works

```mermaid
graph LR
    A[User Mood] --> D[AI Prompt]
    B[Love Language] --> D
    C[Comfort Level 1-5] --> D
    D --> E[NVIDIA MiniMax M2.7]
    E --> F[Personalized Task JSON]
    F --> G[Dashboard Card]
```

The AI receives a structured prompt combining the user's current emotional state, preferred love language, and relationship comfort level. It returns a JSON payload with:

- **title** — Short, actionable activity name
- **description** — Detailed instructions
- **category** — Activity type (communication, quality time, etc.)
- **intensity** — 1–5 scale matching the couple's comfort level

---

## 📊 Connection Score Algorithm

```
Score = (Quality × 0.8) + (Consistency × 0.2)

Quality    = Average feedback rating (1–5) normalized to 0–100
Consistency = min(completedTasks / 30, 1.0) × 100
```

The score rewards couples who both **enjoy** their tasks (quality) and **show up** regularly (consistency), with quality weighted 4× higher because a forced routine without joy is counterproductive.

---

## 🔐 Security

- **Row Level Security (RLS)** on all Supabase tables — users can only access their own data
- **Firebase Admin SDK** verifies tokens server-side in API routes
- **Edge middleware** forwards auth headers without exposing secrets
- **Lazy initialization** — credentials are never evaluated at build time

---

## 🚢 Deployment (Vercel)

1. Connect the GitHub repo to [Vercel](https://vercel.com)
2. Set all environment variables from `.env.local` in Vercel's dashboard
3. Deploy — the build is pre-verified to pass cleanly

---

## 👥 Team

Built with ❤️ for the hackathon.

| Name | Role |
|---|---|
| **Chaitanya** | Frontend, UI/UX, Firebase Integration |
| **Sanigdh** | Backend APIs, Supabase, Auth Flow |

---

## 📝 License

This project is built for a hackathon and is not currently licensed for production use.
