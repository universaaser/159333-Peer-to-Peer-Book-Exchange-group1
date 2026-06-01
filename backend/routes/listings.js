const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 获取所有listings（支持搜索和过滤）
router.get('/', async (req, res) => {
  try {
    const { keyword, course, subject, condition, minPrice, maxPrice, status, includeFlagged, sellerId, sellerName } = req.query;

    // 默认只显示 available，admin 可以传 status 覆盖
    const filter = {};
    filter.status = status || 'available';

    if (sellerId) filter.seller = sellerId;

    if (sellerName) {
      const matchedUsers = await User.find({ username: { $regex: sellerName, $options: 'i' } }).select('_id');
      filter.seller = { $in: matchedUsers.map(u => u._id) };
    }

    if (keyword) filter.title = { $regex: keyword, $options: 'i' };
    if (course) filter.course = { $regex: course, $options: 'i' };
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (condition) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (includeFlagged === 'true' && !status) {
      delete filter.status; // 无 status 过滤时返回所有状态（含 pending/flagged）
    }

    const listings = await Listing.find(filter)
      .populate('seller', 'username rating')
      .sort({ createdAt: -1 });

    // 兼容 admin panel 期望的 { data: [] } 格式
    const acceptsDataWrapper = includeFlagged === 'true' || status;
    res.json(acceptsDataWrapper ? { data: listings } : listings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 创建新listing（需要登录）
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, price, condition, images, course, subject } = req.body;
    const listing = new Listing({
      title, description, price, condition, images, course, subject,
      seller: req.user.id
    });
    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 获取单个listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'username email rating');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 编辑 listing 内容（仅发布者）
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, price, condition, images, course, subject } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    if (title       !== undefined) listing.title       = title;
    if (description !== undefined) listing.description = description;
    if (price       !== undefined) listing.price       = Number(price);
    if (condition   !== undefined) listing.condition   = condition;
    if (images      !== undefined) listing.images      = images;
    if (course      !== undefined) listing.course      = course;
    if (subject     !== undefined) listing.subject     = subject;

    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 更新listing状态（admin 或发布者）
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['available', 'reserved', 'sold', 'removed'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // 只有发布者或 admin 可以改状态
    if (listing.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    listing.status = status;
    // admin 处理后清除 flagged 标记
    if (req.user.role === 'admin') {
      listing.flagged = false;
      listing.flagReason = '';
    }
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 删除listing（只有发布者可以删除）
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;