const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const getSecret = () => (process.env.JWT_SECRET && process.env.JWT_SECRET.trim() !== '') ? process.env.JWT_SECRET.trim() : 'SuperSecretKeyMLA2026';
const getExpires = () => (process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN.trim() !== '') ? process.env.JWT_EXPIRES_IN.trim() : '7d';

const generateToken = (id) => jwt.sign({ id }, getSecret(), { expiresIn: getExpires() });

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { mobile, password, type } = req.body;
  try {
    const user = await User.findOne({ mobile }).select('+password');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    // Check if user is logging into the correct portal
    if (type === 'admin' && user.role === 'citizen') {
      return res.status(403).json({ success: false, message: 'This portal is for authorized personnel only.' });
    }
    if (type === 'citizen' && user.role !== 'citizen') {
      return res.status(403).json({ success: false, message: 'Admins cannot log in via the Citizen portal.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role, taluka: user.taluka },
    });
  } catch (err) {
    console.error('Login Error:', err.message || err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// POST /api/auth/register (Super Admin only)
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, mobile, password, role, taluka, email } = req.body;
  try {
    const existing = await User.findOne({ mobile });
    if (existing) return res.status(400).json({ success: false, message: 'Mobile already registered.' });
    const user = await User.create({ name, mobile, password, role, taluka, email });
    res.status(201).json({ success: true, message: 'User created.', user: { id: user._id, name, mobile, role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// GET /api/auth/users (super admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'citizen' } }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/auth/citizen-register
const citizenRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, mobile, password, taluka } = req.body;
  try {
    const existing = await User.findOne({ mobile });
    if (existing) return res.status(400).json({ success: false, message: 'Mobile already registered.' });
    const user = await User.create({ name, mobile, password, role: 'citizen', taluka });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Registration successful.', token, user: { id: user._id, name, mobile, role: 'citizen' } });
  } catch (err) {
    console.error('Citizen Registration Error:', err.message || err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// PATCH /api/auth/profile
const updateProfile = async (req, res) => {
  const { name, password, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (name) user.name = name;
    if (password && newPassword) {
      user.password = newPassword;
    }
    
    await user.save();
    res.json({ success: true, message: 'Profile updated', user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: { id: user._id, name: user.name, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const loginValidation = [
  body('mobile').notEmpty().withMessage('Mobile is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
const registerValidation = [
  body('name').notEmpty().withMessage('Name required'),
  body('mobile').isLength({ min: 10, max: 15 }).withMessage('Valid mobile required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['super_admin', 'taluka_coordinator', 'data_entry_operator']).withMessage('Invalid role'),
];

const citizenValidations = [
  body('name').notEmpty().trim().withMessage('Name required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
];

module.exports = { login, register, getMe, getUsers, citizenRegister, updateProfile, toggleUserStatus, deleteUser, loginValidation, registerValidation, citizenValidations };
