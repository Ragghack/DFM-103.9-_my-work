// components/Newsletter.js
import React, { useState } from 'react';
import axios from 'axios';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/newsletter/subscribe', { email });
      setMessage('Successfully subscribed to our newsletter!');
      setIsSubscribed(true);
      setEmail('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Subscription failed');
    }
  };

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/newsletter/unsubscribe', { email });
      setMessage('Successfully unsubscribed from newsletter');
      setIsSubscribed(false);
      setEmail('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unsubscription failed');
    }
  };

  return (
    <div className="newsletter-section">
      <h3>Stay Informed with Our Newsletter</h3>
      <p>Get the latest news and updates delivered to your inbox</p>
      
      {message && <div className="newsletter-message">{message}</div>}
      
      <form onSubmit={isSubscribed ? handleUnsubscribe : handleSubscribe} className="newsletter-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit">
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </form>
    </div>
  );
};

export default Newsletter;