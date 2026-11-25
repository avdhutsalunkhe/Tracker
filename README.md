# Tracker — Daily Habit & GATE Study PWA

**Tracker** is a complete, production-ready Progressive Web App (PWA) designed for personal daily routine discipline and serious GATE examination preparation.

There is **no custom backend server**—all data persistence and authentication communicate directly between the frontend and **Supabase** (PostgreSQL + Auth + Row Level Security), and the app builds and deploys cleanly as a static site on **Netlify**.

---

## 🌟 Key Features

### 1. Daily Checklist & Habit Routine ("Today" View)
- **Recurring Daily Habits:** Grouped by time-of-day slots (`Morning`, `Afternoon`, `Evening`, `Anytime`).
- **One-Tap Checkmarks:** Instant optimistic UI update with subtle audio pop and immediate database sync.
- **One-Off Tasks:** Schedule date-specific tasks with priority indicators (`Low`, `Medium`, `High`).
- **GATE Exam Countdown Widget:** Pinned live banner with Days Remaining until your exam date (default: `2027-02-06`), daily focus hours progress bar, and consecutive habit streak.
- **Smart "What to Study Next?":** Pure frontend recommendation engine prioritizing:
  1. Overdue Spaced Repetition Revisions
  2. Revisions Due Today
  3. Weakness booster (Confidence ≤ 2 topics)
  4. In-progress syllabus modules
  With a 1-click **"Start Focus Timer"** button.

### 2. Interactive Calendar & 365-Day Consistency Heatmap
- **Monthly Calendar Grid:** Visual completion indicators on each date (habit completion % bar + secondary emerald dot for GATE topics/revisions/focus sessions).
- **Day Detail Slide-Over Drawer:** Click any date to view all habits checked/missed (with ability to toggle retroactively!), tasks, topics covered, and study sessions.
- **GitHub-Style 365-Day Heatmap:** Full-year consistency grid shaded by daily consistency score (habits + focus hours).

### 3. GATE Preparation Tracker ("GATE Study" View)
- **Subject Management:** Create, color-tag, and edit GATE subjects.
- **1-Click Syllabus Seeding:** Instant presets for CS/IT, Data Science & AI (DA), Electronics (EC), Mechanical (ME), Electrical (EE).
- **Topic Coverage Logger:** Subject, Topic Name, Status (`Not Started`, `In Progress`, `Completed`), 1–5 Star Confidence Rating, PYQs Solved, Study Hours, and Short Formula Notes.
- **Filterable & Searchable Syllabus Table:** Instant search by name, notes, or subject with in-line status dropdowns.

### 4. Spaced Repetition & Revision Queue ("Revisions" View)
- Automated spaced repetition schedule upon topic completion (`+1d → +3d → +7d → +15d → +30d → +60d`).
- Three dedicated queue sections:
  - **Overdue** (highlighted in Rose `#F43F5E`)
  - **Due Today** (highlighted in Amber `#F59E0B`)
  - **Upcoming (Next 7 Days)**
- One-tap **"Mark Revised"** button with optional remarks and revision history log.

### 5. Integrated Focus & Pomodoro Timer ("Timer" View)
- **Two Modes:**
  - **Pomodoro Mode:** Presets for `25/5`, `50/10`, `90/15`, or custom durations with SVG circular progress ring.
  - **Deep Focus Stopwatch:** Count-up timer for mock tests and long problem blocks.
- **Subject & Topic Linking:** Link sessions directly to syllabus topics.
- **Auto-Log & Audio Chimes:** Sessions ≥ 1 minute auto-save to `study_sessions`, increment topic study hours, and play gentle Web Audio chimes (100% offline, zero external audio assets).
- **Persistent Floating Mini-Timer:** Keeps ticking in the top header when navigating between pages.

### 6. Mock Test Scoreboard & Mistake Notebook ("Tests & Mistakes" View)
- **Test Logger:** Record Full-Length Tests, Subject Tests, or PYQ papers with marks scored, total marks, correct / wrong / unattempted counts, and negative marks lost.
- **Performance & Accuracy Trend Line:** Responsive Recharts line chart tracking score % and accuracy % over time.
- **Mistake Notebook:** Categorize errors (`Conceptual Gap`, `Silly / Calculation`, `Formula Forgotten`, `Time Pressure`) with a mandatory **"Rule to Remember"** and an unresolved toggle so you can review mistakes before test day.

