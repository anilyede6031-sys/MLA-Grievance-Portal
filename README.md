# MLA Public Grievance Redressal Portal

A professional web application for MLA Ruhul Kul (Aurangabad, Maharashtra) to digitize and manage public grievances effectively.

## Features
- **Citizen Portal**: File complaints, upload photos, and track resolution status. Mobile responsive and bilingual (English + Marathi).
- **Admin Dashboard**: Comprehensive dashboard for role-based complaint management.
- **Role System**: Super Admin, Taluka Coordinator, and Data Entry Operator.
- **Analytics**: Real-time statistical charts for monitoring department and taluka-level grievances.
- **Export Data**: CSV export functionality for reporting and off-line processing.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Vite, Framer Motion (Animations), Axios, React Router.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT Auth, Multer (File Upload), express-rate-limit.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on `mongodb://localhost:27017` or Atlas URL)

### 1. Backend Setup
1. `cd backend`
2. `npm install`
3. Setup environment variables:
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI`, `JWT_SECRET`, and `FRONTEND_URL`.
4. Run server:
   - `npm start` or `node server.js`
   
> **Note**: On the first run, a default Super Admin will be created.
> **Mobile**: `9999999999` | **Password**: `Admin@1234`

### 2. Frontend Setup
1. `cd frontend`
2. `npm install`
3. Check `.env` (it usually contains `VITE_API_URL=http://localhost:5000/api`)
4. Run development server:
   - `npm run dev`

5. Access the app at `http://localhost:5173`

## Directory Structure
```
📁 MLA/
  ├── 📁 backend/
  │    ├── 📁 controllers/
  │    ├── 📁 middleware/
  │    ├── 📁 models/
  │    ├── 📁 routes/
  │    └── server.js
  └── 📁 frontend/
       ├── 📁 src/
       │    ├── 📁 components/
       │    ├── 📁 context/
       │    ├── 📁 pages/
       │    ├── App.jsx
       │    └── index.css
       └── tailwind.config.js
```
