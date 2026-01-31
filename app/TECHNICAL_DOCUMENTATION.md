# CertiHub — Technical Documentation

## 1. Project Overview

**CertiHub** is a blockchain-verified certificate management platform that enables educational institutions to issue, store, and verify digital certificates. It uses **Supabase** for data storage and **ethers.js** for cryptographic anchoring of certificate hashes.

### 1.1 Key Features

- **Multi-role authentication**: Students (user), Institutions (admin), Super Admin
- **Certificate issuance**: Institutions issue certificates to students with unique IDs
- **Blockchain anchoring**: Certificate hashes stored for tamper-proof verification
- **Public verification**: Anyone can verify a certificate by unique ID
- **Messaging**: In-app support messaging between users, institutions, and admins
- **Activity logging**: Audit trail for certificates, verifications, and admin actions

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  React 19 + TypeScript + Vite                                │ │
│  │  - AuthContext (session)                                     │ │
│  │  - Hash-based routing (#/verify, #/admin, etc.)              │ │
│  │  - Services: auth, certificate, blockchain, messaging        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    │ REST / RPC                │ REST / RPC
                    ▼                           ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│     Supabase (BaaS)          │   │   Blockchain (Optional)       │
│  - Auth (email/password)     │   │   - ethers.js keccak256       │
│  - PostgreSQL Database       │   │   - Hash storage/verification │
│  - Row Level Security        │   │   - Supabase blockchain_      │
│  - Realtime (optional)       │   │     anchors table             │
└──────────────────────────────┘   └──────────────────────────────┘
```

### 2.2 Data Flow Modes

| Mode | Condition | Auth | Data Storage | Blockchain |
|------|-----------|------|--------------|------------|
| **Supabase** | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set | Supabase Auth | Supabase PostgreSQL | Supabase `blockchain_anchors` + local fallback |
| **Local** | Env vars missing | localStorage | localStorage | localStorage (simulated) |

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.9.x | Type safety |
| Vite | 7.x | Build tool, dev server, HMR |
| Tailwind CSS | 3.x | Utility-first styling |
| Radix UI | Various | Accessible primitives |
| Framer Motion | 12.x | Animations |
| React Hook Form | 7.x | Form state |
| Zod | 4.x | Schema validation |
| Sonner | 2.x | Toast notifications |
| Lucide React | 0.56x | Icons |

### 3.2 Backend / Services

| Technology | Purpose |
|------------|---------|
| Supabase | Auth, PostgreSQL, REST API |
| ethers.js | Keccak256 hashing for certificate integrity |

### 3.3 Development

| Technology | Purpose |
|------------|---------|
| ESLint | Linting |
| PostCSS | CSS processing |
| UUID | Unique ID generation |

---

## 4. Application Structure

### 4.1 Directory Layout

```
app/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Radix-based primitives (button, dialog, etc.)
│   │   ├── HelpSupport.tsx
│   │   └── Navigation.tsx
│   ├── context/
│   │   └── AuthContext.tsx   # Auth state provider
│   ├── hooks/
│   │   └── use-mobile.ts    # Responsive hook
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # Utility functions
│   ├── pages/               # Route components
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── UserDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── VerifyCertificate.tsx
│   │   └── CertificateView.tsx
│   ├── services/            # Business logic
│   │   ├── auth.ts
│   │   ├── certificate.ts
│   │   ├── blockchain.ts
│   │   └── messaging.ts
│   ├── types/
│   │   ├── index.ts         # Domain types
│   │   └── supabase.ts      # DB types (optional)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── schema.sql           # Full DB schema
│   ├── apply_all_fixes.sql  # RLS policies fix
│   └── migration_institution_fix.sql
├── scripts/
│   └── fix-certificate-hashes.mjs  # Hash repair utility
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### 4.2 Routing

Hash-based routing (`#/route`):

| Route | Component | Access |
|-------|-----------|--------|
| `#/` or `#/landing` | LandingPage | Public |
| `#/login` | LoginPage | Public |
| `#/signup` | SignupPage | Public |
| `#/verify` or `#/verify/:uniqueId` | VerifyCertificate | Public |
| `#/dashboard` | UserDashboard | user, admin, superadmin |
| `#/admin` | AdminDashboard | admin, superadmin |
| `#/superadmin` | SuperAdminDashboard | superadmin |
| `#/certificate/:id` | CertificateView | Public |
| `#/help` | HelpSupport | Authenticated |

---

## 5. Authentication & Authorization

### 5.1 Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **user** | Student / individual | View own certificates, verify, message support |
| **admin** | Institution | Issue certificates, manage institution certs, message |
| **superadmin** | Platform admin | Approve institutions, view all data, manage users |

### 5.2 Auth Flow (Supabase Mode)

1. **Signup**: `supabase.auth.signUp()` with `options.data` (name, role, institution_name, institution_address)
2. **Trigger**: `handle_new_user` creates row in `profiles` table
3. **Profile update**: App updates profile with role, institution data
4. **Institution application**: For admin signup, row inserted into `institution_applications`
5. **Login**: `supabase.auth.signInWithPassword()` → fetch profile from `profiles`
6. **Session**: JWT stored in localStorage; profile cached

### 5.3 RLS (Row Level Security)

- **profiles**: Users read/update own; superadmins update/delete any
- **certificates**: Anyone read; authenticated insert/update/delete
- **blockchain_anchors**: Anyone read; authenticated insert/update
- **activity_logs**: Authenticated read/insert
- **conversations, messages**: Participants only

---

## 6. Certificate Lifecycle

### 6.1 Certificate Creation

1. Admin fills form (student name, email, course, grade, etc.)
2. `certificateService.createCertificate()`:
   - Generates unique ID: `CERT-{timestamp}-{random}` (e.g. `CERT-ML2M6L04-B7OQBU`)
   - Creates Keccak256 hash of: `{studentName, courseName, institutionName, issueDate, uniqueId}`
   - **Supabase**: Inserts into `certificates` and `blockchain_anchors`
   - **Local**: Saves to localStorage, stores hash in simulated chain
3. Activity log entry created

### 6.2 Hash Computation

```typescript
// Inputs (normalized)
{
  studentName: string,
  courseName: string,
  institutionName: string,
  issueDate: string,  // YYYY-MM-DD normalized
  uniqueId: string
}
// Output: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)))
```

### 6.3 Certificate Verification

1. User enters certificate unique ID
2. `certificateService.verifyCertificate(uniqueId)`:
   - Fetches certificate from Supabase or localStorage
   - Checks status (active/revoked/expired)
   - Fetches hash from `blockchain_anchors` (Supabase) or simulated chain
   - Recomputes hash from certificate data
   - Compares: match → valid; mismatch → tampered
3. Returns `{ isValid, certificate, message }`

---

## 7. Database Schema (Supabase)

### 7.1 Tables

| Table | Purpose |
|-------|---------|
| **profiles** | User profiles (id = auth.uid), role, institution, is_verified |
| **certificates** | Full certificate data |
| **blockchain_anchors** | Hash + unique_id for verification |
| **institution_applications** | Pending institution signups |
| **activity_logs** | Audit trail |
| **notifications** | User notifications |
| **conversations** | Support messaging threads |
| **messages** | Support messages |

### 7.2 Key Relationships

```
auth.users (Supabase Auth)
    └── profiles.id (1:1)

profiles
    └── institution_applications.user_id
    └── certificates.institution_id (conceptually)

certificates
    └── blockchain_anchors.certificate_id

conversations
    └── messages.conversation_id
```

### 7.3 Triggers

- **handle_new_user**: On `auth.users` INSERT → INSERT into `profiles` with metadata
- **handle_institution_profile**: On `profiles` INSERT/UPDATE (role=admin) → INSERT/UPDATE `institution_applications`

---

## 8. Services

### 8.1 Auth Service (`auth.ts`)

| Method | Description |
|--------|-------------|
| `login(credentials)` | Sign in with email/password |
| `signup(data)` | Register new user, create profile |
| `logout()` | Clear session |
| `getCurrentUser()` | Get cached user |
| `refreshSession()` | Sync with Supabase session |
| `getAllUsersAsync()` | List all profiles |
| `getPendingAdminsAsync()` | Admins awaiting verification |
| `verifyAdmin(userId)` | Superadmin approves institution |
| `rejectAdmin(userId)` | Superadmin rejects institution |

### 8.2 Certificate Service (`certificate.ts`)

| Method | Description |
|--------|-------------|
| `createCertificate(data, admin)` | Issue new certificate |
| `getCertificateByUniqueIdAsync(id)` | Fetch by unique ID |
| `getAllCertificatesAsync()` | List all |
| `getCertificatesByInstitutionAsync(id)` | Filter by institution |
| `verifyCertificate(uniqueId)` | Full verification flow |
| `revokeCertificate(id, reason)` | Revoke certificate |
| `getDashboardStatsAsync()` | Aggregate stats |
| `getRecentActivityAsync(limit)` | Activity log |

### 8.3 Blockchain Service (`blockchain.ts`)

| Method | Description |
|--------|-------------|
| `generateUniqueId()` | Create `CERT-{ts}-{rand}` |
| `createCertificateHash(cert)` | Keccak256 of canonical fields |
| `storeCertificate(cert)` | Store hash (Supabase or local) |
| `verifyCertificate(uniqueId, cert)` | Compare stored hash with recomputed |

### 8.4 Messaging Service (`messaging.ts`)

| Method | Description |
|--------|-------------|
| `startConversationAsync(recipientId, subject, category)` | Create conversation |
| `sendMessageAsync(conversationId, content)` | Send message |
| `getConversationsAsync()` | List user's conversations |
| `getMessagesAsync(conversationId)` | List messages |
| `getAvailableRecipientsAsync()` | Users by role for messaging |

---

## 9. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes (for Supabase) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (for Supabase) | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | For `fix-hashes` script (bypasses RLS) |

---

## 10. Build & Deployment

### 10.1 Build

```bash
cd app
npm install
npm run build
```

Output: `dist/` (static files)

### 10.2 Vercel Configuration

- **Root Directory**: `app`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Rewrites**: SPA fallback `/(.*) → /index.html`

### 10.3 Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run fix-hashes` | Repair certificate hashes (run with superadmin credentials or service role) |

---

## 11. Security Considerations

1. **Secrets**: Never commit `.env`; use Vercel env vars for production
2. **RLS**: Supabase RLS enforces access control; policies must be applied
3. **Hash integrity**: Certificate verification relies on hash matching; date normalization ensures consistency
4. **Admin verification**: Institutions require superadmin approval before issuing certificates

---

## 12. Future Enhancements

- Connect to real blockchain (Ethereum/Polygon) for immutable anchoring
- IPFS for certificate document storage
- Email notifications for certificate issuance/verification
- Batch certificate import (CSV)
- Custom certificate templates
- Multi-language support
