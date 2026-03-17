const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Get project summary for dashboard
router.get('/summary', async (req, res) => {
  try {
    const projects = await Project.find();
    
    // Departments we care about for the bar graph
    const targetDepts = ['Road', 'Water', 'Education', 'Health'];
    const expenditure = {};
    targetDepts.forEach(dept => expenditure[dept] = 0);
    
    projects.forEach(p => {
      if (expenditure.hasOwnProperty(p.department)) {
        expenditure[p.department] += p.budget;
      }
    });

    const statusCounts = {
      complete: projects.filter(p => p.status === 'complete').length,
      under_process: projects.filter(p => p.status === 'under_process').length,
      incomplete: projects.filter(p => p.status === 'incomplete').length
    };

    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);

    res.json({
      success: true,
      data: {
        expenditure,
        statusCounts,
        totalBudget,
        totalProjects: projects.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CRUD
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, projects }); // Return as { projects: [...] }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.json({ success: true, project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
