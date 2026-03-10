const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// 发送消息
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, listingId, content } = req.body;
    if (!receiverId || !listingId || !content) {
      return res.status(400).json({ message: 'receiverId, listingId and content are required' });
    }
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      listing: listingId,
      content
    });
    await message.save();
    await message.populate('sender', 'username');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 获取某个listing的对话（当前用户与对方的消息）
router.get('/listing/:listingId', auth, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { withUser } = req.query; // 对方的userId

    const filter = {
      listing: listingId,
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    };

    if (withUser) {
      filter.$or = [
        { sender: req.user.id,  receiver: withUser },
        { sender: withUser,     receiver: req.user.id }
      ];
    }

    const messages = await Message.find(filter)
      .populate('sender', 'username')
      .populate('receiver', 'username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 获取当前用户的所有会话列表（每个listing+对方只返回最新一条）
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender',   'username')
      .populate('receiver', 'username')
      .populate('listing',  'title')
      .sort({ createdAt: -1 });

    // 按 listing + 对方用户 去重，只保留最新一条
    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const otherId = msg.sender._id.toString() === req.user.id
        ? msg.receiver._id.toString()
        : msg.sender._id.toString();
      const key = `${msg.listing._id}-${otherId}`;
      if (!seen.has(key)) {
        seen.add(key);
        conversations.push(msg);
      }
    }

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 将消息标记为已读
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });
    message.read = true;
    await message.save();
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
