import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPendingLeaves, approveLeave, rejectLeave } from '../services/leaveService';
import { logout } from '../services/authService';

const PendingLeaves = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
  try {
    console.log('Frontend: Fetching pending leaves...');
    const data = await getPendingLeaves();
    console.log('Frontend: Received data:', data);
    console.log('Frontend: Leaves array:', data.leaves);
    setLeaves(data.leaves || []);
  } catch (error) {
    console.error('Frontend error:', error);
    toast.error('Failed to load pending leaves');
  } finally {
    setLoading(false);
  }
};
  // const fetchPendingLeaves = async () => {
  //   try {
  //     const data = await getPendingLeaves();
  //     setLeaves(data.leaves || []);
  //   } catch (error) {
  //     toast.error('Failed to load pending leaves');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleApprove = async (leaveId) => {
    setActionLoading(prev => ({ ...prev, [leaveId]: true }));
    try {
      await approveLeave(leaveId);
      toast.success('Leave approved successfully');
      fetchPendingLeaves();
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
      fetchPendingLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    } finally {
      setActionLoading(prev => ({ ...prev, [leaveId]: false }));
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
          <Link to="/faculty/dashboard" className="action-btn">Dashboard</Link>
          <button onClick={() => logout()} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1 className="page-title">Pending Leave Applications</h1>
        
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
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? leaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.studentName}</td>
                  <td>{leave.rollNumber}</td>
                  <td>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.totalDays}</td>
                  <td style={{maxWidth: '200px', wordWrap: 'break-word'}}>
                    {leave.reason.substring(0, 50)}...
                  </td>
                  <td>{new Date(leave.appliedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button
                        onClick={() => handleApprove(leave._id)}
                        className="action-btn"
                        style={{fontSize: '12px', padding: '5px 10px'}}
                        disabled={actionLoading[leave._id]}
                      >
                        {actionLoading[leave._id] ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(leave._id)}
                        className="action-btn danger"
                        style={{fontSize: '12px', padding: '5px 10px'}}
                        disabled={actionLoading[leave._id]}
                      >
                        {actionLoading[leave._id] ? '...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" style={{textAlign: 'center', padding: '30px'}}>
                    No pending applications
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

export default PendingLeaves;