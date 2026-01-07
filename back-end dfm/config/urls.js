// config/urls.js
const config = {
  // Base URL for the application
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  
  // Upload directory
  uploadDir: '/uploads/',
  
  // Format a URL for frontend display
  formatUrl: function(url) {
    if (!url) return null;
    
    // Already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Relative URL starting with /
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    
    // Relative URL without / (assume it's in uploads)
    return `${this.baseUrl}${this.uploadDir}${url}`;
  },
  
  // Extract relative path from full URL
  getRelativePath: function(fullUrl) {
    if (!fullUrl) return null;
    
    // Remove base URL if present
    if (fullUrl.startsWith(this.baseUrl)) {
      return fullUrl.replace(this.baseUrl, '');
    }
    
    return fullUrl;
  }
};

module.exports = config;