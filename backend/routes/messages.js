const express = require('express');
const Message = require('../models/Message');
const { announceNewMessage } = require('../services/activity');

const router = express.Router();

// @route   POST /api/messages
// @desc    Create a new contact message
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMessage = await Message.create({
      name,
      email,
      subject,
      message
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    });
    announceNewMessage(newMessage).catch((error) => console.error('Message notification failed:', error.message));
  } catch (error) {
    next(error);
  }
});

module.exports = router;

