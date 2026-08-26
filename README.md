<div align="center">

<img width="100%" alt="ShopStudio Banner" src="https://github.com/user-attachments/assets/d5777d9a-9ec1-47fe-a4ac-dcc6f8b8f074" />

# ShopStudio ⚡

**The AI-Powered Shopify Online Store 2.0 Theme Builder & SaaS**

*Transform natural language prompts into production-ready, fully responsive Shopify themes in seconds.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Runtime](https://img.shields.io/badge/Runtime-Bun_1.0+-FBF0DF?style=flat-square&logo=bun)](https://bun.sh/)
[![Shopify](https://img.shields.io/badge/Shopify-OS_2.0-96bf48?style=flat-square&logo=shopify)](https://shopify.dev/)
[![InsForge](https://img.shields.io/badge/Backend-InsForge_PostgreSQL-6366f1?style=flat-square)](https://insforge.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

---

</div>

## 📖 Overview

**ShopStudio** is a SaaS platform that bridges the gap between AI generation and actual e-commerce engineering. Unlike generic web generators that produce static HTML, ShopStudio generates **native Shopify Online Store 2.0** architecture:

- Liquid sections with modular `{% schema %}` definitions.
- Dynamic blocks, presets, and theme settings.
- JSON templates (`index.json`, `product.json`, `collection.json`, `cart.json`).
- Downloadable theme ZIP archives that can be uploaded directly to **Shopify Admin** without extra build steps or compilation.

---

## ✨ Key Features

### 🚀 1. Prompt-to-Storefront Generation
- Enter a brand description, niche, or vibe (e.g. *“Minimalist Japanese Ceramic Studio”*).
- AI structures the project brief, color palette, typography tokens, and section hierarchy.
- Real-time page generation across **Home**, **Product**, **Collection**, **Cart**, and **Custom** pages.

### 👁️ 2. Live Sandboxed Visual Preview
- Interactive, responsive preview with **Desktop**, **Tablet**, and **Mobile** viewports.
- Isolated preview rendering ensuring high security and accurate CSS isolation.

### ✏️ 3. Scoped Inline & AI Editing
- **Click-to-Select**: Click any section or element to inspect and edit.
- **AI Chat Refinement**: Request pinpoint adjustments (e.g. *"Change hero button to pill shape and make heading bolder"*).
- **Atomic Revisions**: Every edit creates a reversible revision with full undo/redo history.

### 🛍️ 4. Native Shopify Online Store 2.0 Compliance
- Converts Tailwind and HTML designs into valid Liquid code.
- Generates editable settings (color pickers, text fields, image pickers, range sliders).
- Integrates repeatable block structures for feature grids, testimonials, and collection cards.

### 📦 5. 1-Click ZIP Theme Export
- Validates JSON schemas, Liquid syntax, and asset references.
- Packages everything into a standard Shopify theme directory structure.
- Download the ZIP or save it to InsForge storage for team sharing.

### 🖼️ 6. ImageKit Asset Pipeline
- Automatic image optimization, responsive delivery, and AI asset transformations.
- Safe public delivery with fallback presets.

### 💳 7. Stripe Billing & Usage Tiers
- Built-in subscription tiers (Starter, Pro, Agency) with project quotas.
- Customer billing portal and secure webhook synchronization.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Server Components) |
| **Frontend** | React 19, TypeScript (Strict Mode), Lucide Icons |
| **Styling** | Tailwind CSS v4, `@tailwindcss/postcss` |
| **Runtime & PM** | **Bun** (`bun dev`, `bun install`, `bun build`) |
| **AI Gateway** | Google Gemini (via `@google/genai`, provider-independent adapter) |
| **Backend & DB** | InsForge (PostgreSQL, Auth, Row-Level Security, File Storage) |
| **Media & CDN** | ImageKit (Optimization, AI Generation, CDN URLs) |
| **Payments** | Stripe (Checkout Sessions, Customer Portal, Webhooks) |
| **Validation** | Zod Schema Validation |

---

## 📂 Project Structure

```text
├── app/
│   ├── (app)/                  # Protected application pages
│   │   ├── dashboard/          # Project overview and quick start
│   │   ├── projects/           # Project gallery & creation
│   │   ├── billing/            # Plans, subscription & usage
│   │   └── design-system/      # UI tokens & component showcase
│   ├── (auth)/                 # Authentication flows
│   │   ├── sign-in/            # User login
│   │   └── sign-up/            # Account registration
│   ├── api/                    # Server-side route handlers
│   │   ├── ai/                 # AI generation & inline editing stream
│   │   ├── billing/            # Stripe checkout, portal, webhook
│   │   ├── projects/           # Project CRUD & persistence
│   │   └── shopify/sections/   # Liquid conversion & export APIs
│   ├── editor/[projectId]/     # Main interactive theme builder & preview
│   ├── layout.tsx              # Root layout & providers
│   └── page.tsx                # High-converting landing page
├── components/
│   ├── billing/                # Subscription cards & billing UI
│   ├── editor/                 # Builder canvas, iframe preview, toolbar, chat
│   ├── landing/                # Landing page sections (Hero, FAQ, Showcase)
│   └── ui/                     # Reusable design tokens and UI controls
├── lib/
│   ├── ai/                     # AI providers (Gemini), prompts, schemas
│   ├── insforge/               # InsForge database client & repositories
│   └── shopify/                # Liquid converters, theme bundler, ZIP generator
├── migrations/                 # PostgreSQL database schemas & RLS policies
└── docs/                       # Detailed setup & architectural guides
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Bun** (v1.0 or newer) — [Install Bun](https://bun.sh/)
- **InsForge Project** — [InsForge Dashboard](https://insforge.dev)
- **Google Gemini API Key** — [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **ImageKit Account** & **Stripe Account**

### 2. Clone and Install

```bash
git clone git@github.com:amirfaisalz/shop-studio.git
cd shop-studio
bun install
```

### 3. Configure Environment Variables

Create `.env.local` from the example template:

```bash
cp .env.example .env.local
```

Fill in the environment keys:

```env
# InsForge Backend (Required)
NEXT_PUBLIC_INSFORGE_URL=https://your-project.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-publishable-anon-key
INSFORGE_ADMIN_KEY=your-service-role-admin-key

# AI Provider (Required)
AI_PROVIDER=gemini
AI_MODEL=gemini-2.0-flash
GEMINI_API_KEY=your-gemini-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3231

# ImageKit (Optional for optimized assets)
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Stripe Billing (Optional for subscription monetization)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Database Setup & Migrations

Import the database schema and RLS policies into your InsForge project:

```bash
bun run db:migrate
```

*For manual setup via the SQL Editor, execute [`migrations/schema.sql`](./migrations/schema.sql).*

### 5. Run Local Development Server

```bash
bun run dev
```

Open [http://localhost:3231](http://localhost:3231) in your browser.

---

## 📦 Exported Shopify Theme Structure

When downloading a generated theme, ShopStudio produces a production-ready OS 2.0 theme ZIP:

```text
my-theme.zip
├── assets/
│   ├── tailwind.css            # Scoped Tailwind CSS
│   └── theme.css               # Global theme styles & typography tokens
├── config/
│   ├── settings_data.json      # Active theme settings & block configs
│   └── settings_schema.json    # Shopify Theme Customizer schema
├── layout/
│   └── theme.liquid            # Main store layout
├── locales/
│   └── en.default.json         # Translation & default strings
├── sections/
│   ├── header.liquid           # Dynamic store header
│   ├── footer.liquid           # Store footer
│   ├── hero-banner.liquid      # Customizable hero section
│   ├── featured-products.liquid# Product grid with blocks
│   └── ...                     # Custom generated sections
├── snippets/
│   ├── card-product.liquid     # Product card component
│   ├── card-collection.liquid  # Collection card component
│   ├── price.liquid            # Currency & price formatter
│   └── meta-tags.liquid        # OpenGraph & SEO tags
└── templates/
    ├── index.json              # Homepage section hierarchy
    ├── product.json            # Product detail layout
    ├── collection.json         # Collection catalog layout
    └── cart.json               # Shopping cart page
```

---

## ⌨️ Useful Commands

```bash
# Start development server on port 3231
bun run dev

# Run static typecheck & ESLint
bun run lint

# Build production bundle
bun run build

# Start production server
bun run start

# Run database migrations
bun run db:migrate
```

---

## 📚 Documentation & Guides

For deeper implementation details, refer to:
- 📖 [Project Setup Guide](./projectsetup.md)
- 💳 [Billing & Stripe Configuration](./docs/billing-setup.md)
- 🛍️ [Shopify Export & Bucket Setup](./docs/shopify-export-setup.md)
- 🖼️ [Project Thumbnails Setup](./docs/projects-thumbnails-setup.md)
- 🤖 [Engineering & Agent Rules](./AGENTS.md)

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
