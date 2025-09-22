import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllLeaves, approveLeave, rejectLeave } from '../services/leaveService';
import { logout } from '../services/authService';

const AllLeaves = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    leaveType: ''
  });

  useEffect(() => {
    fetchAllLeaves();
  }, [filters]);

  const fetchAllLeaves = async () => {
    try {
      const data = await getAllLeaves(1, 20, filters); // Get more leaves
      setLeaves(data.leaves || []);
    } catch (error) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    setActionLoading(prev => ({ ...prev, [leaveId]: true }));
    try {
      await approveLeave(leaveId);
      toast.success('Leave approved successfully');
      fetchAllLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    } finally {
      setActionLoading(prev => ({ ...prev, [leaveId]: false }));
    }
  };

  const handleReject = async (leaveId) => {
    const comments = prompt('Please provide reason for rejection:');
    if (!comments) return;

    setActionLoading(prev => ({ ...prev, [leaveId]: true }));
    try {
      await rejectLeave(leaveId, comments);
      toast.success('Leave rejected successfully');
      fetchAllLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    } finally {
      setActionLoading(prev => ({ ...prev, [leaveId]: false }));
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">College Leave Management</div>
        <div className="navbar-user">
          <Link to="/faculty/dashboard" className="action-btn">Dashboard</Link>
          <Link to="/faculty/pending" className="action-btn secondary">Pending</Link>
          <button onClick={() => logout()} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1 className="page-title">All Leave Applications</h1>
        
        {/* Filters */}
        <div className="dashboard-card" style={{ marginBottom: '20px' }}>
          <h3>Filters</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
              <label style={{ marginRight: '10px' }}>Status:</label>
              <select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label style={{ marginRight: '10px' }}>Leave Type:</label>
              <select 
                value={filters.leaveType} 
                onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">All Types</option>
                <option value="medical">Medical</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergency</option>
                <option value="exam">Exam</option>
                <option value="family">Family</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? leaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.studentName}</td>
                  <td>{leave.rollNumber}</td>
                  <td style={{ textTransform: 'capitalize' }}>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.totalDays}</td>
                  <td style={{maxWidth: '200px', wordWrap: 'break-word'}}>
                    {leave.reason.length > 50 ? `${leave.reason.substring(0, 50)}...` : leave.reason}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>{new Date(leave.appliedAt).toLocaleDateString()}</td>
                  <td>
                    {leave.status === 'pending' ? (
                      <div style={{display: 'flex', gap: '5px', flexDirection: 'column'}}>
                        <button
                          onClick={() => handleApprove(leave._id)}
                          className="action-btn"
                          style={{fontSize: '12px', padding: '4px 8px'}}
                          disabled={actionLoading[leave._id]}
                        >
                          {actionLoading[leave._id] ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(leave._id)}
                          className="action-btn danger"
                          style={{fontSize: '12px', padding: '4px 8px'}}
                          disabled={actionLoading[leave._id]}
                        >
                          {actionLoading[leave._id] ? '...' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {leave.reviewerName ? `By: ${leave.reviewerName}` : 'Reviewed'}
                        <br />
                        {leave.comments && (
                          <small style={{ fontStyle: 'italic' }}>
                            {leave.comments.length > 30 ? `${leave.comments.substring(0, 30)}...` : leave.comments}
                          </small>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="10" style={{textAlign: 'center', padding: '30px'}}>
                    No leave applications found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Showing {leaves.length} leave applications from CSE department
        </div>
      </div>
    </div>
  );
};

export default AllLeaves;