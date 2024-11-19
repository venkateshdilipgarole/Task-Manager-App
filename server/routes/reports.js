// routes/reports.js
const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const asyncHandler = require('express-async-handler');
const auth = require('../middleware/auth'); // Your authentication middleware
const Task = require('../models/Task'); // Your Task model
const User = require('../models/User'); // Your User model (if needed)

// GET /api/reports/tasks-summary
router.get(
  '/tasks-summary',
  auth, // Ensure the user is authenticated
  asyncHandler(async (req, res) => {
    const { status, user, startDate, endDate, format } = req.query;

    // Build the query object based on filters
    let query = {};

    // If the user is not an admin, they can only see their own tasks
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    if (status) {
      query.status = status;
    }

    if (user && req.user.role === 'admin') {
      query.assignedUser = user;
    }

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) {
        query.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dueDate.$lte = new Date(endDate);
      }
    }

    // Fetch tasks based on the query
    const tasks = await Task.find(query).populate('assignedUser', 'name email');

    // Generate summary data
    const summary = {
      totalTasks: tasks.length,
      tasksByStatus: {},
      tasksByUser: {},
      tasksOverdue: tasks.filter(task => new Date(task.dueDate) < new Date()).length,
    };

    tasks.forEach(task => {
      // Count by Status
      if (summary.tasksByStatus[task.status]) {
        summary.tasksByStatus[task.status] += 1;
      } else {
        summary.tasksByStatus[task.status] = 1;
      }

      // Count by Assigned User
      const assignedUser = task.assignedUser ? task.assignedUser.name : 'Unassigned';
      if (summary.tasksByUser[assignedUser]) {
        summary.tasksByUser[assignedUser] += 1;
      } else {
        summary.tasksByUser[assignedUser] = 1;
      }
    });

    if (format === 'csv') {
      // Convert summary to CSV
      const fields = ['Metric', 'Value'];
      const data = [
        { Metric: 'Total Tasks', Value: summary.totalTasks },
        { Metric: 'Tasks Overdue', Value: summary.tasksOverdue },
      ];

      // Add Tasks by Status
      for (const [status, count] of Object.entries(summary.tasksByStatus)) {
        data.push({ Metric: `Tasks - ${status}`, Value: count });
      }

      // Add Tasks by User
      for (const [userName, count] of Object.entries(summary.tasksByUser)) {
        data.push({ Metric: `Tasks - Assigned to ${userName}`, Value: count });
      }

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);

      res.header('Content-Type', 'text/csv');
      res.attachment('tasks_summary.csv');
      return res.send(csv);
    } else {
      // Return JSON summary
      return res.json(summary);
    }
  })
);

module.exports = router;
