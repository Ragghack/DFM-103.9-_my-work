const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

// Mock data - replace with actual model
let subscribers = [
  { id: 1, email: 'subscriber1@example.com', subscribedAt: new Date(), status: 'active' },
  { id: 2, email: 'subscriber2@example.com', subscribedAt: new Date(), status: 'active' }
];

// Public subscription
router.post('/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const existing = subscribers.find(s => s.email === email);
  if (existing) return res.status(400).json({ message: 'Already subscribed' });

  const newSub = {
    id: subscribers.length + 1,
    email,
    subscribedAt: new Date(),
    status: 'active'
  };
  subscribers.push(newSub);

  res.json({ message: 'Successfully subscribed', subscriber: newSub });
});

router.post('/unsubscribe', (req, res) => {
  const { email } = req.body;
  subscribers = subscribers.filter(s => s.email !== email);
  res.json({ message: 'Successfully unsubscribed' });
});

// Protected routes (admin)
router.get('/subscribers', auth, adminAuth, (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);

  const paginatedSubs = subscribers.slice(startIndex, endIndex);
  res.json({
    subscribers: paginatedSubs,
    total: subscribers.length,
    page: parseInt(page),
    totalPages: Math.ceil(subscribers.length / limit)
  });
});

router.get('/stats', auth, adminAuth, (req, res) => {
  res.json({
    totalSubscribers: subscribers.length,
    activeSubscribers: subscribers.filter(s => s.status === 'active').length,
    openRate: '72%',
    clickRate: '34%'
  });
});

router.post('/send', auth, adminAuth, (req, res) => {
  const { subject, content } = req.body;
  // In real app, integrate with email service like SendGrid, Mailchimp, etc.
  res.json({ 
    message: 'Newsletter sent successfully', 
    recipients: subscribers.length,
    subject 
  });
});

router.delete('/subscribers/:id', auth, adminAuth, (req, res) => {
  const { id } = req.params;
  subscribers = subscribers.filter(s => s.id !== parseInt(id));
  res.json({ message: 'Subscriber deleted' });
});

module.exports = router;