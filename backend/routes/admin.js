const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Report = require('../models/Report');

// In-memory snapshot ring buffer: up to 40 points (20 min at 30s interval)
const onlineHistory = [];
const ONLINE_WINDOW_MS = 5 * 60 * 1000;  // users active within 5 min = "online"
const HISTORY_MAX = 40;

// GET /api/admin/online — current online count + history sparkline
router.get('/online', auth, admin, async (req, res) => {
  try {
    const since = new Date(Date.now() - ONLINE_WINDOW_MS);
    const current = await User.countDocuments({ lastActiveAt: { $gte: since } });
    const now = new Date();
    const label = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    onlineHistory.push({ label, count: current });
    if (onlineHistory.length > HISTORY_MAX) onlineHistory.shift();
    res.json({ current, history: [...onlineHistory] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

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

// GET /api/admin/trends?period=week|month|year — time-series activity data
router.get('/trends', auth, admin, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let startDate, groupFormat;

    if (period === 'year') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      groupFormat = '%Y-%m';
    } else if (period === 'month') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      startDate = d;
      groupFormat = '%Y-%m-%d';
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      startDate = d;
      groupFormat = '%Y-%m-%d';
    }

    const pipeline = [
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];

    const [userTrend, listingTrend, transactionTrend, reportTrend] = await Promise.all([
      User.aggregate(pipeline),
      Listing.aggregate(pipeline),
      Transaction.aggregate(pipeline),
      Report.aggregate(pipeline),
    ]);

    // Generate all bucket keys in order
    const buckets = [];
    if (period === 'year') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    } else {
      const days = period === 'month' ? 30 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        );
      }
    }

    const toSeries = (data) => {
      const map = {};
      data.forEach(({ _id, count }) => { map[_id] = count; });
      return buckets.map(b => map[b] || 0);
    };

    const labels = buckets.map(b => {
      if (period === 'year') {
        const [y, m] = b.split('-');
        return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      const d = new Date(b + 'T12:00:00');
      if (period === 'month') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    res.json({
      period,
      labels,
      users:        toSeries(userTrend),
      listings:     toSeries(listingTrend),
      transactions: toSeries(transactionTrend),
      reports:      toSeries(reportTrend),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/transactions?status=... — all transactions for admin drilldown
router.get('/transactions', auth, admin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .populate('listing', 'title price')
      .populate('buyer',   'username')
      .populate('seller',  'username')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
