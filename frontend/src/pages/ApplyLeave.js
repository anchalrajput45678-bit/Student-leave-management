 import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { applyLeave } from '../services/leaveService';
import { logout } from '../services/authService';
import '../styles/Auth.css';

const ApplyLeave = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const startDate = watch('startDate');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      console.log('Frontend form data:', data);
      
      // Calculate total days
      const totalDays = calculateDays(data.startDate, data.endDate);
      
      // Prepare simple JSON data (no file upload for now)
      const leaveData = {
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        contactNumber: data.contactNumber || '',
        emergencyContact: data.emergencyContact || ''
      };

      console.log('Sending leave data:', leaveData);

      await applyLeave(leaveData);
      toast.success('Leave application submitted successfully!');
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Frontend error:', error);
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          College Leave Management
        </div>
        <div className="navbar-user">
          <span>Welcome, {user.name}</span>
          <Link to="/student/dashboard" className="action-btn" style={{marginRight: '10px'}}>
            Dashboard
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="form-container">
          <h2 className="form-title">Apply for Leave</h2>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label>Leave Type *</label>
                <select
                  {...register('leaveType', { required: 'Leave type is required' })}
                  className={errors.leaveType ? 'error' : ''}
                >
                  <option value="">Select Leave Type</option>
                  <option value="medical">Medical Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="exam">Exam Related</option>
                  <option value="family">Family Function</option>
                  <option value="other">Other</option>
                </select>
                {errors.leaveType && <span className="error-message">{errors.leaveType.message}</span>}
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={user.department}
                  disabled
                  style={{background: '#f8f9fa', color: '#6c757d'}}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  {...register('startDate', {
                    required: 'Start date is required',
                    validate: value => {
                      const today = new Date().toISOString().split('T')[0];
                      return value >= today || 'Start date cannot be in the past';
                    }
                  })}
                  className={errors.startDate ? 'error' : ''}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.startDate && <span className="error-message">{errors.startDate.message}</span>}
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  {...register('endDate', {
                    required: 'End date is required',
                    validate: value => {
                      if (!startDate) return true;
                      return value >= startDate || 'End date must be after start date';
                    }
                  })}
                  className={errors.endDate ? 'error' : ''}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
                {errors.endDate && <span className="error-message">{errors.endDate.message}</span>}
              </div>
            </div>

            {startDate && watch('endDate') && (
              <div className="form-group">
                <label>Total Days</label>
                <input
                  type="text"
                  value={`${calculateDays(startDate, watch('endDate'))} days`}
                  disabled
                  style={{background: '#f8f9fa', color: '#6c757d'}}
                />
              </div>
            )}

            <div className="form-group">
              <label>Reason for Leave *</label>
              <textarea
                {...register('reason', {
                  required: 'Reason is required',
                  minLength: {
                    value: 10,
                    message: 'Reason must be at least 10 characters'
                  }
                })}
                className={errors.reason ? 'error' : ''}
                placeholder="Please provide detailed reason for your leave..."
                rows="4"
              />
              {errors.reason && <span className="error-message">{errors.reason.message}</span>}
            </div>

            <div className="form-group">
              <label>Supporting Documents</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="documents"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
                <label htmlFor="documents" className="file-upload-label">
                  📎 Choose files (PDF, Images, Documents)
                </label>
                <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                  Upload medical certificates, official letters, etc. (Optional)
                </p>
              </div>
              {selectedFiles.length > 0 && (
                <div style={{marginTop: '10px'}}>
                  <p style={{fontSize: '14px', color: '#333', fontWeight: '500'}}>Selected files:</p>
                  <ul style={{fontSize: '12px', color: '#666'}}>
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Contact During Leave</label>
              <input
                type="tel"
                {...register('contactNumber')}
                placeholder="Phone number where you can be reached"
                defaultValue={user.phone}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                type="text"
                {...register('emergencyContact')}
                placeholder="Emergency contact person and number"
              />
            </div>

            <div style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
              <button
                type="submit"
                className="auth-button"
                disabled={loading}
                style={{flex: 1}}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              
              <Link
                to="/student/dashboard"
                className="auth-button"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  textDecoration: 'none',
                  background: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;