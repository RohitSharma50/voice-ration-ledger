# 📒 Digital Khata — Digital Ration Ledger

A voice-enabled digital ration ledger app for small shop owners to track customers and their ration entries, with **phone OTP login via Twilio**.

---

## ✨ Features

- 📱 **Phone OTP Login** — Secure login via Twilio SMS verification
- 🎙️ **Voice Entry** — Add entries using voice commands in Hindi/English  
  _(e.g., "Ram Kumar 2 kg rice 60 rupees")_
- 👥 **Customer Management** — Add, view, and manage customers
- 📋 **Ration Entries** — Track items, quantities, units, and prices per customer
- 🔍 **Search** — Quickly find customers by name
- 🔐 **Protected Routes** — Only authenticated users can access the app

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend** | Lovable Cloud (powered by Supabase) |
| **Database** | PostgreSQL (via Lovable Cloud) |
| **Edge Functions** | Deno (serverless, auto-deployed) |
| **SMS** | Twilio API |
| **State Management** | TanStack React Query |

---

## 📦 Prerequisites

Before you start, make sure you have:

1. **Node.js v18+** — [Download here](https://nodejs.org/) or install via [nvm](https://github.com/nvm-sh/nvm)
2. **npm** (comes with Node.js) or **bun** ([install bun](https://bun.sh/))
3. **A Twilio Account** — [Sign up free](https://www.twilio.com/try-twilio)
   - Account SID (starts with `AC...`)
   - Auth Token
   - A Twilio phone number for sending SMS

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd digital-khata
```

### Step 2: Install Dependencies

```bash
npm install
```

Or if using bun:

```bash
bun install
```

### Step 3: Environment Variables

The `.env` file is auto-configured by Lovable Cloud with these variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> ⚠️ **Do NOT commit `.env` to version control.** It's already in `.gitignore`.

### Step 4: Configure Twilio Secrets

In Lovable, go to **Settings → Cloud → Secrets** and add:

| Secret Name | Where to Find It |
|-------------|-----------------|
| `TWILIO_ACCOUNT_SID` | [Twilio Console](https://console.twilio.com) → Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Auth Token (click "Show") |
| `TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers → Your number (format: `+1XXXXXXXXXX`) |

### Step 5: Start the Development Server

```bash
npm run dev
```

The app will open at **http://localhost:5173**

### Step 6: Test the App

1. Open `http://localhost:5173` in your browser
2. Enter your phone number on the login screen
3. You'll receive a 6-digit OTP via SMS
4. Enter the OTP to log in
5. Start adding customers and ration entries!

---

## 📁 Project Structure

```
digital-khata/
├── public/                    # Static assets
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── AddCustomerDialog.tsx
│   │   ├── AddEntryForm.tsx
│   │   ├── CustomerCard.tsx
│   │   ├── GlobalVoiceEntry.tsx
│   │   └── NavLink.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── hooks/
│   │   ├── useCustomers.ts    # Customer CRUD operations
│   │   ├── useRationEntries.ts # Entry CRUD operations
│   │   └── useVoiceInput.ts   # Browser speech recognition
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts      # Supabase client (auto-generated)
│   │       └── types.ts       # Database types (auto-generated)
│   ├── pages/
│   │   ├── Index.tsx          # Home page (customer list)
│   │   ├── Login.tsx          # Phone OTP login page
│   │   ├── CustomerDetail.tsx # Individual customer view
│   │   └── NotFound.tsx       # 404 page
│   ├── App.tsx                # Root component with routing
│   ├── index.css              # Design tokens & global styles
│   └── main.tsx               # Entry point
├── supabase/
│   ├── functions/
│   │   ├── send-otp/
│   │   │   └── index.ts       # Edge function: send OTP via Twilio
│   │   └── verify-otp/
│   │       └── index.ts       # Edge function: verify OTP code
│   └── config.toml            # Supabase project config
├── .env                       # Environment variables (auto-configured)
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Schema

### `customers` table
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | auto | Primary key |
| `name` | text | — | Customer name |
| `phone` | text | null | Phone number (optional) |
| `created_at` | timestamptz | now() | Creation timestamp |
| `updated_at` | timestamptz | now() | Last update timestamp |

### `ration_entries` table
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | auto | Primary key |
| `customer_id` | uuid | — | FK → customers.id |
| `item_name` | text | — | Item name (e.g., "rice") |
| `quantity` | numeric | 1 | Amount |
| `unit` | text | "kg" | Unit (kg, g, litre, ml, piece, packet) |
| `price` | numeric | 0 | Price in ₹ |
| `created_at` | timestamptz | now() | Entry timestamp |

### `otp_codes` table
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | auto | Primary key |
| `phone` | text | — | Phone number |
| `code` | text | — | 6-digit OTP |
| `expires_at` | timestamptz | — | Expires 5 min after creation |
| `verified` | boolean | false | Whether verified |
| `created_at` | timestamptz | now() | Creation timestamp |

---

## ⚡ Edge Functions

| Function | Method | Description |
|----------|--------|-------------|
| `send-otp` | POST | Generates 6-digit OTP, stores in DB, sends via Twilio SMS |
| `verify-otp` | POST | Validates OTP against DB, marks as verified |

**Request examples:**

```bash
# Send OTP
curl -X POST https://your-project.supabase.co/functions/v1/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Verify OTP
curl -X POST https://your-project.supabase.co/functions/v1/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "123456"}'
```

---

## 🌐 How to Publish / Deploy

### Option 1: Lovable (Easiest — Recommended)

1. Open the project in [Lovable](https://lovable.dev)
2. Click **Publish** button (top-right corner)
3. Click **Update** to deploy
4. Your app is live at `https://yourapp.lovable.app`
5. _(Optional)_ Connect a custom domain:  
   Go to **Settings → Domains → Connect Domain**

> 💡 Backend (edge functions, database) deploys automatically. Frontend requires clicking "Update".

### Option 2: Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
6. Click Deploy

### Option 3: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Site Settings → Environment
6. Deploy

### Option 4: Manual Static Hosting

```bash
# Build for production
npm run build

# The 'dist/' folder contains your production-ready app
# Upload it to any static hosting (AWS S3, Cloudflare Pages, etc.)
```

---

## 🎙️ Voice Commands Guide

The app supports Hindi and English voice commands. Format:

```
[Customer Name] [Quantity] [Unit] [Item] [Price] rupees
```

**Examples:**
- "Ram Kumar 2 kg rice 60 rupees"
- "रमेश कुमार 5 किलो आटा 200 रुपये"
- "Sita 1 litre oil 150 rupees"

**Supported units:** kg, g, litre, ml, piece, packet  
**Supported Hindi units:** किलो, ग्राम, लीटर, पीस, पैकेट

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|---------|
| OTP not received | Check Twilio credentials in Cloud Secrets. Ensure phone number format is `+91XXXXXXXXXX` |
| "Failed to send SMS" | Verify Twilio Account SID and Auth Token are correct |
| Login succeeds but no redirect | Clear browser cache and try again |
| Voice not working | Allow microphone permission in browser. Works best in Chrome |
| Customers not loading | Check that the database tables exist and RLS policies are set |

---

## 📄 License

MIT
