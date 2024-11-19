// src/components/TaskForm.js
import React, { useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';

const TaskForm = ({ onTaskCreated }) => {
  const { auth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    assignedUser: '',
  });

  const [users, setUsers] = useState([]);

  const [errors, setErrors] = useState([]);

  const { title, description, dueDate, priority, assignedUser } = formData;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users', {
          headers: { 'Authorization': `Bearer ${auth.token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users:', err.response?.data || err.message);
      }
    };

    if (auth.user?.role === 'admin') { // Added optional chaining
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [auth.user?.role, auth.token]); // Added dependencies

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      // Prepare data to send
      const dataToSend = { ...formData };
      if (dataToSend.assignedUser === '') {
        delete dataToSend.assignedUser; // Remove assignedUser if not selected
      }

      await api.post('/tasks', dataToSend, {
        headers: { 'Authorization': `Bearer ${auth.token}` },
      });
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'Medium',
        assignedUser: '',
      });
      setErrors([]);
      onTaskCreated();
    } catch (err) {
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response && err.response.data.msg) {
        setErrors([{ msg: err.response.data.msg }]);
      } else {
        setErrors([{ msg: 'An unexpected error occurred.' }]);
      }
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Create New Task</h3>
      {errors.length > 0 && (
        <div className="mb-4">
          {errors.map(error => (
            <p key={error.msg} className="text-red-500 text-sm">{error.msg}</p>
          ))}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Title:</label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700">Description:</label>
          <textarea
            name="description"
            value={description}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700">Due Date:</label>
          <input
            type="date"
            name="dueDate"
            value={dueDate}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700">Priority:</label>
          <select
            name="priority"
            value={priority}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        {auth.user?.role === 'admin' && ( // Added optional chaining
          <div>
            <label className="block text-gray-700">Assign To:</label>
            <select
              name="assignedUser"
              value={assignedUser}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition duration-200"
        >
          Create Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
