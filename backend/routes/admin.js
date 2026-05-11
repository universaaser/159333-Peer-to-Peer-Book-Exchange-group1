const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Report = require('../models/Report');

// GET /api/admin/stats — aggregated dashboard data
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const [listingStats, userStats, transactionStats, reportStats] = await Promise.all([
      Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: {
        _id: null,
        total:  { $sum: 1 },
        banned: { $sum: { $cond: ['$isBanned', 1, 0] } },
        admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
      }}]),
      Transaction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const toMap = (arr) => arr.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});
    const lMap = toMap(listingStats);
    const tMap = toMap(transactionStats);
    const rMap = toMap(reportStats);
    const u = userStats[0] || { total: 0, banned: 0, admins: 0 };

    res.json({
      listings: {
        total:     Object.values(lMap).reduce((a, b) => a + b, 0),
        available: lMap.available || 0,
        sold:      lMap.sold      || 0,
        reserved:  lMap.reserved  || 0,
        pending:   lMap.pending   || 0,
        removed:   lMap.removed   || 0,
      },
      users: {
        total:   u.total,
        active:  u.total - u.banned - u.admins,
        banned:  u.banned,
        admins:  u.admins,
      },
      transactions: {
        total:     Object.values(tMap).reduce((a, b) => a + b, 0),
        pending:   tMap.pending   || 0,
        confirmed: tMap.confirmed || 0,
        completed: tMap.completed || 0,
        cancelled: tMap.cancelled || 0,
      },
      reports: {
        total:     Object.values(rMap).reduce((a, b) => a + b, 0),
        open:      rMap.open      || 0,
        reviewing: rMap.reviewing || 0,
        closed:    rMap.closed    || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
