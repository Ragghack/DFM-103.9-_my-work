const mongoose = require('mongoose');

const AnalyticsDailySchema = new mongoose.Schema({
  date: Date,
  total_episodes: Number,
  total_articles: Number,
  total_subscribers: Number,
  episode_plays: Number,
  article_views: Number,
  new_subscribers: Number
}, { timestamps: true });

module.exports = mongoose.model('AnalyticsDaily', AnalyticsDailySchema);
