const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createComplaint, trackComplaint, getAllComplaints,
  getStats, getPublicStats, updateComplaint, exportCSV, complaintValidation, addCitizenReply
} = require('../controllers/complaintController');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = /image\/|application\/pdf/.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only image files (JPG, PNG) and PDF files are allowed'));
  },
});

const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `admin_reply_${Date.now()}${ext}`);
  },
});
const adminUpload = multer({
  storage: adminStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = /image\/|application\/pdf/.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only image files and PDF are allowed'));
  },
});

const citizenStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `citizen_reply_${Date.now()}${ext}`);
  },
});
const citizenUpload = multer({
  storage: citizenStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit requested by user
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = /image\/|application\/pdf/.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only JPG, PNG and PDF files are allowed'));
  },
});

// Protected (Citizen/Admin)
router.post('/', authenticate, upload.single('photo'), complaintValidation, createComplaint);
router.post('/:id/reply', authenticate, citizenUpload.array('photos', 5), addCitizenReply);

// Public
router.get('/public-stats', getPublicStats);
router.get('/track', trackComplaint);

// Admin
router.get('/stats', authenticate, getStats);
router.get('/export', authenticate, authorize('super_admin', 'taluka_coordinator'), exportCSV);
router.get('/', authenticate, getAllComplaints);
router.patch('/:id', authenticate, authorize('super_admin', 'taluka_coordinator', 'data_entry_operator'), adminUpload.array('adminPhotos', 5), updateComplaint);

module.exports = router;
