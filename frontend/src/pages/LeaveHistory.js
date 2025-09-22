import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyLeaves } from '../services/leaveService';
import { logout } from '../services/authService';

const LeaveHistory = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await getMyLeaves();
      setLeaves(data.leaves || []);
    } catch (error) {
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">College Leave Management</div>
        <div className="navbar-user">
          <Link to="/student/dashboard" className="action-btn">Dashboard</Link>
          <button onClick={() => logout()} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1 className="page-title">Leave History</h1>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? leaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.totalDays}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>{new Date(leave.appliedAt).toLocaleDateString()}</td>
                  <td>{leave.comments || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>
                    No leave history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;