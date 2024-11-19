// routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Create a new task
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('status').optional().isIn(['To Do', 'In Progress', 'Completed']),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
  body('assignedUser').optional().isMongoId().withMessage('Valid user ID is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { title, description, dueDate, status, priority, assignedUser } = req.body;
  
  try {
    if (assignedUser) {
      const user = await User.findById(assignedUser);
      if (!user) {
        return res.status(400).json({ msg: 'Assigned user does not exist' });
      }
    }
    
    const task = new Task({
      title,
      description,
      dueDate,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assignedUser: assignedUser || null,
      createdBy: req.user.id, // Ensure this is set
    });
    
    await task.save();
    res.json(task);
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Get tasks with pagination, search, and filtering
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, search, status, priority, assignedUser } = req.query;
  
  const query = {};
  
  // Non-admin users see only their tasks or tasks they created
  if (req.user.role !== 'admin') {
    query.$or = [
      { assignedUser: req.user.id },
      { createdBy: req.user.id },
    ];
  }
  
  // Search by title or description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Filtering
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedUser) query.assignedUser = assignedUser;
  
  try {
    const tasks = await Task.find(query)
      .populate('assignedUser', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Task.countDocuments(query);
    
    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
    
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a single task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedUser', 'name email')
      .populate('createdBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Authorization
    if (req.user.role !== 'admin' && task.assignedUser.toString() !== req.user.id && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    res.json(task);
    
  } catch(err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
});

// Update a task
// PUT /api/tasks/:id - Update a task
router.put('/:id', auth, async (req, res) => {
  const { title, description, dueDate, status, priority, assignedUser } = req.body;

  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Authorization: only creator or admin can update
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Update fields
    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.assignedUser = assignedUser || task.assignedUser;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('PUT /api/tasks/:id Error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  console.log(`DELETE Request Received for Task ID: ${req.params.id}`);
  console.log(`Authenticated User: ID=${req.user.id}, Role=${req.user.role}`);

  try {
    const task = await Task.findById(req.params.id);
    console.log('Fetched Task:', task);

    if (!task) {
      console.log(`Task with ID ${req.params.id} not found.`);
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Authorization: only creator or admin can delete
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      console.log(`User ID ${req.user.id} is not authorized to delete Task ID ${req.params.id}.`);
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Delete the task using deleteOne()
    await task.deleteOne();
    console.log(`Task ID ${req.params.id} deleted by User ID ${req.user.id}.`);
    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error('DELETE /api/tasks/:id Error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
});


module.exports = router;
