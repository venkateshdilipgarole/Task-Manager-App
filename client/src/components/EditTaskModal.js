// src/components/EditTaskModal.js
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import api from '../utils/api'; // Centralized Axios instance
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// Inside the component
// Bind modal to your appElement (for accessibility)
Modal.setAppElement('#root'); // Ensure this matches your app's root element

const EditTaskModal = ({ isOpen, onRequestClose, task, onTaskUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: '',
    priority: '',
    assignedUser: '',
  });
  const { auth } = useContext(AuthContext);
  const [users, setUsers] = useState([]); // For assigning users
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch users if the current user is an admin
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users for edit modal:', err.response?.data || err.message);
      }
    };

    // Assuming you have access to auth context here, otherwise pass users as props
    fetchUsers();
  }, []);

  // Initialize form data with the task's current data
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // Format as YYYY-MM-DD
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        assignedUser: task.assignedUser ? task.assignedUser._id : '',
      });
    }
  }, [task]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form data if necessary

    try {
      await api.put(`/tasks/${task._id}`, formData); // Assuming PUT endpoint for updating tasks
      setLoading(false);
      onTaskUpdated(); // Refresh the task list in the parent component
      onRequestClose(); // Close the modal
    } catch (err) {
      console.error('Error updating task:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Failed to update task.');
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Edit Task"
      className="max-w-lg mx-auto mt-10 bg-white p-6 rounded shadow-lg outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center"
    >
      <h2 className="text-2xl font-semibold mb-4">Edit Task</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="mb-4">
          <label className="block text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          ></textarea>
        </div>

        {/* Due Date */}
        <div className="mb-4">
          <label className="block text-gray-700">Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label className="block text-gray-700">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Assigned User (Admin Only) */}
        {auth.user?.role === 'admin' && (
          <div className="mb-4">
            <label className="block text-gray-700">Assign To</label>
            <select
              name="assignedUser"
              value={formData.assignedUser}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Submit and Cancel Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onRequestClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
          >
            {loading ? 'Updating...' : 'Update Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTaskModal;
