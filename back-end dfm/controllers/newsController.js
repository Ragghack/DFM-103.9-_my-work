const News = require('../models/News');

// Create news (admin)
exports.createNews = async (req, res) => {
  try {
    const payload = req.body;
    if (req.user) payload.author = req.user._id;

    const news = new News(payload);
    await news.save();
    res.status(201).json({ news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List news (public) - only published by default
exports.listNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured } = req.query;
    const filter = {};

    // by default public API returns only published
    filter.status = 'published';
    if (category) filter.category = category;
    if (featured) filter.featured = featured === 'true';

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      News.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      News.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single by slug or id
exports.getNews = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let news;
    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
      news = await News.findById(idOrSlug).populate('author', '-password').lean();
    } else {
      news = await News.findOne({ slug: idOrSlug, status: 'published' }).populate('author', '-password').lean();
    }

    if (!news) return res.status(404).json({ message: 'Not found' });

    // increment views (fire-and-forget)
    News.findByIdAndUpdate(news._id, { $inc: { views: 1 } }).exec();

    res.json({ news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update news (admin)
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const news = await News.findByIdAndUpdate(id, payload, { new: true });
    if (!news) return res.status(404).json({ message: 'Not found' });
    res.json({ news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete news (admin)
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByIdAndDelete(id);
    if (!news) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Publish/schedule endpoint (admin)
exports.publishNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduleDate } = req.body;
    const update = { status };
    if (scheduleDate) update.scheduleDate = scheduleDate;
    const news = await News.findByIdAndUpdate(id, update, { new: true });
    if (!news) return res.status(404).json({ message: 'Not found' });
    res.json({ news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
