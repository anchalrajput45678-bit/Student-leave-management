 import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDashboardStats, getMyLeaves } from '../services/leaveService';
import { logout } from '../services/authService';
import '../styles/Auth.css';

const StudentDashboard = ({ user, setUser }) => {
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, leavesData] = await Promise.all([
        getDashboardStats(),
        getMyLeaves(1, 5) // Get recent 5 leaves
      ]);
      
      setStats(statsData);
      setRecentLeaves(leavesData.leaves || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          College Leave Management
        </div>
        <div className="navbar-user">
          <span>Welcome, {user.name}</span>
          <span>({user.rollNumber})</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1 className="page-title">Student Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Total Leaves</h3>
            </div>
            <div className="card-value">{stats.totalLeaves}</div>
            <p>Total applications submitted</p>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Pending</h3>
            </div>
            <div className="card-value" style={{color: '#f39c12'}}>{stats.pendingLeaves}</div>
            <p>Awaiting approval</p>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Approved</h3>
            </div>
            <div className="card-value" style={{color: '#27ae60'}}>{stats.approvedLeaves}</div>
            <p>Approved applications</p>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Rejected</h3>
            </div>
            <div className="card-value" style={{color: '#e74c3c'}}>{stats.rejectedLeaves}</div>
            <p>Rejected applications</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/student/apply-leave" className="action-btn">
              Apply for Leave
            </Link>
            <Link to="/student/history" className="action-btn secondary">
              View History
            </Link>
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="table-container">
          <h3 className="card-title" style={{padding: '20px 20px 0'}}>Recent Leave Applications</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaves.length > 0 ? (
                recentLeaves.map((leave) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '30px'}}>
                    No leave applications found. 
                    <Link to="/student/apply-leave" style={{color: '#667eea', marginLeft: '5px'}}>
                      Apply for your first leave
                    </Link>
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

export default StudentDashboard;