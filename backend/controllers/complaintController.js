const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const { Parser } = require('json2csv');

// POST /api/complaints - Public
const createComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, mobile, village, taluka, department, description } = req.body;
  try {
    const photo = req.file ? req.file.path.replace(/\\/g, '/') : null;
    const complaint = await Complaint.create({ name, mobile, village, taluka, department, description, photo });
    // Placeholder: SMS/Email notification
    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaintId: complaint.complaintId,
      status: complaint.status,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    console.error('Create Complaint Error:', err);
  }
};

// GET /api/complaints/track?complaintId=&mobile= - Public (Partially)
const trackComplaint = async (req, res) => {
  const { complaintId, mobile } = req.query;
  if (!complaintId && !mobile) {
    return res.status(400).json({ success: false, message: 'Provide complaintId or mobile.' });
  }

  // Privacy protection: Restrict mobile tracking
  if (mobile && !complaintId) {
    let authorized = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const jwt = require('jsonwebtoken');
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        if (user && (user.role !== 'citizen' || user.mobile === mobile)) {
          authorized = true;
        }
      } catch (err) {}
    }
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Privacy restriction: Login required to search by mobile, or use a Complaint ID instead.' });
    }
  }

  try {
    let query = {};
    if (complaintId) query.complaintId = complaintId;
    else query.mobile = mobile;

    const complaints = await Complaint.find(query).select('-__v').sort({ createdAt: -1 });
    if (!complaints.length) return res.status(404).json({ success: false, message: 'No complaints found.' });
    res.json({ success: true, complaints });
  } catch {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/complaints - Admin
const getAllComplaints = async (req, res) => {
  try {
    const { taluka, department, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (taluka) filter.taluka = taluka;
    if (department) filter.department = department;
    if (status) filter.status = status;

    // Taluka coordinators see only their taluka
    if (req.user.role === 'taluka_coordinator' && req.user.taluka) {
      filter.taluka = req.user.taluka;
    }

    const total = await Complaint.countDocuments(filter);
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v');

    res.json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), complaints });
  } catch {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/complaints/stats - Admin
const getStats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'taluka_coordinator' && req.user.taluka) filter.taluka = req.user.taluka;

    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: 'Pending' }),
      Complaint.countDocuments({ ...filter, status: 'In Progress' }),
      Complaint.countDocuments({ ...filter, status: 'Resolved' }),
      Complaint.countDocuments({ ...filter, status: 'Rejected' }),
    ]);

    // Department-wise
    const byDepartment = await Complaint.aggregate([
      { $match: filter },
      { $group: { 
          _id: '$department', 
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $in: ['$status', ['Pending', 'In Progress']] }, 1, 0] } } 
      } },
      { $sort: { count: -1 } },
    ]);

    // Taluka-wise
    const byTaluka = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$taluka', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Monthly (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const monthly = await Complaint.aggregate([
      { $match: { ...filter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, stats: { total, pending, inProgress, resolved, rejected }, byDepartment, byTaluka, monthly });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// PATCH /api/complaints/:id - Admin
const updateComplaint = async (req, res) => {
  const { status, remarks } = req.body;
  try {
    const setFields = {};
    if (status && status.trim()) {
      setFields.status = status;
      if (status === 'Resolved') setFields.resolvedAt = new Date();
    }
    if (remarks !== undefined) setFields.remarks = remarks;

    const updateOp = {};
    if (Object.keys(setFields).length > 0) updateOp.$set = setFields;

    if (req.files && req.files.length > 0) {
      const existing = await Complaint.findById(req.params.id).select('adminPhotos');
      const currentCount = existing?.adminPhotos?.length || 0;
      const allowedNew = Math.min(req.files.length, 5 - currentCount);
      if (allowedNew > 0) {
        const newPaths = req.files.slice(0, allowedNew).map(f => f.path.replace(/\\/g, '/'));
        updateOp.$push = { adminPhotos: { $each: newPaths } };
      }
    }

    if (Object.keys(updateOp).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateOp, { new: true });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    console.error('Update Complaint Error:', err);
  }
};

// GET /api/complaints/export - Admin only
const exportCSV = async (req, res) => {
  try {
    const { taluka, department, status } = req.query;
    const filter = {};
    if (taluka) filter.taluka = taluka;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (req.user.role === 'taluka_coordinator' && req.user.taluka) filter.taluka = req.user.taluka;

    const complaints = await Complaint.find(filter).select('-__v -_id').lean();
    const fields = ['complaintId', 'name', 'mobile', 'village', 'taluka', 'department', 'description', 'status', 'remarks', 'createdAt', 'resolvedAt'];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(complaints);

    res.header('Content-Type', 'text/csv');
    res.attachment('complaints_export.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed.', error: err.message });
  }
};

const complaintValidation = [
  body('name').notEmpty().trim().withMessage('Name required'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
  body('village').notEmpty().trim().withMessage('Village required'),
  body('taluka').notEmpty().withMessage('Taluka required'),
  body('department').notEmpty().withMessage('Department required'),
  body('description').notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

// GET /api/complaints/public-stats - Public
const getPublicStats = async (req, res) => {
  try {
    const [total, pending, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
    ]);

    res.json({
      success: true,
      stats: { total, pending, inProgress, resolved }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/complaints/:id/reply - Public (Requires Complaint ID)
const addCitizenReply = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Ensure complaint is actually in progress
    if (complaint.status === 'Resolved' || complaint.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Cannot reply to a resolved or rejected complaint.' });
    }

    // Check if they already hit the 5 photo limit
    const existingCount = Array.isArray(complaint.citizenPhotos) ? complaint.citizenPhotos.length : 0;
    if (existingCount + (req.files?.length || 0) > 5) {
      return res.status(400).json({ success: false, message: `You can only upload a maximum of 5 photos. You already have ${existingCount}.` });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photos provided.' });
    }

    const newPaths = req.files.map(f => f.path.replace(/\\/g, '/'));
    
    // Push new paths to citizenPhotos array
    await Complaint.findByIdAndUpdate(req.params.id, {
      $push: { citizenPhotos: { $each: newPaths } }
    });

    res.json({ success: true, message: 'Reply sent successfully.', paths: newPaths });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { createComplaint, trackComplaint, getAllComplaints, getStats, getPublicStats, updateComplaint, exportCSV, complaintValidation, addCitizenReply };
