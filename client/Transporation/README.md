# BGS Public School & PU College — Transportation Management System

A full-stack web application for managing school bus transportation, student records, and fee dues.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Recharts
- **Backend**: Node.js + Express
- **Auth**: JWT (jsonwebtoken)
- **Storage**: JSON files (fs module)
- **Google Sheets**: googleapis (service account)

## Quick Start

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Copy the `.env` file in the project root and fill in your values:

```env
# REQUIRED: Generate a strong random string (e.g. openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_here

# REQUIRED: Administrator credentials
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password

PORT=5000
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Run the Application

```bash
# Terminal 1: Start the backend
cd server
npm run dev

# Terminal 2: Start the frontend
cd client
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Login

- **Username**: `admin`
- **Password**: `BGS@2026#`

---

## Google Sheets Integration Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "BGS Transport")
3. Enable the **Google Sheets API**:
   - Go to APIs & Services > Library
   - Search for "Google Sheets API"
   - Click Enable

### Step 2: Create a Service Account

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "Service Account"
3. Name it (e.g., "bgs-transport-sheets")
4. Click "Done"
5. Click on the created service account
6. Go to the "Keys" tab
7. Click "Add Key" > "Create new key" > JSON
8. Download the JSON key file

### Step 3: Get the Credentials

From the downloaded JSON key file, extract:
- `client_email` → put in `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → put in `GOOGLE_PRIVATE_KEY` (keep the quotes and \n characters)

### Step 4: Create and Share the Google Sheet

1. Create a new Google Sheet (or use an existing one)
2. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Put the Sheet ID in `GOOGLE_SHEET_ID`
4. Share the sheet with the service account email (from Step 3) as **Editor**

### Step 5: Update .env

Fill in all three values in the `.env` file. The app will automatically sync fee data to the sheet when fees are saved.

---

## Production Deployment

```bash
# Build the frontend
cd client
npm run build

# Start the server (serves both API and static frontend)
cd ../server
npm start
```

The production app runs on port 5000 (or whatever PORT is set in .env).

---

## Folder Structure

```
├── client/                    → React (Vite) frontend
│   ├── src/
│   │   ├── components/        → Layout, reusable components
│   │   ├── pages/             → Login, Dashboard, Students, Routes, Fee, etc.
│   │   ├── utils/             → API helper with JWT interceptor
│   │   ├── App.jsx            → Router config
│   │   └── index.css          → Tailwind + print styles
│   └── ...config files
├── server/                    → Express backend
│   ├── routes/                → API route handlers
│   ├── middleware/             → JWT auth middleware
│   ├── services/              → Google Sheets sync service
│   └── data/                  → JSON data files (students, routes, fee)
├── .env                       → Environment variables (never commit)
└── README.md
```

## Data Files

- `server/data/students.json` — Student records
- `server/data/routes.json` — Bus route configurations
- `server/data/fee.json` — Fee due records per student

All data is stored as flat JSON files. No database required.
