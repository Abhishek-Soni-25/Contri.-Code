# Contri. Code — AI-Native Collaborative Desktop IDE

**Contri. Code** is a desktop-based developer IDE built with **Tauri v2**, **React**, **TypeScript**, and **Rust**.

It allows developers to work on the same codebase simultaneously without creating or configuring a Git repository:
- **User 1 (Host)** creates a project on their local machine.
- **Contri. Code** automatically syncs the codebase and AI chat history to Supabase.
- **User 1** shares a generated **Secret Key** (e.g. `CC-X9A2-P4M1`) with **User 2**.
- **User 2** enters the Secret Key in their app and gains instant access to User 1's codebase and shared AI chat history — no Git setup, no manual environment configuration!

---

## 🛠️ Tech Stack

- **Desktop Shell**: Tauri v2 + Rust
- **Frontend Framework**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Backend & Storage**: Supabase (PostgreSQL DB, Row-Level Security, Storage Buckets & Realtime WebSocket channels)
- **AI Intelligence**: Google Gemini 2.5 Flash API (`@google/genai`)

---

## 🚀 Quick Start & How to Run the Server

### 1. Prerequisites (Ubuntu / Linux)

Ensure Node.js (v18+), Rust, and WebKit GTK build tools are installed:

```bash
# Install system dependencies for Linux
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Install Node.js dependencies
npm install
```

### 2. Configure Environment Variables (`.env`)

Create or edit `.env` in the project root directory:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BUCKET_NAME=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

### 3. Start the Development Server

You can run the app in two modes:

#### Option A: Web / Vite Dev Server (Fastest for testing UI & Supabase sync)
```bash
npm run dev
```
Open your browser at `http://localhost:1420`.

#### Option B: Full Desktop Application (Tauri + Rust native window)
```bash
npm run tauri dev
```

---

## 🪟 Windows Setup Instructions (Step-by-Step)

If you are setting up Contri. Code on a **Windows 10/11** laptop, follow these steps:

### Step 1: Install C++ Build Tools
Tauri requires Microsoft C++ Build Tools to compile Rust code on Windows.
1. Download **Visual Studio Installer** from [visualstudio.microsoft.com/downloads](https://visualstudio.microsoft.com/downloads/).
2. Select **Desktop development with C++** workload.
3. Ensure the following components are selected:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 11 (or 10) SDK
4. Click **Install**.

### Step 2: Install Rust
1. Download `rustup-init.exe` from [rustup.rs](https://rustup.rs/).
2. Run `rustup-init.exe` in Command Prompt or PowerShell.
3. Choose Option `1` (Proceed with installation - default).
4. Restart your terminal.

### Step 3: Install Node.js
1. Download Node.js LTS (v20+) from [nodejs.org](https://nodejs.org/).
2. Verify installation:
   ```cmd
   node -v
   npm -v
   ```

### Step 4: Clone & Run Contri. Code on Windows
1. Open PowerShell or Command Prompt as Administrator and run:
   ```cmd
   git clone <your-repo-url>
   cd contri-code
   npm install
   ```
2. Create `.env` in the root folder with your Supabase credentials.
3. Launch the desktop app:
   ```cmd
   npm run tauri dev
   ```

---

## 🗄️ Supabase Setup: Tables & Policies Guide

To run Contri. Code with a fresh Supabase project, execute the following SQL statements in the **Supabase SQL Editor**:

### 1. Create Tables

```sql
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#ff5a27',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  secret_key TEXT UNIQUE NOT NULL,
  technology TEXT DEFAULT 'TypeScript',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Project Members Table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'GUEST' CHECK (role IN ('HOST', 'REVIEWER', 'GUEST')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- 4. Shared AI Chats Table
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT DEFAULT 'Dev',
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Enable Row-Level Security (RLS) & Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles reading" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Projects Policies
CREATE POLICY "Read projects by secret key or membership" ON projects FOR SELECT USING (true);
CREATE POLICY "Users insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners update projects" ON projects FOR UPDATE USING (true);

-- Members Policies
CREATE POLICY "Select project members" ON project_members FOR SELECT USING (true);
CREATE POLICY "Insert project members" ON project_members FOR INSERT WITH CHECK (true);

-- AI Chats Policies
CREATE POLICY "Select ai chats" ON ai_chats FOR SELECT USING (true);
CREATE POLICY "Insert ai chats" ON ai_chats FOR INSERT WITH CHECK (true);
```

### 3. Create Storage Bucket & Enable Realtime

1. In Supabase Dashboard, navigate to **Storage** → Create Bucket named `codebase` (Public access allowed).
2. Navigate to **Database** → **Replication** → Enable `ai_chats` table for `supabase_realtime`.

---

## ⚔️ Approach for Collaborative Conflict Resolution

When multiple users (e.g. User 1 & User 2) edit the **same file** simultaneously, deciding whose changes become final requires a clear architectural strategy:

### Recommended 3-Tier Strategy:

1. **Tier 1: Last-Write-Wins with Optimistic Locking (Recommended for MVP)**
   - Every file edit includes an `updated_at` version timestamp.
   - When User 2 saves, if `server_updated_at > user2_opened_at`, Contri. Code flags a conflict notice:
     `"⚠️ User 1 modified this file 10 seconds ago. Merge or Keep Yours?"`
   - Gives users explicit control before overwriting code.

2. **Tier 2: Soft File Locking**
   - When User 1 clicks into a file, a temporary record in `file_locks` table marks the file as `[Editing by User 1]`.
   - User 2 sees a read-only view with a lock badge.
   - Locks auto-expire after 3 minutes of inactivity.

3. **Tier 3: Operational Transformation (OT) / CRDTs (Real-Time Google Docs Style)**
   - Using **Yjs** + **y-monaco** library bound to Monaco Editor.
   - Syncs character-by-character edits and live user cursors via Supabase Realtime WebSockets.
