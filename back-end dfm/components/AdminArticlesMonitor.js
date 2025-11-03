// components/AdminArticlesMonitor.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminArticlesMonitor = () => {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    mostLiked: null,
    mostShared: null
  });

  useEffect(() => {
    fetchArticles();
    fetchStats();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get('/api/articles?limit=50');
      setArticles(response.data.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/articles/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const shareToPlatform = async (articleId, platform) => {
    try {
      // Implement platform-specific sharing for admin
      const article = articles.find(a => a._id === articleId);
      const shareUrl = `${window.location.origin}/articles/${articleId}`;
      
      // Platform sharing logic here
      switch (platform) {
        case 'facebook':
          window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        // Add more platforms
      }
      
      // Record the share
      await axios.post(`/api/articles/${articleId}/share`);
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  return (
    <div className="admin-articles-monitor">
      <h2>Articles Performance Monitor</h2>
      
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Likes</h3>
          <p>{stats.totalLikes}</p>
        </div>
        <div className="stat-card">
          <h3>Total Comments</h3>
          <p>{stats.totalComments}</p>
        </div>
        <div className="stat-card">
          <h3>Total Shares</h3>
          <p>{stats.totalShares}</p>
        </div>
      </div>

      <div className="top-performers">
        <div className="top-article">
          <h4>Most Liked Article</h4>
          {stats.mostLiked && (
            <div>
              <h5>{stats.mostLiked.title}</h5>
              <p>Likes: {stats.mostLiked.likes.length}</p>
            </div>
          )}
        </div>
        
        <div className="top-article">
          <h4>Most Shared Article</h4>
          {stats.mostShared && (
            <div>
              <h5>{stats.mostShared.title}</h5>
              <p>Shares: {stats.mostShared.shares}</p>
            </div>
          )}
        </div>
      </div>

      <div className="articles-list">
        <h3>All Articles</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map(article => (
              <tr key={article._id}>
                <td>{article.title}</td>
                <td>{article.likes.length}</td>
                <td>{article.comments.length}</td>
                <td>{article.shares}</td>
                <td>
                  <div className="share-actions">
                    <button onClick={() => shareToPlatform(article._id, 'facebook')}>
                      FB
                    </button>
                    <button onClick={() => shareToPlatform(article._id, 'twitter')}>
                      TW
                    </button>
                    <button onClick={() => shareToPlatform(article._id, 'linkedin')}>
                      LI
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminArticlesMonitor;