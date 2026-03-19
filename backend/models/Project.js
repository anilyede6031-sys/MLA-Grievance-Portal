const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Road', 'Water', 'Electricity', 'Revenue', 'Police', 'Health', 'Education', 'Agriculture', 'Other']
  },
  budget: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['complete', 'under_process', 'incomplete'],
    default: 'under_process'
  },
  description: {
    type: String,
    default: ''
  },
  expectedCompletionDate: {
    type: Date
  },
  taluka: {
    type: String,
    required: false
  },
  lat: {
    type: Number,
    default: 18.4637 // Default Daund Lat
  },
  lng: {
    type: Number,
    default: 74.5828 // Default Daund Lng
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
