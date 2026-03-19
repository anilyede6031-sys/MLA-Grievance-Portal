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
const projectRoutes = require('./routes/projects');
const aiRoutes = require('./routes/ai');

const app = express();

// Trust reverse proxy (required for Render + express-rate-limit)
app.set('trust proxy', 1);

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Security middleware
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false // Allow cross-origin images and resources
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://rahulkulmla.com',
  'https://www.rahulkulmla.com',
  'https://mla-grievance-portal.vercel.app', // Added Vercel app domain
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for now as per user request to 'allow all permissions'
    callback(null, true);
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100 to 1000 for 'all permissions'
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
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'MLA Grievance API is running 🇮🇳' }));

// Seeding Route
app.get('/api/seed', async (req, res) => {
  try {
    const Project = require('./models/Project');
    const Complaint = require('./models/Complaint');
    const User = require('./models/User');

    // Clear existing (optional, but good for demo)
    await Project.deleteMany({});
    
    // Seed Projects
    const projects = [
      { name: 'Daund-Patas Road Expansion', department: 'Road', budget: 12.5, status: 'under_process', description: 'Expanding the main highway connector for better traffic flow.', expectedCompletionDate: new Date('2025-06-30') },
      { name: 'Kurumb-Kushali Water Pipeline', department: 'Water', budget: 8.2, status: 'complete', description: 'Drinking water pipeline for 5 villages.', expectedCompletionDate: new Date('2024-12-15') },
      { name: 'Zilla Parishad School Renovation', department: 'Education', budget: 4.5, status: 'under_process', description: 'Modernizing 10 rural schools with digital labs.', expectedCompletionDate: new Date('2025-03-20') },
      { name: 'Rural Health Center Upgrade', department: 'Health', budget: 6.8, status: 'incomplete', description: 'Adding 20 beds and new medical equipment.', expectedCompletionDate: new Date('2025-09-10') },
      { name: 'Agriculture Canal Maintenance', department: 'Agriculture', budget: 3.2, status: 'complete', description: 'Cleaning and lining of irrigation canals.', expectedCompletionDate: new Date('2024-10-05') },
    ];
    await Project.insertMany(projects);

    res.json({ success: true, message: 'Database seeded with demo projects!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    let uri = process.env.MONGODB_URI;
    
    if (process.env.USE_MEMORY_DB === 'true' || !uri) {
      console.log('📦 Starting In-Memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('📦 In-Memory MongoDB URI:', uri);
    }

    // Disable buffering
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');

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
