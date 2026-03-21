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
  res.setHeader('X-Backend-Version', '2026-03-20-v1');
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
app.get('/api/version-ping', (req, res) => res.json({ success: true, version: '2026-03-21-v5-final-stable' }));

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
      {
        name: "Daund-Patas Highway Concreting",
        department: "Road",
        budget: 45.5,
        status: "under_process",
        description: "High-grade CC road construction connecting Daund to Patas Industrial Hub. Expected to reduce travel time by 20 minutes.",
        expectedCompletionDate: "2025-12-30",
        lat: 18.4715,
        lng: 74.5910,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?q=80&w=1000&auto=format&fit=crop"
      },
      {
        name: "Khurawadi Water Storage Reservoir",
        department: "Water",
        budget: 12.8,
        status: "complete",
        description: "Multi-million liter capacity water tank to provide 24/7 drinking water to 5 nearby villages including Khurawadi.",
        expectedCompletionDate: "2024-03-15",
        lat: 18.4550,
        lng: 74.5750,
        imageUrl: "https://images.unsplash.com/photo-1541944743827-e04bb645d993?q=80&w=1000&auto=format&fit=crop"
      },
      {
        name: "Daund Multi-Specialty Hospital Expansion",
        department: "Health",
        budget: 28.3,
        status: "under_process",
        description: "Adding 100 beds and a dedicated Cardiology wing to the existing hospital infrastructure.",
        expectedCompletionDate: "2026-06-20",
        lat: 18.4650,
        lng: 74.5850,
        imageUrl: "https://images.unsplash.com/photo-1586773860418-d319a39ec55e?q=80&w=1000&auto=format&fit=crop"
      },
      {
        name: "Zilla Parishad Digital School Hub",
        department: "Education",
        budget: 5.2,
        status: "complete",
        description: "Equipping 10 rural schools with interactive displays, high-speed internet, and tablet-based learning systems.",
        expectedCompletionDate: "2025-01-10",
        lat: 18.4750,
        lng: 74.6000,
        imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop"
      },
      {
        name: "New Police Headquarters & Command Center",
        department: "Police",
        budget: 15.0,
        status: "incomplete",
        description: "State-of-the-art surveillance and response center for regional monitoring and traffic management.",
        expectedCompletionDate: "2027-02-14",
        lat: 18.4600,
        lng: 74.5800,
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
      }
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
