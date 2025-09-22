const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    required: [true, 'Please specify role'],
    enum: {
      values: ['student', 'faculty', 'admin'],
      message: 'Role must be either student, faculty, or admin'
    }
  },
  
  // Student specific fields
  rollNumber: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true,
    trim: true
  },
  semester: {
    type: Number,
    required: function() {
      return this.role === 'student';
    },
    min: [1, 'Semester must be between 1-8'],
    max: [8, 'Semester must be between 1-8']
  },
  
  // Faculty specific fields
  employeeId: {
    type: String,
    required: function() {
      return this.role === 'faculty';
    },
    unique: true,
    sparse: true,
    trim: true
  },
  
  // Common fields
  department: {
    type: String,
    required: [true, 'Please provide department'],
    enum: {
      values: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT'],
      message: 'Please select a valid department'
    }
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ rollNumber: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1, department: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role,
      department: this.department
    },
    process.env.JWT_SECRET || 'fallback-secret',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
  if (this.role === 'student') {
    return `${this.name} (${this.rollNumber})`;
  } else if (this.role === 'faculty') {
    return `${this.name} (${this.employeeId})`;
  }
  return this.name;
});

// Validation for unique roll number and employee ID
userSchema.pre('validate', function(next) {
  if (this.role === 'student' && !this.rollNumber) {
    this.invalidate('rollNumber', 'Roll number is required for students');
  }
  if (this.role === 'faculty' && !this.employeeId) {
    this.invalidate('employeeId', 'Employee ID is required for faculty');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);