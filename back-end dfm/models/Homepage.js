const mongoose = require('mongoose');

const homepageSchema = new mongoose.Schema({
  breakingNews: {
    type: String,
    default: "DFM Radio launches its news portal | Follow economy, politics and sports live | New tax reform announced for 2025 | World Cup preparations underway | Inflation down for the 3rd consecutive month"
  },
  featuredArticle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    default: null
  },
  quickLinks: {
    economy: { type: String, default: "Market trends and analysis" },
    finance: { type: String, default: "Banking and investment news" },
    articles: { type: String, default: "In-depth analysis and reports" },
    actuality: { type: String, default: "Current events and programs" }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Homepage', homepageSchema);