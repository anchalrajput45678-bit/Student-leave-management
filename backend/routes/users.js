const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { facultyOrAdmin } = require('../middleware/role');

const router = express.Router();

// @route   GET /api/users/students
// @desc    Get all students (Faculty/Admin only)
// @access  Private
router.get('/students', auth, facultyOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, department = '', semester = '' } = req.query;
    
    const query = { role: 'student' };
    if (department && department !== '') query.department = department;
    if (semester && semester !== '') query.semester = parseInt(semester);

    const students = await User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching students'
    });
  }
});

// @route   GET /api/users/faculty
// @desc    Get all faculty (Admin only)
// @access  Private
router.get('/faculty', auth, async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { faculty }
    });

  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching faculty'
    });
  }
});

module.exports = router;