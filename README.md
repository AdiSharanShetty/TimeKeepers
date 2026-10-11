# ⌚ TimeKeepers — Watch Store

A full-stack e-commerce demo for luxury watches: **React** frontend + **Express / MySQL** backend.
Browse watches, search and filter, add to cart, check out, and manage products, orders and users
from an admin dashboard.

> 📸 **Screenshot** — home page screenshot goes here.

---

## ⚠️ Security notice

**Please read this before using or deploying this project.**

- This is a **demo / learning project**. Passwords are **stored and compared as plain text** in the
  database — there is no hashing, salting or encryption of any kind.
- The **test accounts listed below are public** (they are also visible in `database/schema.sql`).
  They exist for **local demo use only**.
- **Do not deploy this application for real users, and do not reuse your real passwords with it**,
  until password hashing (e.g. **bcrypt**) has been added to registration and login.

---

## Features

**Storefront** — home page with featured watches, category browsing, product search and filters,
product details, shopping cart, guest cart merge at login, and a checkout flow with order history.

**Admin dashboard** — manage products (add / edit / delete, image upload), manage categories,
view and update orders, view carts, and a KPI overview.

**Auth** — email + password login for customers and admins, role-based admin pages.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Create React App), React Router 7, MUI 6, Axios |
| Backend | Node.js, Express 5, mysql2, multer (uploads), dotenv |
| Database | MySQL / MariaDB (tested with XAMPP's MariaDB 10.4.28) |
| Dev tooling | nodemon, concurrently |

## Prerequisites

Install these first (all free):

1. **XAMPP** — https://www.apachefriends.org/download.html
   - During installation keep the defaults (Apache + MySQL).
   - We tested with **MariaDB 10.4.28**; any recent XAMPP works.
2. **Node.js 18 or newer** — https://nodejs.org/ (pick the LTS installer)
   - Verified with **Node v22.20.0 / npm 10.9.3**. Check with `node -v` and `npm -v`.
3. **Git** (optional, only if you clone instead of downloading the ZIP) — https://git-scm.com/downloads

No other tools, accounts or API keys are required. Everything runs on `localhost`.


## Quick start (Windows, XAMPP)

### 1. Start XAMPP

Open the **XAMPP Control Panel** and start **Apache** and **MySQL**.
Both should show green. (Apache serves phpMyAdmin on port 80 — keep it running.)

### 2. Get the code

```powershell
git clone https://github.com/YOUR-USERNAME/timekeepers.git
cd timekeepers
```

Or download the ZIP from GitHub, extract it, and open a terminal in the extracted folder.

### 3. Create the database

The schema file creates the `ecom` database, all 7 tables, and the demo data
(8 watches, 2 categories, 2 demo accounts).

**Option A — phpMyAdmin (easiest):**

1. Open http://localhost/phpmyadmin
2. Click **Import** (top menu).
3. **Choose File** → select `database/schema.sql` from this project.
4. Press **Go**.

**Option B — command line:**

```powershell
C:\xampp\mysql\bin\mysql.exe -u root < database\schema.sql
```

> Run this from the project root in **PowerShell**. If your MySQL user has a
> password, add `-p` and type it when asked.

### 4. Install dependencies

From the project root (installs both backend and frontend):

```powershell
npm run install:all
```

> First run takes a few minutes. Ignore peer-dependency warnings — they are
> harmless for this project. (If you prefer, run `npm install` inside
> `backend\` and again inside `frontend\`.)

### 5. Start the app

From the project root:

```powershell
npm run dev
```

This starts the API and the frontend together using `concurrently`:

| What | URL | Terminal |
|---|---|---|
| Storefront / React app | http://localhost:3000 | labelled `web` |
| REST API | http://localhost:5000 | labelled `api` |

Prefer separate terminals? That works too:

```powershell
# terminal 1
cd backend
npm run dev        # or: npm run serve

# terminal 2
cd frontend
npm start
```

Wait for both to finish compiling (the API prints `Connected to MySQL`, the
frontend opens http://localhost:3000 automatically). Then browse, and log in
with a test account below.

## Test accounts

| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@gmail.com` | `admin` |
| 🛍️ Customer | `user@gmail.com` | `123` |

> These accounts are seeded by `database/schema.sql`. They are **public and for
> local demo use only** — see the Security notice at the top.

## Configuration

**You can skip this section** — stock XAMPP (user `root`, empty password, port
`3306`, database `ecom`) works with **no configuration at all** thanks to the
built-in defaults in `backend/db.js`.

If your setup differs (custom MySQL password, different database name, remote
MySQL), copy the example file and edit it:

```powershell
copy backend\.env.example backend\.env
```

Then change only the values you need:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=ecom
DB_PORT=3306
PORT=5000
```

`.env` files are git-ignored and will never be published. **Never commit real

## Project structure

```
timekeepers/
├── package.json            # root scripts: install:all, dev (concurrently)
├── database/
│   └── schema.sql          # creates the ecom DB + tables + demo seed data
├── backend/                # Express 5 REST API (port 5000)
│   ├── app.js              # server entry point
│   ├── db.js               # MySQL connection (XAMPP defaults / .env override)
│   ├── .env.example        # copy to .env only if you need custom settings
│   ├── routes/             # auth, products, categories, cart, orders, ...
│   ├── middleware/         # role checks for admin pages
│   ├── lib/                # shared helpers (schema checks, serializers)
│   ├── scripts/            # one-off maintenance scripts
│   └── uploads/            # product images (10 seed images + local uploads)
└── frontend/               # React app (port 3000)
    ├── public/             # index.html, css, js, favicons
    └── src/
        ├── components/     # shared UI (Navbar, Footer, cards, ...)
        ├── pages/          # Home, Product, Cart, Checkout, Login, Admin/*, ...
        ├── api/            # axios client → http://localhost:5000
        └── utils/          # search/sort helpers
```

## Troubleshooting

**`Error: connect ECONNREFUSED` or the API never prints `Connected to MySQL`**
→ XAMPP's MySQL isn't running. Open the XAMPP Control Panel and start MySQL.

**`ER_BAD_DB_ERROR: Unknown database 'ecom'`**
→ You skipped step 3. Import `database/schema.sql` (see *Create the database*).

**`ER_ACCESS_DENIED_ERROR`**
→ Wrong MySQL user/password. Stock XAMPP uses `root` with an empty password.
If yours differs, create `backend/.env` (see *Configuration*).

**Port 5000 or port 3000 already in use**
→ Another program owns the port. Find and stop it, or (for the frontend only)
answer **Y** when `npm start` asks to run on another port instead. The API must
stay on **5000** — the frontend calls `http://localhost:5000` directly.

**Watch images don't appear (broken image icons)**
→ The API isn't running, so images under `/uploads/...` can't load. Start the
backend and refresh.

**`npm run dev` fails / peer dependency errors**
→ Make sure Node is v18+ (`node -v`). Delete `node_modules` folders
(`backend`, `frontend`, root) and `package-lock.json`, then run
`npm run install:all` again.

**Import says "Duplicate entry" when running schema.sql again**
→ The database already exists — that's expected and protects your data.
To reset to the demo state instead, drop the `ecom` database in phpMyAdmin
first, then re-import.

## Notes

- **Demo project.** See the Security notice above before doing anything beyond
  local learning.
- **External dependencies:** the app loads **Google Fonts** and **Font Awesome**
  from CDNs (`fonts.googleapis.com`, `cdnjs.cloudflare.com`) — an internet
  connection is needed for fonts/icons. Everything else (product data, images)
  runs fully locally.
- **Ports:** frontend http://localhost:3000 · API http://localhost:5000 — both
  are hardcoded for local development.
- Store name **TimeKeepers** and the demo catalog (8 watches) are sample content.

## License

License to be chosen before publishing.

credentials.**
