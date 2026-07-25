# Feedback & Student Project Hub

A Next.js web application for student feedback, project sharing, collaboration, and student management.

## Tech Stack
- **Framework**: Next.js (App Router) / React 19
- **Language**: TypeScript
- **Database**: MySQL (via `mysql2`)
- **Styling**: Tailwind CSS
- **Email Service**: Gmail SMTP (via Nodemailer)

## Getting Started

### 1. Environment Configuration
Create a `.env.local` file in the root directory with the required configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=feedback_system

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME="Project Hub Verification"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build production bundle and check types
- `npm run start`: Start production server
