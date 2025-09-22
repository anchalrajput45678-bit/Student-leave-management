const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  // Student Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },

  // Leave Details
  leaveType: {
    type: String,
    required: [true, 'Leave type is required'],
    enum: {
      values: ['medical', 'personal', 'emergency', 'exam', 'family', 'other'],
      message: 'Please select a valid leave type'
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(value) {
        return value >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Start date cannot be in the past'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be after or equal to start date'
    }
  },
  totalDays: {
    type: Number,
    required: [true, 'Total days is required'],
    min: [1, 'Leave must be at least 1 day']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    minLength: [10, 'Reason must be at least 10 characters'],
    maxLength: [500, 'Reason cannot exceed 500 characters']
  },

  // Contact Information
  contactNumber: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  emergencyContact: {
    type: String,
    trim: true,
    maxLength: [100, 'Emergency contact cannot exceed 100 characters']
  },

  // Supporting Documents
  documents: [{
    filename: {
      type: String,
      required: true
    },
    originalname: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and Review
  status: {
    type: String,
    default: 'pending',
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be pending, approved, or rejected'
    }
  },
  
  // Faculty Review Information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewerName: {
    type: String,
    trim: true
  },
  reviewDate: {
    type: Date
  },
  comments: {
    type: String,
    trim: true,
    maxLength: [300, 'Comments cannot exceed 300 characters']
  },

  // Timestamps
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
leaveSchema.index({ studentId: 1, createdAt: -1 });
leaveSchema.index({ status: 1, department: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ reviewedBy: 1, reviewDate: -1 });

// Calculate total days before saving
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.totalDays = diffDays;
  }
  next();
});

// Virtual for leave duration in readable format
leaveSchema.virtual('duration').get(function() {
  if (this.totalDays === 1) {
    return '1 day';
  }
  return `${this.totalDays} days`;
});

// Virtual to check if leave is current/active
leaveSchema.virtual('isActive').get(function() {
  const today = new Date();
  return this.status === 'approved' && 
         this.startDate <= today && 
         this.endDate >= today;
});

// Virtual to check if leave is upcoming
leaveSchema.virtual('isUpcoming').get(function() {
  const today = new Date();
  return this.status === 'approved' && this.startDate > today;
});

// Static method to get pending leaves for faculty
leaveSchema.statics.getPendingLeaves = function(department = null) {
  const query = { status: 'pending' };
  if (department) {
    query.department = department;
  }
  return this.find(query)
    .sort({ appliedAt: 1 }) // Oldest first
    .populate('studentId', 'name email phone');
};

// Static method to get leaves by date range
leaveSchema.statics.getLeavesByDateRange = function(startDate, endDate, department = null) {
  const query = {
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  };
  
  if (department) {
    query.department = department;
  }
  
  return this.find(query)
    .populate('studentId', 'name email rollNumber')
    .populate('reviewedBy', 'name employeeId')
    .sort({ startDate: 1 });
};

// Instance method to approve leave
leaveSchema.methods.approve = function(reviewerId, reviewerName, comments = '') {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewerName = reviewerName;
  this.reviewDate = new Date();
  this.comments = comments;
  return this.save();
};

// Instance method to reject leave
leaveSchema.methods.reject = function(reviewerId, reviewerName, comments) {
  if (!comments || comments.trim() === '') {
    throw new Error('Comments are required when rejecting a leave');
  }
  
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewerName = reviewerName;
  this.reviewDate = new Date();
  this.comments = comments;
  return this.save();
};

// Pre-validate hook to ensure end date is not before start date
leaveSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be after or equal to start date');
  }
  next();
});

// Post-save hook to log leave applications
leaveSchema.post('save', function(doc, next) {
  console.log(`📝 Leave application saved: ${doc.studentName} (${doc.rollNumber}) - ${doc.leaveType} - ${doc.status}`);
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);