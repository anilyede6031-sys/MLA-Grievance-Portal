require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');

const app = express();

// Trust reverse proxy (required for Render + express-rate-limit)
app.set('trust proxy', 1);

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://rahulkulmla.com',
  'https://www.rahulkulmla.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
const uploadsPath = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// Request Logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'MLA Grievance API is running 🇮🇳' }));

// DIAGNOSTIC: List uploads
app.get('/api/debug-uploads', (req, res) => {
  const uploadsDir = path.resolve(__dirname, 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) return res.json({ success: false, message: 'Uploads dir not found', path: uploadsDir });
    const files = fs.readdirSync(uploadsDir);
    res.json({ success: true, count: files.length, files, path: uploadsDir, cwd: process.cwd() });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

// DB + Server
const PORT = process.env.PORT || 5000;
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  try {
    // Use real MongoDB if URI is provided, else fallback to memory (for local tests)
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI environment variable is missing.');
      process.exit(1);
    }

    // Disable buffering so requests fail immediately if DB is disconnected
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log('✅ MongoDB (In-Memory) connected at', uri);

    // Seed default super admin and citizen if not exists
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');

    const count = await User.countDocuments();
    if (count === 0) {
      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('Admin@MLA2024', salt);
      const userPass = await bcrypt.hash('Citizen@123', salt);

      await User.create({
        name: 'MLA Admin Hub',
        mobile: '9876543210',
        password: adminPass,
        role: 'super_admin',
      });

      await User.create({
        name: 'Citizen Demo User',
        mobile: '1234567890',
        password: userPass,
        role: 'citizen',
        taluka: 'Daund',
      });
      console.log('🔑 Seeded default credentials (change immediately in production):');
      console.log('   Admin  -> Mobile: 9876543210 | Password: Admin@MLA2024');
      console.log('   Citizen-> Mobile: 1234567890 | Password: Citizen@123');
    }
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB error:', err);
    process.exit(1);
  }
})();
