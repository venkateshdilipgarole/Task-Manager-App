// src/components/Reports.js
import React, { useState, useContext, useEffect } from 'react';
import api from '../utils/api'; // Use the centralized Axios instance
import AuthContext from '../context/AuthContext';

const Reports = () => {
  const { auth } = useContext(AuthContext);
  const [filters, setFilters] = useState({
    status: '',
    user: '',
    startDate: '',
    endDate: '',
    format: 'json',
  });
  const [reportData, setReportData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);

  // Fetch users for filter (admins only)
  const fetchUsers = async () => {
    if (auth.user?.role !== 'admin') return; // Added null check
    try {
      const res = await api.get('/users'); // Use centralized Axios instance
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (!auth.loading) { // Ensure not loading
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [auth.loading, auth.token]); // Added dependencies

  const onChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoadingReport(true);
    setError(null);
    setReportData(null);

    try {
      const res = await api.get('/reports/tasks-summary', { // Adjusted endpoint based on baseURL
        params: filters,
      });

      if (filters.format === 'csv') {
        // Handle CSV download
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute('download', 'tasks_summary.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setReportData(res.data);
      }

    } catch (err) {
      console.error('Error generating report:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Failed to generate report.');
    } finally {
      setLoadingReport(false);
    }
  };

  if (auth.loading) {
    return <div>Loading...</div>; // Optional: Add a loading indicator
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Task Summary Report</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        {auth.user?.role === 'admin' && (
          <div>
            <label className="block text-gray-700">User:</label>
            <select
              name="user"
              value={filters.user}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-gray-700">Status:</label>
          <select
            name="status"
            value={filters.status}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700">Start Date:</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700">End Date:</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700">Format:</label>
          <select
            name="format"
            value={filters.format}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition duration-200"
          disabled={loadingReport}
        >
          {loadingReport ? 'Generating...' : 'Generate Report'}
        </button>
      </form>

      {reportData && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Report Data</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(reportData, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Reports;
