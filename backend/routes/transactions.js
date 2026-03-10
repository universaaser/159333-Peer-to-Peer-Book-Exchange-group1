const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

// 买家发起交易
router.post('/', auth, async (req, res) => {
  try {
    const { listingId, type } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'available')
      return res.status(400).json({ message: 'Listing is not available' });
    if (listing.seller.toString() === req.user.id)
      return res.status(400).json({ message: 'Cannot buy your own listing' });

    const transaction = new Transaction({
      listing: listing._id,
      buyer:   req.user.id,
      seller:  listing.seller,
      price:   listing.price,
      type:    type || 'sale'
    });
    await transaction.save();

    // listing 保持 available，等待卖家确认
    await transaction.populate('listing', 'title');
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 获取当前用户的所有交易（买方或卖方）
router.get('/my', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ buyer: req.user.id }, { seller: req.user.id }]
    })
      .populate('listing', 'title price images')
      .populate('buyer',   'username')
      .populate('seller',  'username')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 更新交易状态
// 权限规则：
//   卖家可操作：confirmed（接受）、cancelled（拒绝）、completed（确认完成）
//   买家可操作：cancelled（撤回申请，仅限 pending 阶段）
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const userId   = req.user.id;
    const isBuyer  = transaction.buyer.toString()  === userId;
    const isSeller = transaction.seller.toString() === userId;
    if (!isBuyer && !isSeller)
      return res.status(403).json({ message: 'Not authorized' });

    // 权限校验
    if (isBuyer && status !== 'cancelled')
      return res.status(403).json({ message: 'Buyers can only cancel a transaction' });
    if (isBuyer && transaction.status !== 'pending')
      return res.status(400).json({ message: 'Can only cancel a pending transaction' });
    if (isSeller && !['confirmed', 'completed', 'cancelled'].includes(status))
      return res.status(400).json({ message: 'Invalid status for seller' });

    // 状态流转校验
    const validTransitions = {
      pending:   ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    if (!validTransitions[transaction.status].includes(status))
      return res.status(400).json({ message: `Cannot transition from ${transaction.status} to ${status}` });

    transaction.status = status;
    await transaction.save();

    // 同步更新 listing 状态
    const listing = await Listing.findById(transaction.listing);
    if (listing) {
      if (status === 'confirmed')  listing.status = 'reserved';
      if (status === 'completed')  listing.status = 'sold';
      if (status === 'cancelled')  listing.status = 'available';
      await listing.save();
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
