// components/CommunityBlog.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommunityBlog = () => {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/community');
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching community posts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/community', formData);
      setFormData({ title: '', content: '', category: '' });
      setShowForm(false);
      fetchPosts();
      alert('Your post has been submitted for approval!');
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`/api/community/${postId}/like`);
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div className="community-blog">
      <div className="community-header">
        <h2>Community Blog</h2>
        <button onClick={() => setShowForm(!showForm)} className="submit-post-btn">
          Submit Your Post
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="post-form">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            <option value="opinion">Opinion</option>
            <option value="experience">Personal Experience</option>
            <option value="suggestion">Suggestion</option>
            <option value="story">Story</option>
          </select>
          <textarea
            placeholder="Write your post..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
          />
          <button type="submit">Submit for Approval</button>
        </form>
      )}

      <div className="posts-grid">
        {posts.map(post => (
          <div key={post._id} className="community-post">
            <h3>{post.title}</h3>
            <div className="post-meta">
              <span>By {post.author?.name}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span className={`status ${post.status}`}>{post.status}</span>
            </div>
            <p>{post.content}</p>
            <div className="post-actions">
              <button onClick={() => handleLike(post._id)} className="like-btn">
                ❤️ {post.likes.length}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityBlog;