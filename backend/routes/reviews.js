const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const {
      revieweeId,
      listingId,
      transactionId,
      rating,
      comment,
      type
    } = req.body;

    if (!revieweeId || !rating) {
      return res.status(400).json({ message: 'revieweeId and rating are required' });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existing = await Review.findOne({
      reviewer: req.user.id,
      reviewee: revieweeId,
      listing: listingId
    });
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this item/user' });
    }

    const review = new Review({
      reviewer: req.user.id,
      reviewee: revieweeId,
      listing: listingId,
      transaction: transactionId,
      rating: numericRating,
      comment,
      type
    });
    await review.save();

    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      reviewee.updateRating(numericRating);
      await reviewee.save();
    }

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/user/:id', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'username avatar')
      .populate('listing', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/listing/:id', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ listing: req.params.id })
      .populate('reviewer', 'username avatar')
      .populate('reviewee', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
