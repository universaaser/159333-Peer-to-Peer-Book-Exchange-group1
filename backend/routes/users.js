const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// GET /api/users — list all users (admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/me — own full profile (auth required)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/me — update own profile (auth required)
router.put('/me', auth, async (req, res) => {
  try {
    const { bio, contactInfo, avatar, interestedCourses, interestedSubjects } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (bio               !== undefined) user.bio               = bio;
    if (contactInfo       !== undefined) user.contactInfo       = contactInfo;
    if (avatar            !== undefined) user.avatar            = avatar;
    if (interestedCourses  !== undefined) user.interestedCourses  = interestedCourses;
    if (interestedSubjects !== undefined) user.interestedSubjects = interestedSubjects;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/:id — public profile (no auth required)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username rating reviewCount bio createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/users/:id/ban — ban or unban (admin only)
router.patch('/:id/ban', auth, admin, async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBanned = typeof isBanned === 'boolean' ? isBanned : !user.isBanned;
    await user.save();
    res.json({ id: user._id, username: user.username, isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
