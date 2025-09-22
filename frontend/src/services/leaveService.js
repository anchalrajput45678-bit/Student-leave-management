 import api from './authService';

// Apply for leave - SIMPLIFIED VERSION
export const applyLeave = async (leaveData) => {
  try {
    console.log('Service: Sending leave data:', leaveData);
    
    const response = await api.post('/leaves/apply', leaveData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Service: Response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Service: API Error:', error.response?.data);
    throw error.response?.data?.message || 'Failed to apply for leave';
  }
};

// Get student's leaves
export const getMyLeaves = async (page = 1, limit = 10, status = '') => {
  try {
    const response = await api.get('/leaves/my-leaves', {
      params: { page, limit, status }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch leaves';
  }
};

// // Get pending leaves (for faculty)
// export const getPendingLeaves = async (page = 1, limit = 10, department = '') => {
//   try {
//     const response = await api.get('/leaves/pending', {
//       params: { page, limit, department }
//     });
//     return response.data;
//   } catch (error) {
//     throw error.response?.data?.message || 'Failed to fetch pending leaves';
//   }
// };

// Get all leaves (for faculty)
export const getAllLeaves = async (page = 1, limit = 10, filters = {}) => {
  try {
    const response = await api.get('/leaves/all', {
      params: { page, limit, ...filters }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch leaves';
  }
};
export const getPendingLeaves = async (page = 1, limit = 10, department = '') => {
  try {
    console.log('Service: Calling /leaves/pending');
    const response = await api.get('/leaves/pending', {
      params: { page, limit, department }
    });
    console.log('Service: Response:', response.data);
    return response.data.data; // Note: response.data.data because of API structure
  } catch (error) {
    console.error('Service error:', error);
    throw error.response?.data?.message || 'Failed to fetch pending leaves';
  }
};
// Approve leave
export const approveLeave = async (leaveId, comments = '') => {
  try {
    const response = await api.put(`/leaves/${leaveId}/approve`, { comments });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to approve leave';
  }
};

// Reject leave
export const rejectLeave = async (leaveId, comments) => {
  try {
    const response = await api.put(`/leaves/${leaveId}/reject`, { comments });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to reject leave';
  }
};

// Get single leave details
export const getLeaveById = async (leaveId) => {
  try {
    const response = await api.get(`/leaves/${leaveId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch leave details';
  }
};

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/leaves/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch stats';
  }
};