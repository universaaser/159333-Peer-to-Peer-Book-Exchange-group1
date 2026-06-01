# BookSwap - P2P Book Exchange Platform

A full-stack peer-to-peer book exchange web application where users can list, discover, and exchange second-hand books. Features include real-time messaging, AI-powered book recommendations, transaction management, and an admin dashboard.

---

## Features

- User registration and login (JWT authentication)
- Browse and search book listings with filters
- Post, edit, and delete your own book listings
- Real-time messaging between buyers and sellers
- AI-powered book recommendations (Google Gemini)
- Transaction tracking and management
- Review and rating system
- Report inappropriate listings or users
- Book cover image upload
- Admin dashboard with analytics charts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, React Router v7 |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Token (JWT), bcryptjs |
| AI | Google Gemini API (`@google/generative-ai`) |
| File Upload | Multer |
| Charts | Recharts |

---

## Prerequisites

Before running this project, make sure you have installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or a [MongoDB Atlas](https://www.mongodb.com/atlas) cloud connection string
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free tier available)

---

## Environment Setup

Create a `.env` file inside the `backend/` folder with the following variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/p2p-book-exchange
JWT_SECRET=your_random_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> The `.env` file is listed in `.gitignore` and will not be committed to the repository. Each developer must create their own copy.

| Variable | Description |
|----------|-------------|
| `PORT` | Port the backend server listens on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens — use any long random string |
| `GEMINI_API_KEY` | Google Gemini API key for AI recommendation feature |

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the Application

### Option A — One-click launch (Windows only)

Double-click `start.bat` in the root directory. It will:

- Start the backend server on port 5000
- Start the frontend dev server on port 5173
- Open the browser automatically

### Option B — Manual start (cross-platform)

Open two terminal windows:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Then open your browser and go to:

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:5173> |
| Backend API | <http://localhost:5000> |

---

## Database Setup (Optional)

A sample database export is included in `db-export.zip` for testing purposes.

To import it into your local MongoDB:

```bash
# Extract db-export.zip first, then run:
mongorestore --db p2p-book-exchange ./db-export/p2p-book-exchange
```

---

## Test Accounts

After importing the sample database, you can log in with the following accounts:

| Email | Name | Role |
|-------|------|------|
| <222@qq.com> | UserC | Admin |
| <123@123.com> | Mino | User |
| <321@321.com> | David | User |
| <234@234.com> | Lucy | User |
| <555@555.com> | Faiz | User |

> Passwords are stored in `User.txt` in the root directory.

---

## Project Structure

```
├── backend/
│   ├── middleware/         Authentication middleware
│   ├── models/             Mongoose data models
│   ├── routes/             Express API route handlers
│   ├── public/             Static files (uploads, admin panel)
│   ├── server.js           Express app entry point
│   └── .env                Environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── api/            Axios HTTP client config
│   │   ├── components/     Reusable React components
│   │   ├── context/        React Context (auth state)
│   │   └── pages/          Page-level components
│   └── vite.config.js      Vite build configuration
│
├── start.bat               One-click launcher (Windows)
├── User.txt                Test account credentials
└── README.md
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/listings` | Get all book listings |
| POST | `/api/listings` | Create a new listing |
| GET | `/api/messages/:userId` | Get conversation with a user |
| POST | `/api/messages` | Send a message |
| GET | `/api/recommendations` | Get AI book recommendations |
| GET | `/api/transactions` | Get user transactions |
| GET | `/api/admin/stats` | Admin dashboard statistics |

---


## License

This project was developed as a university group assignment. For academic use only.