### 7. Formula Vault & Rapid-Fire Flashcards ("Vault" View)
- **3D Flip-Card UI:** Front = Prompt/Concept, Back = Solution/Formula, with keyboard controls (Space/Enter to flip, Arrow keys to navigate).
- **Formula Table:** Searchable repository of formulas filtered by subject.
- **"Needs Review" Toggle:** Filter down to challenging formulas on the go.

### 8. Analytics & Weakness Radar ("Analytics" View)
- 365-Day Consistency Heatmap.
- 14-Day Study Hours Bar Chart vs daily goal reference line.
- Subject Study Time Distribution Donut Chart.
- Weakness Priority Matrix surfacing topics with Confidence ≤ 2.

### 9. Command Palette (`Ctrl+K`) & Data Backup
- Press `Ctrl+K` (or `Cmd+K` on Mac) anywhere to search topics, formulas, jump to pages, or start the timer.
- 1-click **Complete JSON Backup** and **CSV Topic Export** in Settings.
- Works offline out-of-the-box with local browser storage, and syncs seamlessly with Supabase when authenticated.

---

## 🎨 Visual Design & Palette

- **Day (Light) Mode:**
  - Background: `#F8FAFC` (Slate 50)
  - Surface: `#FFFFFF` with `#E2E8F0` (Slate 200) borders
  - Primary Text: `#0F172A` | Secondary: `#475569`
  - Accent: `#4F46E5` (Indigo 600)
- **Night (Dark) Mode:**
  - Background: `#0B1120` (Deep Slate)
  - Surface: `#111827` / `#1E293B` with `#334155` borders
  - Primary Text: `#F1F5F9` | Secondary: `#94A3B8`
  - Accent: `#6366F1` (Indigo 500)
- **Semantic Accents:** Emerald (`#10B981`) for completed, Amber (`#F59E0B`) for revisions due, Rose (`#F43F5E`) for overdue/weakness.

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (`darkMode: 'class'`) + `lucide-react` icons
- **Charts:** `recharts`
- **Database & Auth:** `@supabase/supabase-js` (PostgreSQL + RLS)
- **PWA:** `vite-plugin-pwa` (Workbox offline precaching, web manifest, 192x192 & 512x512 icons)
- **Date Utilities:** `date-fns`
- **Routing:** `react-router-dom`
- **Deployment:** Netlify static build (`dist/`) with SPA redirects configured in `netlify.toml`

---

## 🚀 Setup Instructions

### Step 1: Set up Supabase Database & Auth

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql) in this repository, copy its entire contents, paste it into the Supabase SQL Editor, and click **Run**.
   - This creates all 11 tables with foreign keys, indexes, triggers, and Row Level Security (RLS) policies ensuring complete personal data isolation.
4. Go to **Project Settings → API** in Supabase and copy:
   - **Project URL**
   - **Project API anon / public key**

### Step 2: Configure Environment Variables

Create a `.env` file in the project root (you can copy `.env.example`):

```bash
cp .env.example .env
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

*(Note: If you run Tracker without Supabase keys, the app automatically runs in a fully-functional local offline demo mode so you can test all features immediately!)*

### Step 3: Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Step 4: Build for Production

```bash
npm run build
```

The production assets and PWA service worker are output to `dist/`.

---

## 🌐 Deploying to Netlify

Tracker is pre-configured for 1-click Netlify deployment with `netlify.toml`:

### Option A: Using Netlify Git Integration
1. Push this repository to GitHub or GitLab.
2. In Netlify, click **"Add new site" → "Import an existing project"**.
3. Select your repository. Netlify will auto-detect:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Under **Site configuration → Environment variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase Anon Key
5. Click **Deploy**.

### Option B: Using Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://your-project-id.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"
netlify deploy --prod
```

The `netlify.toml` automatically handles SPA client-side routing (`/*` to `/index.html`) so refreshing any page route works seamlessly.

---

## 📱 Installing as a PWA

- **On Mobile (Chrome / Android):** Tap the browser menu `⋮` and select **"Add to Home screen"** or **"Install App"**.
- **On iOS (Safari):** Tap the **Share** button `⎋` and choose **"Add to Home Screen"**.
- **On Desktop (Chrome / Edge):** Click the install icon in the address bar.
