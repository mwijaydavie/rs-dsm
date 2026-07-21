# Supabase Role Setup Guide — Dar es Salaam Road Safety

## 📋 Overview

This project uses **Supabase Auth** with role-based access control. Roles are stored in two places:

1. **`UserProfile.role`** (PostgreSQL table) — the source of truth
2. **`auth.users.raw_app_metadata`** (Supabase Auth) — fast path for middleware (like Firebase custom claims)

When a user's role changes in `UserProfile`, a **database trigger** automatically syncs it to `auth.users.raw_app_metadata`. The middleware reads `app_metadata.role` directly without a DB query.

---

## 🚀 Step 1: Run the SQL Migration

Open your **Supabase Dashboard → SQL Editor** and run the entire contents of:

```
prisma/supabase-app-metadata-sync.sql
```

This will:

- ✅ Create a trigger that syncs `UserProfile.role` → `auth.users.raw_app_metadata`
- ✅ Backfill roles for all existing users
- ✅ Set `roadsafetydar@gmail.com` as admin
- ✅ Create RLS policies for `UserProfile` table
- ✅ Create a helper function `manually_sync_role()`

---

## 🛠️ Step 2: Manually Set a User's Role (via Dashboard)

### Option A: Using SQL Editor (Recommended)

```sql
-- Set user as admin
UPDATE auth.users
SET raw_app_metadata = raw_app_metadata || jsonb_build_object('role', 'admin')
WHERE email = 'user@example.com';

-- Also update UserProfile if it exists
UPDATE public."UserProfile"
SET role = 'admin'
WHERE "supabaseUid" = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### Option B: Using Table Editor

1. Go to **Supabase Dashboard → Table Editor**
2. Open the `UserProfile` table
3. Find the user by email
4. Edit the `role` column: `community`, `police`, `tanroads`, `researcher`, or `admin`
5. The trigger will automatically sync to `app_metadata`

---

## 🔐 Step 3: Verify the Role is Set

After setting the role, verify it's working:

```sql
-- Check app_metadata
SELECT id, email, raw_app_metadata->>'role' AS role
FROM auth.users
WHERE email = 'user@example.com';

-- Check UserProfile
SELECT up."userId", up.role, up."supabaseUid"
FROM public."UserProfile" up
JOIN auth.users u ON u.id = up."supabaseUid"::uuid
WHERE u.email = 'user@example.com';
```

---

## 🧪 Step 4: Test on the Frontend

1. **Sign out** and **sign back in** (or click "Fix My Role" in the user menu)
2. Navigate to protected routes:
   - `/editor` — requires `police` or `tanroads` role
   - `/authority` — requires `tanroads` or `police` role
3. If you still can't access, click **"🔄 Fix My Role"** in the user menu dropdown

---

## 📖 Role Definitions

| Role | Access | Description |
|------|--------|-------------|
| `community` | Dashboard, Report | Default role — can view data and submit reports |
| `police` | Dashboard, Report, Editor Queue | Can verify/reject accident reports |
| `tanroads` | Dashboard, Report, Editor Queue, Authority Console | Full admin access |
| `researcher` | Dashboard, Report | Can access data exports |
| `admin` | Everything | Superuser (set via `isSuperuser` flag) |

---

## 🔄 How the Sync Works

```
UserProfile.role updated
        │
        ▼
PostgreSQL Trigger (sync_role_to_app_metadata)
        │
        ▼
auth.users.raw_app_metadata.role updated
        │
        ▼
Middleware reads app_metadata (fast path)
        │
        ▼
Route guard allows/denies access
```

### API Endpoints that Sync Role

| Endpoint | When it syncs |
|----------|---------------|
| `POST /api/auth/register` | On user registration |
| `POST /api/auth/sync-role` | On demand (click "Fix My Role") |
| `GET /api/auth/me` | On login (for hardcoded admin) |
| `POST /api/admin/users` | When admin changes a user's role |

---

## 🐛 Troubleshooting

### "I'm logged in but can't access /editor or /authority"

1. Click your avatar → **"🔄 Fix My Role"** in the user menu
2. If that doesn't work, run this SQL in Supabase Dashboard:

```sql
-- Check what role is currently set
SELECT u.email, u.raw_app_metadata->>'role' AS app_role, up.role AS profile_role
FROM auth.users u
LEFT JOIN public."UserProfile" up ON up."supabaseUid"::uuid = u.id
WHERE u.email = 'your-email@example.com';

-- Force sync
SELECT public.manually_sync_role(
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'admin'  -- or 'police', 'tanroads', etc.
);
```

### "Google OAuth users don't have the right role"

Google OAuth users need to be linked to a `UserProfile` record. If the user exists in your `User` table by email, the `/api/me` endpoint will auto-link them. Otherwise:

1. Find the user's Supabase UID: `SELECT id, email FROM auth.users WHERE email = '...'`
2. Create a UserProfile: 
```sql
INSERT INTO public."UserProfile" ("userId", role, "supabaseUid", phone)
VALUES (1, 'admin', 'USER_SUPABASE_UID', '+255700000000')
ON CONFLICT ("userId") DO UPDATE SET role = 'admin', "supabaseUid" = EXCLUDED."supabaseUid";
```

---

## 🏗️ Architecture Decision

We chose **`app_metadata`** over **`user_metadata`** because:

- `app_metadata` is **read-only from the client** — users can't modify their own role
- `user_metadata` is **writable from the client** — users could escalate privileges
- `app_metadata` is the Supabase equivalent of **Firebase Custom Claims**

The database trigger ensures consistency even if the API call to update `app_metadata` fails.