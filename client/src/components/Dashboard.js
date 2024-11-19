// src/components/Dashboard.js
import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import TaskList from './TaskList';
import Reports from './Reports';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const onLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Task Manager</h1>
        <div>
          <span className="mr-4 text-gray-700">Hello, {auth.user?.name}</span>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TaskList />
        </div>
        <div>
          <Reports />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
