// src/components/TaskList.js
import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import TaskForm from './TaskForm';
import EditTaskModal from './EditTaskModal'; // Ensure you've created this component
import api from '../utils/api'; // Centralized Axios instance

const TaskList = () => {
  const { auth } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', assignedUser: '' });
  const [users, setUsers] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // Task to edit

  // Fetch tasks with filters and pagination
  const fetchTasks = async (page = 1) => {
    setLoadingTasks(true);
    setError(null);
    setSuccessMsg('');

    // Prepare query parameters, omitting empty assignedUser
    const params = { ...filters, page, limit: 10 };
    if (params.assignedUser === '') {
      delete params.assignedUser;
    }

    try {
      const res = await api.get('/tasks', { params }); // Corrected endpoint
      setTasks(res.data.tasks);
      setPagination({ currentPage: res.data.currentPage, totalPages: res.data.totalPages });
    } catch (err) {
      console.error('Error fetching tasks:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Failed to fetch tasks.');
    } finally {
      setLoadingTasks(false);
    }
  };

  // Fetch all users for assignment (only admins)
  const fetchUsers = async () => {
    if (auth.user?.role !== 'admin') return; // Only admins can assign tasks
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await api.get('/users'); // Corrected endpoint
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Failed to fetch users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!auth.loading) { // Ensure user data is loaded
      fetchTasks();
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [filters, auth.loading]); // Re-fetch when filters or auth changes

  // Handle Delete Task
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this task?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/tasks/${id}`); // Corrected DELETE request URL with backticks
      setSuccessMsg('Task deleted successfully.');
      fetchTasks(pagination.currentPage); // Refresh tasks after deletion
    } catch (err) {
      console.error('Error deleting task:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Failed to delete task.');
    }
  };

  // Handle Edit Task - Opens the Edit Modal
  const handleEdit = (task) => {
    setCurrentTask(task);
    setIsEditModalOpen(true);
  };

  // Handle Page Change for Pagination
  const handlePageChange = (page) => {
    fetchTasks(page);
  };

  // Handle Filter Change
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentTask(null);
  };

  if (auth.loading || loadingTasks || (auth.user?.role === 'admin' && loadingUsers)) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
      <TaskForm onTaskCreated={() => fetchTasks(pagination.currentPage)} />

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMsg}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mt-6">
        <input
          type="text"
          name="search"
          placeholder="Search by title or description..."
          value={filters.search}
          onChange={handleFilterChange}
          className="px-3 py-2 border rounded w-full md:w-auto focus:outline-none focus:ring focus:border-blue-300"
        />
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="px-3 py-2 border rounded w-full md:w-auto focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
          className="px-3 py-2 border rounded w-full md:w-auto focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        {auth.user?.role === 'admin' && (
          <select
            name="assignedUser"
            value={filters.assignedUser}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded w-full md:w-auto focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => fetchTasks()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
        >
          Apply Filters
        </button>
      </div>

      {/* Task List */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Due Date</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Priority</th>
              <th className="py-2 px-4 border-b">Assigned User</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map(task => (
                <tr key={task._id} className="text-center hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{task.title}</td>
                  <td className="py-2 px-4 border-b">{task.description}</td>
                  <td className="py-2 px-4 border-b">{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border-b">{task.status}</td>
                  <td className="py-2 px-4 border-b">{task.priority}</td>
                  <td className="py-2 px-4 border-b">{task.assignedUser ? task.assignedUser.name : 'Unassigned'}</td>
                  <td className="py-2 px-4 border-b">
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200"
                    >
                      Delete
                    </button>
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(task)}
                      className="ml-3 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition duration-200"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-4 text-gray-500">No tasks found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              disabled={pagination.currentPage === i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded ${
                pagination.currentPage === i + 1
                  ? 'bg-blue-500 text-white cursor-default'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition duration-200`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && currentTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onRequestClose={closeEditModal}
          task={currentTask}
          onTaskUpdated={() => fetchTasks(pagination.currentPage)}
        />
      )}
    </div>
  );
};

export default TaskList;
