const Article = require('../models/Article');

exports.createArticle = async (req, res) => {
  try {
    const payload = req.body;
    if (req.user) payload.author_id = req.user._id;
    const article = new Article(payload);
    await article.save();
    res.status(201).json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Article.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).lean();
    if (!article) return res.status(404).json({ message: 'Not found' });
    res.json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) return res.status(404).json({ message: 'Not found' });
    res.json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
