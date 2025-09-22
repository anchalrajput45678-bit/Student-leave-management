import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { register as registerUser } from '../services/authService';
import '../styles/Auth.css';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const watchRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        

  {/* ✅ CDGI College Image */}
  <div className="college-image">
    <img 
      src="https://i.pinimg.com/originals/e2/f6/91/e2f691820a7d9b245f1ffe1337f86436.jpg" 
      alt="CDGI College"
      style={{ width: "100%", borderRadius: "8px", marginBottom: "15px" }}
    />
  </div>
        <div className="auth-header">
          <h1>College Leave Management</h1>
          <h2>Create New Account</h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email format'
                }
              })}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              {...register('role', { required: 'Please select your role' })}
              className={errors.role ? 'error' : ''}
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
            {errors.role && <span className="error-message">{errors.role.message}</span>}
          </div>

          {watchRole === 'student' && (
            <>
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  {...register('rollNumber', {
                    required: 'Roll number is required'
                  })}
                  className={errors.rollNumber ? 'error' : ''}
                  placeholder="Enter your roll number"
                />
                {errors.rollNumber && <span className="error-message">{errors.rollNumber.message}</span>}
              </div>

              <div className="form-group">
                <label>Semester</label>
                <select
                  {...register('semester', { required: 'Please select semester' })}
                  className={errors.semester ? 'error' : ''}
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
                {errors.semester && <span className="error-message">{errors.semester.message}</span>}
              </div>
            </>
          )}

          {watchRole === 'faculty' && (
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                {...register('employeeId', {
                  required: 'Employee ID is required'
                })}
                className={errors.employeeId ? 'error' : ''}
                placeholder="Enter your employee ID"
              />
              {errors.employeeId && <span className="error-message">{errors.employeeId.message}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Department</label>
            <select
              {...register('department', { required: 'Please select department' })}
              className={errors.department ? 'error' : ''}
            >
              <option value="">Select Department</option>
              <option value="CSE">Computer Science Engineering</option>
              <option value="ECE">Electronics & Communication</option>
              <option value="ME">Mechanical Engineering</option>
              <option value="CE">Civil Engineering</option>
              <option value="EE">Electrical Engineering</option>
              <option value="IT">Information Technology</option>
            </select>
            {errors.department && <span className="error-message">{errors.department.message}</span>}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit phone number'
                }
              })}
              className={errors.phone ? 'error' : ''}
              placeholder="Enter your phone number"
            />
            {errors.phone && <span className="error-message">{errors.phone.message}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;