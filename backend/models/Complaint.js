const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    default: () => `DK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
  },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true },
  taluka: {
    type: String,
    required: true,
    enum: ['Pune', 'Haveli', 'Khed', 'Baramati', 'Junnar', 'Shirur', 'Indapur', 'Daund', 'Mawal', 'Ambegaon', 'Purandhar', 'Bhor', 'Mulshi', 'Velhe'],
  },
  department: {
    type: String,
    required: true,
    enum: ['Road', 'Water', 'Electricity', 'Revenue', 'Police', 'Health', 'Education', 'Agriculture', 'Other'],
  },
  description: { type: String, required: true, trim: true },
  photo: { type: String, default: null }, // file path (user-uploaded)
  adminPhotos: { type: [String], default: [] }, // file paths (admin reply photos, max 5)
  citizenPhotos: { type: [String], default: [] }, // file paths (citizen reply photos, max 5)
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending',
  },
  remarks: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
