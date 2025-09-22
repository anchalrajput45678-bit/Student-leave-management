 const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Leave = require('../models/Leave');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { studentOnly, facultyOnly, facultyOrAdmin } = require('../middleware/role');

const router = express.Router();

// Multer configuration for file uploads (for future use)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/documents';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and document files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// @route   POST /api/leaves/apply
// @desc    Apply for leave (Students only) - Simplified version
// @access  Private (Student)
router.post('/apply', auth, studentOnly, async (req, res) => {
  try {
    console.log('📝 Leave application request received:', req.body);
    console.log('👤 User:', req.user);

    const { leaveType, startDate, endDate, reason, contactNumber, emergencyContact } = req.body;

    // Basic validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason must be at least 10 characters long'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('👤 Found user:', user.name, user.rollNumber);

    // Validate dates and calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after or equal to start date'
      });
    }

    // Calculate total days
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    console.log(`📅 Calculated days: Start=${start}, End=${end}, TotalDays=${totalDays}`);

    // Create leave application (without file upload for now)
    const leave = new Leave({
      studentId: req.user.id,
      studentName: user.name,
      rollNumber: user.rollNumber,
      department: user.department,
      semester: user.semester || 1,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: totalDays, // ADD THIS LINE
      reason: reason.trim(),
      contactNumber: contactNumber || user.phone,
      emergencyContact: emergencyContact?.trim() || '',
      documents: [] // Empty array for now
    });

    console.log('💾 Saving leave application...');
    const savedLeave = await leave.save();
    console.log('✅ Leave saved successfully:', savedLeave._id);

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: {
        leave: {
          id: savedLeave._id,
          leaveType: savedLeave.leaveType,
          startDate: savedLeave.startDate,
          endDate: savedLeave.endDate,
          totalDays: savedLeave.totalDays,
          status: savedLeave.status,
          appliedAt: savedLeave.appliedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Leave application error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during leave application',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/leaves/my-leaves
// @desc    Get student's own leave applications
// @access  Private (Student)
router.get('/my-leaves', auth, studentOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    
    const query = { studentId: req.user.id };
    if (status && status !== '') {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .sort({ appliedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewedBy', 'name employeeId');

    const total = await Leave.countDocuments(query);

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaves'
    });
  }
});

// @route   GET /api/leaves/pending
// @desc    Get pending leave applications (Faculty only)
// @access  Private (Faculty)
router.get('/pending', auth, facultyOnly, async (req, res) => {
  try {
    console.log(`🔍 Faculty ${req.user.name} requesting pending leaves for department: ${req.user.department}`);
    
    const { page = 1, limit = 10, department = '' } = req.query;
    
    const query = { status: 'pending' };
    
    // Faculty can only see leaves from their department
    if (department && department !== '') {
      query.department = department;
    } else {
      query.department = req.user.department;
    }

    console.log('📝 Pending leaves query:', query);

    const leaves = await Leave.find(query)
      .sort({ appliedAt: 1 }) // Oldest first
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('studentId', 'name email phone');

    const total = await Leave.countDocuments(query);
    
    console.log(`📊 Found ${leaves.length} pending leaves out of ${total} total`);
    console.log('📝 Pending leaves:', leaves.map(l => `${l.studentName} (${l.rollNumber}) - ${l.leaveType} - ${l.department}`));

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending leaves'
    });
  }
});

// @route   GET /api/leaves/all
// @desc    Get all leave applications (Faculty)
// @access  Private (Faculty)
router.get('/all', auth, facultyOnly, async (req, res) => {
  try {
    console.log(`🔍 Faculty ${req.user.name} requesting all leaves for department: ${req.user.department}`);
    
    const { 
      page = 1, 
      limit = 10, 
      status = '',
      leaveType = '',
      startDate = '',
      endDate = '' 
    } = req.query;
    
    const query = { department: req.user.department };
    
    if (status && status !== '') query.status = status;
    if (leaveType && leaveType !== '') query.leaveType = leaveType;
    
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    console.log('📝 All leaves query:', query);

    const leaves = await Leave.find(query)
      .sort({ appliedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('studentId', 'name email rollNumber')
      .populate('reviewedBy', 'name employeeId');

    const total = await Leave.countDocuments(query);
    
    console.log(`📊 Found ${leaves.length} leaves out of ${total} total`);
    console.log('📝 All leaves:', leaves.map(l => `${l.studentName} (${l.rollNumber}) - ${l.leaveType} - ${l.department} - ${l.status}`));

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaves'
    });
  }
});

// @route   GET /api/leaves/stats
// @desc    Get dashboard statistics - MOVED BEFORE /:id route
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'student') {
      // Student stats
      const totalLeaves = await Leave.countDocuments({ studentId: req.user.id });
      const pendingLeaves = await Leave.countDocuments({ studentId: req.user.id, status: 'pending' });
      const approvedLeaves = await Leave.countDocuments({ studentId: req.user.id, status: 'approved' });
      const rejectedLeaves = await Leave.countDocuments({ studentId: req.user.id, status: 'rejected' });

      stats = {
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves
      };
    } else if (req.user.role === 'faculty') {
      // Faculty stats for their department
      const totalLeaves = await Leave.countDocuments({ department: req.user.department });
      const pendingLeaves = await Leave.countDocuments({ department: req.user.department, status: 'pending' });
      const approvedLeaves = await Leave.countDocuments({ department: req.user.department, status: 'approved' });
      const rejectedLeaves = await Leave.countDocuments({ department: req.user.department, status: 'rejected' });

      stats = {
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves
      };
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

// @route   GET /api/leaves/:id
// @desc    Get single leave application details - MOVED AFTER /stats route
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('studentId', 'name email phone rollNumber')
      .populate('reviewedBy', 'name employeeId');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'student' && leave.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'faculty' && leave.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { leave }
    });

  } catch (error) {
    console.error('Get leave details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leave details'
    });
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave application (Faculty only)
// @access  Private (Faculty)
router.put('/:id/approve', auth, facultyOnly, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Check if faculty can review this leave
    if (leave.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only review leaves from your department'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave application has already been reviewed'
      });
    }

    // Approve the leave
    leave.status = 'approved';
    leave.reviewedBy = req.user.id;
    leave.reviewerName = req.user.name;
    leave.reviewDate = new Date();
    leave.comments = req.body.comments || 'Approved';

    await leave.save();

    console.log(`✅ Leave approved: ${leave.studentName} (${leave.rollNumber}) by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Leave application approved successfully',
      data: { leave }
    });

  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving leave'
    });
  }
});

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave application (Faculty only)
// @access  Private (Faculty)
router.put('/:id/reject', auth, facultyOnly, async (req, res) => {
  try {
    const { comments } = req.body;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comments are required when rejecting a leave'
      });
    }

    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only review leaves from your department'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave application has already been reviewed'
      });
    }

    // Reject the leave
    leave.status = 'rejected';
    leave.reviewedBy = req.user.id;
    leave.reviewerName = req.user.name;
    leave.reviewDate = new Date();
    leave.comments = comments.trim();

    await leave.save();

    console.log(`❌ Leave rejected: ${leave.studentName} (${leave.rollNumber}) by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Leave application rejected successfully',
      data: { leave }
    });

  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting leave'
    });
  }
});

module.exports = router;