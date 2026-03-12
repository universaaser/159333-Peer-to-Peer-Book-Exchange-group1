const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const buildFilter = (query) => {
  const {
    keyword,
    course,
    subject,
    condition,
    materialType,
    availability,
    status,
    minPrice,
    maxPrice,
    tags,
    includeFlagged
  } = query;

  const filter = {};
  if (keyword) filter.$text = { $search: keyword };
  if (course) filter.course = { $regex: course, $options: 'i' };
  if (subject) filter.subject = { $regex: subject, $options: 'i' };
  if (condition) filter.condition = condition;
  if (materialType) filter.materialType = { $regex: materialType, $options: 'i' };
  if (availability) filter.availability = availability;
  const statusFilter = status || 'available';
  filter.status = statusFilter;
  if (!includeFlagged) filter.flagged = false;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (tags) {
    const normalized = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (normalized.length) filter.tags = { $all: normalized };
  }

  return filter;
};

router.get('/', async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const limit = Math.min(Number(req.query.limit) || 30, 60);
    const page = Math.max(Number(req.query.page) || 0, 0);

    const listings = await Listing.find(filter)
      .populate('seller', 'username rating role')
      .sort({ [sortField]: sortOrder })
      .skip(page * limit)
      .limit(limit);

    let filtered = listings;
    if (req.query.minSellerRating) {
      const threshold = Number(req.query.minSellerRating);
      if (!Number.isNaN(threshold)) {
        filtered = listings.filter(listing => (listing.seller?.rating ?? 0) >= threshold);
      }
    }

    res.json({
      data: filtered,
      meta: {
        page,
        limit,
        total: filtered.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/recommended', async (req, res) => {
  try {
    const { course, subject } = req.query;
    const filter = { status: 'available', flagged: false };
    if (course) filter.course = { $regex: course, $options: 'i' };
    if (subject) filter.subject = { $regex: subject, $options: 'i' };

    const recommended = await Listing.find(filter)
      .populate('seller', 'username rating')
      .sort({ recommendScore: -1, views: -1, createdAt: -1 })
      .limit(8);

    res.json(recommended);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/moderation/pending', auth, admin, async (req, res) => {
  try {
    const listings = await Listing.find({
      $or: [
        { flagged: true },
        { status: { $in: ['pending'] } }
      ]
    })
      .sort({ updatedAt: -1 })
      .populate('seller', 'username email rating');
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      materialType,
      images = [],
      course,
      subject,
      tags = []
    } = req.body;

    const listing = new Listing({
      title,
      description,
      price,
      condition,
      materialType,
      images,
      course,
      subject,
      tags,
      seller: req.user.id,
      availability: 'pending',
      status: 'pending'
    });
    await listing.save();

    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'available', 'reserved', 'sold', 'removed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.status = status;
    listing.availability = status;
    await listing.save();

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:id/flag', auth, admin, async (req, res) => {
  try {
    const { flagged, reason } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.flagged = typeof flagged === 'boolean' ? flagged : !listing.flagged;
    if (typeof reason === 'string') listing.flagReason = reason;
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'username email rating');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.incrementViews();
    await listing.save();

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
