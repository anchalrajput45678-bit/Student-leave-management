 import React, { useState, useEffect } from 'react';
 import AllLeaves from './pages/AllLeaves';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Services
import { getCurrentUser } from './services/authService';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import ApplyLeave from './pages/ApplyLeave';
import LeaveHistory from './pages/LeaveHistory';
import PendingLeaves from './pages/PendingLeaves';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser()
        .then(userData => {
          setUser(userData);
          setLoading(false);
        })
        .catch(error => {
          console.error('Auth error:', error);
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const PrivateRoute = ({ children, allowedRole }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRole && user.role !== allowedRole) {
      return <Navigate to="/unauthorized" />;
    }
    
    return children;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login setUser={setUser} /> : <Navigate to={user.role === 'student' ? '/student/dashboard' : '/faculty/dashboard'} />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to={user.role === 'student' ? '/student/dashboard' : '/faculty/dashboard'} />} 
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <PrivateRoute allowedRole="student">
              <StudentDashboard user={user} setUser={setUser} />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/apply-leave"
          element={
            <PrivateRoute allowedRole="student">
              <ApplyLeave user={user} />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/history"
          element={
            <PrivateRoute allowedRole="student">
              <LeaveHistory user={user} />
            </PrivateRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/dashboard"
          element={
            <PrivateRoute allowedRole="faculty">
              <FacultyDashboard user={user} setUser={setUser} />
            </PrivateRoute>
          }
        />
        <Route
          path="/faculty/pending"
          element={
            <PrivateRoute allowedRole="faculty">
              <PendingLeaves user={user} />
            </PrivateRoute>
          }
        />
<Route
  path="/faculty/all-leaves"
  element={
    <PrivateRoute allowedRole="faculty">
      <AllLeaves user={user} />
    </PrivateRoute>
  }
/>
        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/unauthorized" element={<div className="error-page">Unauthorized Access</div>} />
        <Route path="*" element={<div className="error-page">Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;