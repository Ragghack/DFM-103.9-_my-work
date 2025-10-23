const Article = require('../models/Article');
const News = require('../models/News');
const mongoose = require('mongoose');
const User = require('../models/User');
const AnalyticsDaily = require('../models/AnalyticsDaily');
// For episodes/emissions we may not have a full model yet; attempt to require
let Emission;
try { Emission = require('../models/Emission'); } catch (e) { Emission = null; }

exports.dashboardStats = async (req, res) => {
  try {
    const counts = {};

    const [articlesCount, newsCount] = await Promise.all([
      Article.countDocuments({}),
      News.countDocuments({})
    ]);

    counts.articles = articlesCount;
    counts.news = newsCount;

    if (Emission) counts.episodes = await Emission.countDocuments({});
    else counts.episodes = 0;

    // newsletter subscribers collection (if exists)
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);
    if (names.includes('newsletter_subscribers')) {
      counts.subscribers = await db.collection('newsletter_subscribers').countDocuments();
    } else {
      counts.subscribers = 0;
    }

    // recent items: latest 5 from news and articles combined
    const recentNews = await News.find({}).sort({ createdAt: -1 }).limit(5).select('title createdAt').lean();
    const recentArticles = await Article.find({}).sort({ createdAt: -1 }).limit(5).select('title createdAt').lean();

    // merge and sort by date
    const recent = recentNews.map(n => ({ type: 'news', title: n.title, date: n.createdAt }))
      .concat(recentArticles.map(a => ({ type: 'article', title: a.title, date: a.createdAt })))
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .slice(0,5);

    res.json({ counts, recent });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
