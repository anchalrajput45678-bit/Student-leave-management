import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDashboardStats, getPendingLeaves } from '../services/leaveService';
import { logout } from '../services/authService';

const FacultyDashboard = ({ user, setUser }) => {
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, leavesData] = await Promise.all([
        getDashboardStats(),
        getPendingLeaves(1, 5)
      ]);
      
      setStats(statsData);
      setPendingLeaves(leavesData.leaves || []);
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

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">College Leave Management</div>
        <div className="navbar-user">
          <span>Welcome, {user.name}</span>
          <span>({user.employeeId})</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1 className="page-title">Faculty Dashboard</h1>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3 className="card-title">Total Leaves</h3>
            <div className="card-value">{stats.totalLeaves}</div>
            <p>Total applications received</p>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">Pending Review</h3>
            <div className="card-value" style={{color: '#f39c12'}}>{stats.pendingLeaves}</div>
            <p>Awaiting your review</p>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">Approved</h3>
            <div className="card-value" style={{color: '#27ae60'}}>{stats.approvedLeaves}</div>
            <p>Approved by you</p>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">Rejected</h3>
            <div className="card-value" style={{color: '#e74c3c'}}>{stats.rejectedLeaves}</div>
            <p>Rejected by you</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/faculty/pending" className="action-btn">
              Review Pending Leaves
            </Link>
             <Link to="/faculty/all-leaves" className="action-btn secondary">
  View All Leaves
</Link> 
          </div>
        </div>

        <div className="table-container">
          <h3 className="card-title" style={{padding: '20px 20px 0'}}>Recent Pending Applications</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>Days</th>
                <th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.length > 0 ? pendingLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.studentName}</td>
                  <td>{leave.rollNumber}</td>
                  <td>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{leave.totalDays}</td>
                  <td>{new Date(leave.appliedAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '30px'}}>
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

export default FacultyDashboard;