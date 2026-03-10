const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

// 获取所有listings（支持搜索和过滤）
router.get('/', async (req, res) => {
  try {
    const { keyword, course, subject, condition, minPrice, maxPrice } = req.query;
    const filter = { status: 'available' };

    if (keyword) filter.title = { $regex: keyword, $options: 'i' };
    if (course) filter.course = { $regex: course, $options: 'i' };
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (condition) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(filter)
      .populate('seller', 'username rating')
      .sort({ createdAt: -1 });

    res.json(listings);
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