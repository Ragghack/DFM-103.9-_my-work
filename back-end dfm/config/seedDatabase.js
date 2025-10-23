// seedDatabase.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// require the User model to ensure seeded users match the application model
const User = require(path.join(__dirname, '..', 'models', 'User'));

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@dfmmedia.cm' });

    if (!existingAdmin) {
      // Hash password for admin
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin2024', saltRounds);

      // Create a simple admin user
      const user = new User({
        name: 'Administrator',
        email: 'admin@dfmmedia.cm',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await user.save();

      console.log('✓ Admin user created (admin@dfmmedia.cm)');
    } else {
      console.log('✓ Admin user already exists');
      // Ensure the existing admin has a known development password hashed by the model.
      try {
        // If the admin's password appears to be hashed more than once or was created
        // before the current pre-save hashing logic, reset it to the known dev password
        // so the model's pre-save middleware will hash it correctly.
        existingAdmin.password = 'admin2024';
        // normalize role in case older records used different role names
        if (!['super_admin','admin','content_manager','editor'].includes(existingAdmin.role)) {
          existingAdmin.role = 'admin';
        }
        await existingAdmin.save();
        console.log('✓ Admin password reset to default (development)');
      } catch (e) {
        console.error('Could not reset existing admin password:', e.message || e);
      }
    }

    // Check if default settings exist
    const existingSettings = await mongoose.connection.collection('website_settings').findOne();

    if (!existingSettings) {
      // Insert default settings
      await mongoose.connection.collection('website_settings').insertOne({
        site_title: 'DFM Media',
        site_description: 'DFM Media is a leading source for news, economy, and finance information in Cameroon and Africa.',
        contact_email: 'contact@dfmmedia.cm',
        contact_phone: '+237 6XX XXX XXX',
        primary_color: '#D4AF37',
        default_language: 'en',
        theme: 'light',
        social_links: {
          facebook: '',
          twitter: '',
          linkedin: '',
          youtube: ''
        },
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✓ Default website settings created');
    } else {
      console.log('✓ Website settings already exist');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;