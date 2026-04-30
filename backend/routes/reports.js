const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Listing = require('../models/Listing');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// POST /api/reports — create a report (any authenticated user)
router.post('/', auth, async (req, res) => {
  try {
    const { reportedUserId, listingId, messageId, reason, details } = req.body;
    if (!reason) return res.status(400).json({ message: 'reason is required' });
    if (!reportedUserId && !listingId && !messageId) {
      return res.status(400).json({ message: 'reportedUserId, listingId, or messageId is required' });
    }

    const report = new Report({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      listing: listingId,
      message: messageId,
      reason,
      details
    });
    await report.save();

    // Auto-flag the listing so admin can see it easily
    if (listingId) {
      const listing = await Listing.findById(listingId);
      if (listing) {
        listing.flagged = true;
        listing.flagReason = reason;
        await listing.save();
      }
    }

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reports — list all reports (admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate('reporter', 'username email')
      .populate('reportedUser', 'username email')
      .populate('listing', 'title status')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/reports/:id/status — update report status (admin only)
router.patch('/:id/status', auth, admin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (status && !['open', 'reviewing', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (status) report.status = status;
    if (typeof adminNote === 'string') report.adminNote = adminNote;
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/reports/user/:id/ban — ban or unban a user (admin only)
router.patch('/user/:id/ban', auth, admin, async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = typeof isBanned === 'boolean' ? isBanned : !user.isBanned;
    await user.save();
    res.json({ id: user._id, isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
