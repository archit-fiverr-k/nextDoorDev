# NextDoorClinic - Multi-Tenant Healthcare Booking Platform

NextDoorClinic is a high-fidelity, multi-tenant clinical appointment scheduling platform designed for pharmacy networks and healthcare clinics. It features timezone-aware scheduling, a responsive patient checkout portal, a clinical customer relationship management (CRM) dashboard, automated email notifications via Resend, and dynamic brand style injections.

---

## 🚀 Key Modules & Architecture

1. **Platform Administration**: Multi-role support (Super Admin, Platform Admin) to create branches, manage statuses (Pending, Approved, Suspended), and review global security audit logs.
2. **Pharmacy Workspace Dashboard**: Dedicated portal for approved pharmacy branches to review booking metrics, update operational hours, and upload branding.
3. **Weekly availability scheduler**: Grid selection enabling branches to toggle weekdays open/closed, adjust 30-minute intervals, and block vacation dates.
4. **Timezone-Aware Booking Engine**: Slot generation at 15-minute intervals that filters out blocked dates, overlapping bookings, past times, and service duration boundaries.
5. **Branded checkout portal**: Public booking path (`booking.nextdoorclinic.co.uk/{slug}`) featuring dynamic theme injections, OTP verification, and print-ready confirmation summaries.
6. **Patient CRM & Clinical Notes**: Split-pane Detail CRM view mapping patient timelines, appointment logs, and audit-logged notes CRUD operations.
7. **Responsive React Email Templates**: Beautifully-styled transactional notifications (confirmations, staff notifications, setup credentials, password resets).
8. **Portal Hardening**: Custom security headers (CSP, HSTS, Frame Options) and sliding window rate limiting.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Dynamic Middleware Rewrites)
- **Database ORM**: [Prisma](https://www.prisma.io/) (PostgreSQL client integration)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) (JWT strategy with role-based routing)
- **Email Delivery**: [Resend](https://resend.com/) & [@react-email/components](https://react.email/)
- **Storage Bucket**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (S3-compatible bucket asset uploads)
- **Form Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Styling UI**: [TailwindCSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)

---

## ⚙️ Getting Started (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your connection credentials:

```bash
cp .env.example .env
```

### 3. Setup Database Schema

Generate the Prisma Client and sync migrations with your local PostgreSQL instance:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` to view the application locally.

---

## 🌐 Production Deployment Guide

For full instructions on configuring Vercel, Neon PostgreSQL, Cloudflare R2 bucket policies, and Resend credentials, consult the [DEPLOYMENT.md](file:///c:/Users/archi/Desktop/Nav%20Roll%20Projects/Next%20Door%20Clinic/DEPLOYMENT.md) guide.
