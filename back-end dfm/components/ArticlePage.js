// components/ArticlePage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await axios.get(`/api/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/articles/${id}/like`);
      setArticle(prev => ({
        ...prev,
        likes: response.data.liked ? [...prev.likes, 'current-user'] : prev.likes.filter(like => like !== 'current-user')
      }));
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/articles/${id}/comment`, { content: comment });
      setComment('');
      fetchArticle(); // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleShare = async (platform) => {
    try {
      await axios.post(`/api/articles/${id}/share`);
      // Implement platform-specific sharing
      const shareUrl = window.location.href;
      const title = article.title;
      
      switch (platform) {
        case 'facebook':
          window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        default:
          navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <div className="article-page">
      <article className="article-content">
        <h1>{article.title}</h1>
        <div className="article-meta">
          <span>By {article.author?.name}</span>
          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          <span>{article.category}</span>
        </div>
        
        <img src={article.image} alt={article.title} className="article-image" />
        
        <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content }} />
        
        <div className="article-actions">
          <button onClick={handleLike} className={`like-btn ${article.likes.includes('current-user') ? 'liked' : ''}`}>
            ❤️ {article.likes.length}
          </button>
          
          <div className="share-buttons">
            <button onClick={() => handleShare('facebook')}>Share on Facebook</button>
            <button onClick={() => handleShare('twitter')}>Share on Twitter</button>
            <button onClick={() => handleShare('linkedin')}>Share on LinkedIn</button>
            <button onClick={() => handleShare('copy')}>Copy Link</button>
          </div>
        </div>
      </article>

      <section className="comments-section">
        <h3>Comments ({article.comments.length})</h3>
        
        <form onSubmit={handleComment} className="comment-form">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            required
          />
          <button type="submit">Post Comment</button>
        </form>

        <div className="comments-list">
          {article.comments.map(comment => (
            <div key={comment._id} className="comment">
              <strong>{comment.user?.name}</strong>
              <p>{comment.content}</p>
              <small>{new Date(comment.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ArticlePage;