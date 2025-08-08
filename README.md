# 📊 Pollify - MVP

Pollify is a simple, shareable, and real-time polls app that lets users create and participate in polls without authentication.  
The focus is on **ease of use**, **beautiful UI**, and **instant results updates**.

---

## 🚀 Features (MVP)

### User-Facing
- **Landing Page**
  - App name & logo
  - Short description of the app
  - Create Poll form:
    - Poll question
    - Add/remove options
    - Toggle: allow multiple selections
    - Toggle: require name/email (ON by default)
- **Poll Page (`/poll/:id`)**
  - Vote form:
    - Name/email inputs (if required)
    - Options list (radio or checkbox)
    - Submit vote button
  - Real-time results chart that updates instantly as votes come in
  - "Go Home" button
  - If poll is inactive → Only results are shown (no voting form)

### Admin-Facing
- **Admin Dashboard (`/admin`)**
  - List of polls with active/inactive toggle
  - Stats:
    - Total polls
    - Active polls
    - Total votes
    - Top voted poll
  - Charts showing poll engagement
  - Real-time updates when new votes come in

---

## ⚙️ Tech Stack

- **Frontend**: Vite + React + TailwindCSS  
- **Charts**: Recharts or Chart.js (React wrapper)  
- **Backend**: Supabase (PostgreSQL, Row Level Security, Realtime)  
- **Routing**: React Router  

---

## 🗄 Database Schema

### `polls`
| Column              | Type      | Notes |
|---------------------|-----------|-------|
| id (pk)             | uuid      | `gen_random_uuid()` |
| question            | text      | Poll question |
| allow_multiple      | boolean   | Default `false` |
| require_name_email  | boolean   | Default `true` |
| active              | boolean   | Default `true` |
| created_at          | timestamp | Default `now()` |

### `poll_options`
| Column     | Type      | Notes |
|------------|-----------|-------|
| id (pk)    | uuid      | `gen_random_uuid()` |
| poll_id    | uuid (fk) | → polls.id |
| option_text| text      | Option label |

### `votes`
| Column     | Type      | Notes |
|------------|-----------|-------|
| id (pk)    | uuid      | `gen_random_uuid()` |
| poll_id    | uuid (fk) | → polls.id |
| option_id  | uuid (fk) | → poll_options.id |
| name       | text      | Nullable |
| email      | text      | Nullable |
| created_at | timestamp | Default `now()` |

---

## 🔐 Security (RLS Policies)
- Allow **SELECT** from `polls`, `poll_options`, and `votes` for everyone.
- Allow **INSERT** into `votes` only if `polls.active = true`.
- Prevent updating or deleting votes from public.

---

## 🔄 Real-Time Updates
- Subscribe to `votes` table changes for a specific `poll_id`.
- Update the results chart instantly when a new vote is inserted.

---

## 📍 Flow Summary

1. **Landing Page** → User creates poll → Redirect to poll page.
2. **Poll Page** → User votes → Real-time results update for all connected viewers.
3. **Admin Page** → Manage polls, view stats, monitor votes in real time.

---

## 🖌 UI Guidelines
- Minimal, modern design
- Clear typography & spacing
- Friendly illustration on landing page
- Responsive for desktop & mobile
