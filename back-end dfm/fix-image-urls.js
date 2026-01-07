// fix-image-urls.js - Migration script for economy article image URLs
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'dfm.env') });

async function fixImageUrls() {
  try {
    console.log('Starting image URL migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dfm_media', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Dynamically require the model
    const EconomyArticle = require(path.join(__dirname, 'models', 'EconomyArticle'));
    
    // Find all articles with image_url
    const articles = await EconomyArticle.find({
      image_url: { $exists: true, $ne: null }
    });
    
    console.log(`Found ${articles.length} articles with image URLs`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const article of articles) {
      try {
        const oldUrl = article.image_url;
        
        // Skip if no URL or already a Cloudinary URL
        if (!oldUrl) {
          skippedCount++;
          continue;
        }
        
        // Skip Cloudinary URLs (they should stay as full URLs)
        if (oldUrl.includes('cloudinary.com') || 
            oldUrl.includes('res.cloudinary.com')) {
          console.log(`Skipping Cloudinary URL: ${oldUrl.substring(0, 50)}...`);
          skippedCount++;
          continue;
        }
        
        // Fix localhost:5000 duplicates
        if (oldUrl.includes('localhost:5000localhost:5000')) {
          const newUrl = oldUrl.replace('localhost:5000localhost:5000', 'localhost:5000');
          await EconomyArticle.updateOne(
            { _id: article._id },
            { $set: { image_url: newUrl } }
          );
          console.log(`Fixed duplicate localhost: ${oldUrl.substring(0, 50)}...`);
          fixedCount++;
          continue;
        }
        
        // Convert full local URLs to relative paths
        if (oldUrl.startsWith('http://localhost:5000/uploads/')) {
          const newUrl = oldUrl.replace('http://localhost:5000', '');
          await EconomyArticle.updateOne(
            { _id: article._id },
            { $set: { image_url: newUrl } }
          );
          console.log(`Converted to relative: ${oldUrl} → ${newUrl}`);
          fixedCount++;
        }
        // Ensure relative paths start with /
        else if (oldUrl.startsWith('uploads/') && !oldUrl.startsWith('/uploads/')) {
          const newUrl = '/' + oldUrl;
          await EconomyArticle.updateOne(
            { _id: article._id },
            { $set: { image_url: newUrl } }
          );
          console.log(`Added leading slash: ${oldUrl} → ${newUrl}`);
          fixedCount++;
        }
        // Already correct relative path
        else if (oldUrl.startsWith('/uploads/')) {
          console.log(`Already correct: ${oldUrl.substring(0, 50)}...`);
          skippedCount++;
        }
        // External URLs (should remain as is)
        else if (oldUrl.startsWith('http://') || oldUrl.startsWith('https://')) {
          console.log(`Keeping external URL: ${oldUrl.substring(0, 50)}...`);
          skippedCount++;
        }
        // Unknown format
        else {
          console.log(`Unknown URL format, keeping as is: ${oldUrl.substring(0, 50)}...`);
          skippedCount++;
        }
        
      } catch (articleError) {
        console.error(`Error processing article ${article._id}:`, articleError.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total articles processed: ${articles.length}`);
    console.log(`Fixed URLs: ${fixedCount}`);
    console.log(`Skipped (already correct): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
fixImageUrls();