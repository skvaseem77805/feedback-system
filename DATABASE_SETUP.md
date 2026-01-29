# MySQL Database Setup (MySQL Workbench)

This project connects to **MySQL** (or MariaDB) for students, projects, connections, and stats. Use **MySQL Workbench** to create the database and run the schema.

## 1. Prerequisites

- **MySQL Server** or **MariaDB** installed and running (e.g. MySQL 8.x, XAMPP, WAMP, or native install).
- **MySQL Workbench** installed.

## 2. Create database and tables in MySQL Workbench

1. Open **MySQL Workbench** and connect to your MySQL server (localhost or your host).
2. **File → Open SQL Script** and select `schema.sql` from the project root.
3. Click **Execute** (⚡) to run the script. This will:
   - Create database `feedback_system`
   - Create tables: `students`, `projects`, `project_likes`, `project_saves`, `project_collaborators`, `connection_requests`, `student_stats`

## 3. Load seed data

1. **File → Open SQL Script** and select `seed.sql`.
2. Ensure `USE feedback_system;` is at the top (it is in `seed.sql`).
3. Click **Execute**. This inserts sample students (CSE Section E), a few projects, and optional likes/saves/collaborators/connections.

## 4. Configure the app

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set your MySQL credentials.

   **Option A – connection URL (recommended):**
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/feedback_system"
   ```

   **Option B – separate variables:**
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=feedback_system
   ```

   Use the same user/password/host/database you use in MySQL Workbench.

## 5. Install dependencies and run the app

```bash
npm install
npm run dev
```

The app will use the MySQL database for:

- **Auth** – student login validated against `students`
- **Profile** – student details from `students`
- **Connect** – peers from `students`, connections from `connection_requests`
- **Projects** – projects, likes, saves, collaborators from `projects` and related tables
- **Stats** – `student_stats` (projects uploaded, connections, collaborations)

## 6. Verifying in MySQL Workbench

- **Schema**: In the left panel, select `feedback_system` and expand **Tables**.
- **Data**: Right‑click a table → **Select Rows** to view data.
- **Queries**: Use the SQL editor to run `SELECT * FROM students;`, `SELECT * FROM projects;`, etc.

## 7. Troubleshooting

| Issue | What to check |
|-------|----------------|
| **Connection refused** | MySQL server is running; `MYSQL_HOST` / `MYSQL_PORT` match your setup. |
| **Access denied** | Correct `MYSQL_USER` / `MYSQL_PASSWORD`; user has access to `feedback_system`. |
| **Unknown database** | You ran `schema.sql` so `feedback_system` exists. |
| **Table doesn't exist** | Re‑run `schema.sql` and ensure it completes without errors. |

## Files reference

| File | Purpose |
|------|---------|
| `schema.sql` | Creates `feedback_system` DB and all tables. Run in MySQL Workbench. |
| `seed.sql` | Inserts sample students and projects. Run after `schema.sql`. |
| `.env.example` | Template for `.env` (DB credentials). |
| `lib/db.ts` | App’s MySQL connection pool and query helpers. |
| `app/api/*` | API routes that read/write MySQL. |
